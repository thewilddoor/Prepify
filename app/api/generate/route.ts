import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const STEP_1_SYSTEM_PROMPT = `You are an expert educational AI that creates practice study materials.

Your task (Step 1 - Questions Only):
1. Analyze the provided images (student notes and past quiz questions)
2. Identify:
   - Key topics and concepts
   - Question types and formats
   - Difficulty level and complexity
   - Learning objectives being tested
3. Generate a NEW study guide with:
   - 15-20 practice questions ONLY (NO ANSWERS)
   - Same difficulty level as originals
   - Same topics/concepts covered
   - Different questions (not copies)
   - Clear, well-formatted layout
   - Leave space for answers to be filled in later
4. Use code execution if needed to analyze question patterns
5. Format the final output as a complete study guide with sections

IMPORTANT: DO NOT include answers in this step. Only generate the questions.`;

const STEP_2_SYSTEM_PROMPT = `You are an expert educational AI that creates answer sheets for study materials.

Your task (Step 2 - Answer Sheet):
1. You will receive a study guide with practice questions
2. Generate a complete answer sheet with:
   - Detailed answers for each question
   - Step-by-step solutions where applicable
   - Explanations of key concepts
   - Clear formatting that matches the question numbers
3. Format the answer sheet to be used alongside the study guide

IMPORTANT - Visual/Graphical Questions:
For questions that require visualization, diagrams, graphs, or drawings:
- DO NOT attempt to create ASCII art or text-based diagrams
- Instead, provide clear, accurate TEXT DESCRIPTIONS of what should be visualized
- Describe key features, relationships, and important details in words
- Example: Instead of drawing a graph, describe: "The graph shows a parabola opening upward with vertex at (0, -4), x-intercepts at (-2, 0) and (2, 0), and y-intercept at (0, -4)"
- For molecular structures, describe the arrangement: "The molecule has a tetrahedral geometry with carbon at the center bonded to four hydrogen atoms"
- For diagrams, explain the components and their relationships clearly in prose

IMPORTANT - Mathematical Content:
When including mathematical equations, formulas, or expressions, ALWAYS use LaTeX notation:

**For inline math (within text):** Use single dollar signs on the SAME LINE
- Examples: $E = mc^2$, $\\alpha + \\beta$, $H_2O$, $Al^{3+}$, $Cl^-$

**For display math (standalone equations):** Use double dollar signs on the SAME LINE
- Examples: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$, $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

CRITICAL FORMATTING RULES:
1. Inline math: Keep $...$ on the SAME line as surrounding text
   ✓ CORRECT: "Water ($H_2O$) consists of hydrogen and oxygen"
   ✗ WRONG: "Water (
   $H_2O$
   ) consists of hydrogen and oxygen"

2. Display math: Keep $$...$$ entirely on ONE line
   ✓ CORRECT: $$E = mc^2$$
   ✗ WRONG: $$
   E = mc^2
   $$

Use LaTeX for ALL mathematical/chemical content:
- Equations: $F = ma$, $\\Delta E = mc^2$
- Fractions: $\\frac{a}{b}$, $\\frac{dy}{dx}$
- Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\Delta$, $\\theta$, $\\pi$
- Superscripts/subscripts: $x_i^2$, $a_n$, $2^{10}$
- Integrals/sums: $\\int_a^b f(x)dx$, $\\sum_{i=1}^n a_i$
- Roots: $\\sqrt{x}$, $\\sqrt[3]{x}$
- Ions: $Na^+$, $Ca^{2+}$, $O^{2-}$, $Al^{3+}$, $Cl^-$
- Chemical formulas: $H_2O$, $CO_2$, $C_6H_{12}O_6$, $NaCl$, $MgCl_2$
- Chemical compounds: $AlCl_3$, $CaCO_3$, $H_2SO_4$

Complete examples:
- "Aluminum forms $Al^{3+}$ ions and chlorine forms $Cl^-$ ions."
- "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
- "Calculate: $$\\frac{d}{dx}(x^2 + 3x) = 2x + 3$$"
- "Water ($H_2O$) reacts with carbon dioxide ($CO_2$) in photosynthesis."

Be thorough in your thinking process - the student will see your extended thinking in real-time.`;

export async function POST(request: NextRequest) {
  try {
    const { images, descriptions, step, studyGuide } = await request.json();

    if (!images || !Array.isArray(images)) {
      return new Response('Invalid request: images array required', {
        status: 400,
      });
    }

    const generationStep = step || 1;

    // Create message content based on step
    let messageContent: Anthropic.MessageParam['content'];
    let systemPrompt: string;

    if (generationStep === 1) {
      // Step 1: Generate questions from images
      messageContent = [
        {
          type: 'text',
          text: `Please analyze these images of student notes and past quiz questions, then generate a new practice study guide with QUESTIONS ONLY (no answers).${
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
      systemPrompt = STEP_1_SYSTEM_PROMPT;
    } else {
      // Step 2: Generate answers based on study guide
      if (!studyGuide) {
        return new Response('Invalid request: studyGuide required for step 2', {
          status: 400,
        });
      }
      messageContent = [
        {
          type: 'text',
          text: `Here is the study guide with practice questions:\n\n${studyGuide}\n\nPlease generate a complete answer sheet with detailed answers for all questions.`,
        },
      ];
      systemPrompt = STEP_2_SYSTEM_PROMPT;
    }

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
            system: systemPrompt,
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
