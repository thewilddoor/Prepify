# Assignment Prep AI

An AI-powered study guide generator that transforms student notes and past questions into new practice materials using Claude AI with extended thinking.

## Features

- **Image Upload**: Drag-and-drop interface for uploading study materials (notes, past quizzes, etc.)
- **AI-Powered Generation**: Uses Claude Sonnet 4.5 with extended thinking to generate practice questions
- **Real-time Agentic View**: Watch Claude's thinking process in real-time as it generates content
- **Study Guide Export**: Download generated study guides as PDF or DOCX
- **Client-Side Storage**: All data stored locally in browser using IndexedDB
- **Beautiful UI**: Minimalist design with smooth animations using Framer Motion

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **AI**: Anthropic Claude API (Sonnet 4.5) with extended thinking
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **Animations**: Framer Motion
- **Storage**: IndexedDB (via Dexie.js)
- **File Processing**: react-dropzone, jsPDF, html-docx-js
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd assignment-prep-ai/app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload Images**: Drag and drop or click to upload images of your notes or past quiz questions
2. **Add Context** (Optional): Add descriptions to images for better AI understanding
3. **Generate**: Click "Generate Study Guide" to start the AI generation process
4. **Watch Progress**: View Claude's thinking process in real-time on the generation page
5. **Review & Download**: Once complete, review your study guide and download as PDF or DOCX

## Project Structure

```
app/
├── app/
│   ├── api/
│   │   ├── generate/route.ts          # Streaming generation endpoint
│   │   └── download/
│   │       ├── pdf/route.ts           # PDF export
│   │       └── docx/route.ts          # DOCX export
│   ├── generate/[sessionId]/          # Generation page
│   ├── result/[sessionId]/            # Results page
│   ├── page.tsx                       # Upload page
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Global styles
├── components/
│   ├── ui/                            # shadcn components
│   ├── upload-zone.tsx                # Image upload component
│   ├── agentic-viewer.tsx             # Real-time generation viewer
│   ├── step-card.tsx                  # Step display component
│   ├── thinking-block.tsx             # Extended thinking display
│   ├── study-guide-viewer.tsx         # Results viewer
│   └── download-buttons.tsx           # Export buttons
├── lib/
│   ├── db.ts                          # IndexedDB setup
│   ├── session.ts                     # Session management
│   └── utils.ts                       # Utility functions
└── types/
    └── index.ts                       # TypeScript types
```

## Design System

The application uses a minimal 3-color palette:
- **Professional White**: #FFFFFF (backgrounds)
- **Professional Black**: #0A0A0A (text, dark backgrounds)
- **Light Purple**: #A78BFA (accents, highlights)

Design principles:
- Ultra minimalistic, boundless (no borders, use shadows)
- Generous whitespace
- Large readable text
- Smooth animations
- Premium feel inspired by Apple/Linear

## API Routes

### POST `/api/generate`
Streams AI-generated study guide content using Server-Sent Events (SSE).

**Request Body:**
```json
{
  "images": ["base64_image_1", "base64_image_2"],
  "descriptions": ["optional context", "more context"]
}
```

**Response:** SSE stream with events:
- `init`: Generation started
- `step_start`: New processing step
- `step_update`: Content update for current step
- `step_complete`: Step finished
- `complete`: Generation complete
- `error`: Error occurred

### POST `/api/download/pdf`
Generates and downloads PDF version of study guide.

### POST `/api/download/docx`
Generates and downloads DOCX version of study guide.

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)

## Features in Detail

### Extended Thinking
The application uses Claude's extended thinking feature, allowing you to see the AI's reasoning process in real-time as it analyzes your materials and generates questions.

### Image Compression
Images are automatically compressed client-side if they exceed 5MB to ensure fast processing while maintaining quality.

### Session Management
All sessions are stored in browser IndexedDB and automatically cleaned up after 7 days to save storage space.

### Responsive Design
The application is fully responsive and works on mobile, tablet, and desktop devices.

## Building for Production

```bash
npm run build
npm run start
```

## Troubleshooting

### "Session not found" error
- Check that IndexedDB is enabled in your browser
- Clear browser cache and try again

### Images not uploading
- Ensure images are under 10MB each
- Try using JPG or PNG format
- Check browser console for errors

### Generation fails
- Verify your Anthropic API key is correct
- Check API key has sufficient credits
- Ensure network connection is stable

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
