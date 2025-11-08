import { NextRequest, NextResponse } from 'next/server';
import officeParser from 'officeparser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.ppt') && !fileName.endsWith('.pptx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PPT and PPTX files are supported.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();

    // Configure officeparser to include notes
    const config = {
      newlineDelimiter: '\n',
      ignoreNotes: false,
      putNotesAtLast: true,
    };

    // Extract text from PPT
    const extractedText = await officeParser.parseOfficeAsync(arrayBuffer, config);

    // Estimate page count (rough estimation based on slide delimiters)
    // PPT parsers typically separate slides with multiple newlines
    const slidePattern = /\n{3,}/g;
    const slides = extractedText.split(slidePattern).filter(s => s.trim().length > 0);
    const pageCount = Math.max(slides.length, 1);

    // Validate page limit (15 pages max)
    if (pageCount > 15) {
      return NextResponse.json(
        { error: `PPT file has ${pageCount} slides. Maximum 15 slides allowed.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: extractedText,
      pageCount,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error processing PPT file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process PPT file' },
      { status: 500 }
    );
  }
}
