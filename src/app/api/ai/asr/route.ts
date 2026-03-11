import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Speech-to-Text API endpoint
// Transcribes spoken audio into text for hearing-impaired students
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const base64Audio = formData.get('base64') as string;

    let audioBase64 = base64Audio;

    // If file is provided, convert to base64
    if (audioFile && !base64Audio) {
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    }

    if (!audioBase64) {
      return NextResponse.json(
        { error: 'Audio data is required (file or base64)' },
        { status: 400 }
      );
    }

    // Create ZAI instance
    const zai = await ZAI.create();

    // Transcribe audio
    const response = await zai.audio.asr.create({
      file_base64: audioBase64,
    });

    return NextResponse.json({
      success: true,
      transcription: response.text,
    });
  } catch (error) {
    console.error('ASR API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
