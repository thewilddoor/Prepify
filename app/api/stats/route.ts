import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const STATS_FILE = path.join(process.cwd(), 'data', 'stats.json');

interface Stats {
  totalGenerations: number;
}

// Helper to ensure stats file exists
async function ensureStatsFile(): Promise<Stats> {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create it with initial values
    const initialStats: Stats = { totalGenerations: 0 };
    await fs.mkdir(path.dirname(STATS_FILE), { recursive: true });
    await fs.writeFile(STATS_FILE, JSON.stringify(initialStats, null, 2));
    return initialStats;
  }
}

// GET: Read current stats
export async function GET(request: NextRequest) {
  try {
    const stats = await ensureStatsFile();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error reading stats:', error);
    return NextResponse.json(
      { error: 'Failed to read stats' },
      { status: 500 }
    );
  }
}

// POST: Increment generation count
export async function POST(request: NextRequest) {
  try {
    const stats = await ensureStatsFile();
    stats.totalGenerations += 1;

    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error updating stats:', error);
    return NextResponse.json(
      { error: 'Failed to update stats' },
      { status: 500 }
    );
  }
}
