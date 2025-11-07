import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert educational AI that creates practice study materials.

Your task:
1. Analyze the provided images (student notes and past quiz questions)
2. Identify:
   - Key topics and concepts
   - Question types and formats
   - Difficulty level and complexity
   - Learning objectives being tested
3. Generate a NEW study guide with:
   - 15-20 practice questions
   - Same difficulty level as originals
   - Same topics/concepts covered
   - Different questions (not copies)
   - Clear, well-formatted layout
4. Use code execution if needed to analyze question patterns
5. Format the final output as a complete study guide with sections

IMPORTANT - Mathematical Content:
When including mathematical equations, formulas, or expressions, ALWAYS use LaTeX notation:
- For inline math (within text): Use single dollar signs like $E = mc^2$ or $\\alpha + \\beta$
- For display math (centered, on separate lines): Use double dollar signs:
  $$
  \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
  $$

Use LaTeX for:
- Equations and formulas: $F = ma$, $\\Delta E = mc^2$
- Fractions: $\\frac{a}{b}$, $\\frac{dy}{dx}$
- Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\Delta$, $\\theta$
- Subscripts/superscripts: $x_i^2$, $a_n$
- Integrals and sums: $\\int_a^b f(x)dx$, $\\sum_{i=1}^n a_i$
- Roots: $\\sqrt{x}$, $\\sqrt[3]{x}$
- Matrices: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$
- Chemical formulas: $H_2O$, $CO_2$, $C_6H_{12}O_6$

Examples:
- "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
- "Calculate the derivative: $$\\frac{d}{dx}(x^2 + 3x) = 2x + 3$$"
- "Water ($H_2O$) consists of 2 hydrogen atoms and 1 oxygen atom"

Be thorough in your thinking process - the student will see your extended thinking in real-time.`;

export async function POST(request: NextRequest) {
  try {
    const { images, descriptions } = await request.json();

    if (!images || !Array.isArray(images)) {
      return new Response('Invalid request: images array required', {
        status: 400,
      });
    }

    // Create message content with images
    const messageContent: Anthropic.MessageParam['content'] = [
      {
        type: 'text',
        text: `Please analyze these images of student notes and past quiz questions, then generate a new practice study guide.${
          descriptions?.length > 0
            ? `\n\nContext provided:\n${descriptions.map((d: string, i: number) => `Image ${i + 1}: ${d}`).join('\n')}`
            : ''
        }`,
      },
      ...images.map((base64Image: string) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: base64Image,
        },
      })),
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start streaming from Anthropic with Claude Haiku 4.5
          const streamResponse = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 16000,
            temperature: 1,
            thinking: {
              type: 'enabled',
              budget_tokens: 5000, // Appropriate budget for Haiku
            },
            messages: [
              {
                role: 'user',
                content: messageContent,
              },
            ],
            system: SYSTEM_PROMPT,
            stream: true,
          });

          // Track content blocks by index
          const contentBlocks = new Map<number, {
            id: string;
            type: string;
            toolName?: string;
            toolId?: string;
          }>();

          // Helper to send SSE events
          const sseEvent = (type: string, data: any) => {
            controller.enqueue(
              encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          // Process stream events
          for await (const event of streamResponse) {
            try {
              if (event.type === 'message_start') {
                sseEvent('init', { message: 'Starting generation...' });

              } else if (event.type === 'content_block_start') {
                const index = event.index;
                const blockType = event.content_block.type;
                const stepId = `step-${Date.now()}-${index}`;

                // Store content block info
                const blockInfo: any = {
                  id: stepId,
                  type: blockType,
                };

                // Extract tool info if it's a tool_use block
                if (blockType === 'tool_use' && 'name' in event.content_block) {
                  blockInfo.toolName = event.content_block.name;
                  blockInfo.toolId = event.content_block.id;
                }

                contentBlocks.set(index, blockInfo);

                // Map block type to step type
                let stepType: string;
                if (blockType === 'thinking') {
                  stepType = 'thinking';
                } else if (blockType === 'tool_use') {
                  stepType = 'tool_use';
                } else {
                  stepType = 'generation';
                }

                sseEvent('step_start', {
                  stepId,
                  stepType,
                  toolName: blockInfo.toolName,
                  index,
                });

              } else if (event.type === 'content_block_delta') {
                const index = event.index;
                const delta = event.delta;
                const blockInfo = contentBlocks.get(index);

                if (!blockInfo) {
                  console.warn(`Received delta for unknown block index: ${index}`);
                  continue;
                }

                let content = '';
                let stepType = blockInfo.type === 'thinking' ? 'thinking' :
                              blockInfo.type === 'tool_use' ? 'tool_use' : 'generation';

                // Handle different delta types
                if (delta.type === 'text_delta' && 'text' in delta) {
                  content = delta.text;
                } else if (delta.type === 'thinking_delta' && 'thinking' in delta) {
                  content = delta.thinking;
                  stepType = 'thinking';
                } else if (delta.type === 'input_json_delta' && 'partial_json' in delta) {
                  // Tool input being streamed
                  content = delta.partial_json;
                  stepType = 'tool_use';
                }

                if (content) {
                  sseEvent('step_update', {
                    stepId: blockInfo.id,
                    content,
                    stepType,
                    index,
                  });
                }

              } else if (event.type === 'content_block_stop') {
                const index = event.index;
                const blockInfo = contentBlocks.get(index);

                if (blockInfo) {
                  sseEvent('step_complete', {
                    stepId: blockInfo.id,
                    index,
                  });
                }

              } else if (event.type === 'message_delta') {
                // Handle message metadata updates
                if ('usage' in event && event.usage) {
                  sseEvent('usage', {
                    outputTokens: event.usage.output_tokens,
                  });
                }

                if (event.delta.stop_reason) {
                  sseEvent('stop', {
                    stopReason: event.delta.stop_reason,
                  });
                }

              } else if (event.type === 'message_stop') {
                sseEvent('complete', {
                  message: 'Generation complete',
                });
              }

            } catch (eventError: any) {
              console.error('Error processing stream event:', eventError);
              sseEvent('error', {
                error: `Event processing error: ${eventError.message}`,
              });
            }
          }

          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: error.message || 'Unknown error occurred',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in generate route:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate study guide' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
