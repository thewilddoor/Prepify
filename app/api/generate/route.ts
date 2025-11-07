import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import type { StudyGuideConfig } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to build step 1 prompt with config
function buildStep1Prompt(config?: StudyGuideConfig): string {
  const questionCount = config?.questionCount || 15;
  const difficulty = config?.difficulty || 'match';
  const focusPoints = config?.focusPoints?.trim();
  const curriculum = config?.curriculum?.trim();
  const gradeLevel = config?.gradeLevel?.trim();
  const additionalInstructions = config?.additionalInstructions?.trim();

  let difficultyGuidance = '';
  if (difficulty === 'easier') {
    difficultyGuidance = 'Make the questions SLIGHTLY EASIER than the original materials, while staying within the same concepts.';
  } else if (difficulty === 'harder') {
    difficultyGuidance = 'Make the questions SLIGHTLY HARDER than the original materials, but still within the bounds of the provided concepts.';
  } else {
    difficultyGuidance = 'Match the difficulty level of the original materials.';
  }

  let contextSection = '';
  if (curriculum || gradeLevel) {
    contextSection = '\n\nContext:\n';
    if (gradeLevel) {
      contextSection += `- Target audience: ${gradeLevel} students\n`;
    }
    if (curriculum) {
      contextSection += `- Curriculum: ${curriculum}\n`;
    }
    contextSection += 'Align question style and expectations accordingly.\n';
  }

  let focusSection = '';
  if (focusPoints) {
    focusSection = `\n\nFOCUS AREAS:\nEmphasize these specific topics in your questions:\n${focusPoints}\n\nEnsure at least 60% of questions target these focus areas while still maintaining coverage of other important concepts from the materials.\n`;
  }

  let additionalSection = '';
  if (additionalInstructions) {
    additionalSection = `\n\nADDITIONAL REQUIREMENTS:\n${additionalInstructions}\n`;
  }

  return `You are an expert educational AI that creates practice study materials.

Your task (Step 1 - Questions Only):
1. Analyze the provided images (student notes and past quiz questions)
2. Identify:
   - Key topics and concepts
   - Question types and formats
   - Difficulty level and complexity
   - Learning objectives being tested
3. Generate a NEW study guide with:
   - EXACTLY ${questionCount} practice questions ONLY (NO ANSWERS)
   - ${difficultyGuidance}
   - Same topics/concepts covered in the materials
   - Different questions (not copies)
   - Clear, well-formatted layout
   - Leave space for answers to be filled in later
4. Use code execution if needed to analyze question patterns
5. Format the final output as a complete study guide with sections${contextSection}${focusSection}${additionalSection}

CRITICAL CONSTRAINT - Stay Within Bounds:
You must operate STRICTLY within the bounds of the provided materials:
- Use ONLY concepts, terminology, and knowledge present in the uploaded notes and assignments
- Match the depth and complexity of the original content - do not go deeper or introduce advanced topics
- Do not introduce concepts, frameworks, or vocabulary not covered in the materials
- If the notes are introductory-level, keep questions at that introductory level
- Maintain the same domain vocabulary and notation style used in the original materials
- The questions should feel like a natural continuation of what the student has already studied

FORMATTING RULES:

1. LaTeX for equations/symbols ONLY:
   - Use $...$ inline (same line): $E = mc^2$, $H_2O$, $\\alpha$
   - Use $$...$$ for display (same line): $$x = \\frac{-b \\pm \\sqrt{b^2}}{2a}$$
   - DO NOT use LaTeX for diagrams, graphs, or spatial layouts

2. Diagrams as text descriptions:
   - Provide clear written descriptions instead of visual representations
   - Example: "The graph shows a parabola opening upward with vertex at (0, -4)"

IMPORTANT: DO NOT include answers in this step. Only generate the questions.`;
}

// Helper function to build step 2 prompt with config
function buildStep2Prompt(config?: StudyGuideConfig): string {
  const curriculum = config?.curriculum?.trim();
  const gradeLevel = config?.gradeLevel?.trim();
  const additionalInstructions = config?.additionalInstructions?.trim();

  let contextSection = '';
  if (curriculum || gradeLevel) {
    contextSection = '\n\nContext:\n';
    if (gradeLevel) {
      contextSection += `- Target audience: ${gradeLevel} students\n`;
    }
    if (curriculum) {
      contextSection += `- Curriculum: ${curriculum}\n`;
    }
    contextSection += 'Align answer depth and explanations accordingly.\n';
  }

  let additionalSection = '';
  if (additionalInstructions) {
    additionalSection = `\n\nADDITIONAL REQUIREMENTS:\n${additionalInstructions}\n`;
  }

  return `You are an expert educational AI that creates answer sheets for study materials.

Your task (Step 2 - Answer Sheet):
1. You will receive a study guide with practice questions
2. Generate a complete answer sheet with:
   - Detailed answers for each question
   - Step-by-step solutions where applicable
   - Explanations of key concepts
   - Clear formatting that matches the question numbers
3. Format the answer sheet to be used alongside the study guide${contextSection}${additionalSection}

CRITICAL CONSTRAINT - Stay Within Bounds:
Provide answers using ONLY knowledge and concepts evident in the original uploaded materials:
- Do not introduce new concepts, theories, or advanced techniques not present in the notes
- Match the explanation depth to what was taught in the materials
- Use the same terminology and notation style from the original content
- If a question seems to require information beyond the provided materials, acknowledge this and work within the available scope
- The answers should align with the level of understanding demonstrated in the student's notes

FORMATTING RULES:

1. LaTeX for equations/symbols ONLY:
   - Use $...$ inline (same line): $E = mc^2$, $H_2O$, $\\alpha$
   - Use $$...$$ for display (same line): $$x = \\frac{-b \\pm \\sqrt{b^2}}{2a}$$
   - DO NOT use LaTeX for diagrams, graphs, or spatial layouts

2. Diagrams as text descriptions:
   - Provide clear written descriptions instead of visual representations
   - Example: "The graph shows a parabola opening upward with vertex at (0, -4)"

Be thorough in your thinking process - the student will see your extended thinking in real-time.`;
}

export async function POST(request: NextRequest) {
  try {
    const { images, descriptions, step, studyGuide, config } = await request.json();

    if (!images || !Array.isArray(images)) {
      return new Response('Invalid request: images array required', {
        status: 400,
      });
    }

    const generationStep = step || 1;
    const studyGuideConfig: StudyGuideConfig | undefined = config;

    // Validate config if provided
    if (studyGuideConfig) {
      if (studyGuideConfig.questionCount < 1 || studyGuideConfig.questionCount > 30) {
        return new Response('Invalid request: questionCount must be between 1 and 30', {
          status: 400,
        });
      }
    }

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
      systemPrompt = buildStep1Prompt(studyGuideConfig);
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
      systemPrompt = buildStep2Prompt(studyGuideConfig);
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
