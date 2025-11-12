import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { studyGuidePreview } = await request.json();

    if (!studyGuidePreview || typeof studyGuidePreview !== 'string') {
      return new Response('Invalid request: studyGuidePreview required', {
        status: 400,
      });
    }

    // Get first 300 characters
    const preview = studyGuidePreview.substring(0, 300);

    // Call Claude to generate a concise title
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      temperature: 0.7,
      system: 'You are a title generator. You must respond with ONLY valid JSON, no markdown formatting, no code blocks, no additional text.',
      messages: [
        {
          role: 'user',
          content: `Based on the following preview of a study guide, generate a concise title that captures the main topics covered. The title should be ~10 words and consist mainly of keywords separated by commas.

Study guide preview:
${preview}

Return ONLY a JSON object with a single "title" field, like this: {"title": "Biology, Cell Structure, Cell Functions"}

Do not wrap your response in markdown code blocks. Return ONLY the raw JSON.`,
        },
      ],
    });

    // Extract the title from the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Clean up the response text (remove markdown code blocks if present)
    let jsonText = content.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse JSON response
    const titleData = JSON.parse(jsonText.trim());
    const title = titleData.title || 'Untitled Study Guide';

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating title:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate title' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
