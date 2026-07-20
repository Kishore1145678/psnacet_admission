import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    error: 'File upload is disabled. Please use YouTube Video Link setting instead.'
  }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'File upload is disabled. Please use YouTube Video Link setting instead.'
  }, { status: 400 });
}
