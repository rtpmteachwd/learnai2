import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Vision Language Model API endpoint
// Used for sign language/gesture recognition
export async function POST(req: NextRequest) {
  try {
    const { image, prompt, mode = 'sign_language' } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Create ZAI instance
    const zai = await ZAI.create();

    // Set default prompts based on mode
    const prompts: Record<string, string> = {
      sign_language: `Analyze this image for sign language or hand gestures. 
        If you detect a sign language gesture, describe:
        1. What gesture is being shown
        2. What letter, word, or meaning it represents
        3. Any relevant notes about the gesture
        
        If no sign language is detected, describe what you see in the image.`,
      
      gesture: `Analyze this image for hand gestures or body language.
        Describe what gesture is being made and what it typically means.
        Be specific about hand positions and movements.`,
      
      document: `Extract and transcribe all text from this image.
        Preserve the layout and formatting as much as possible.
        If this is a worksheet or form, identify all questions and fields.`,
      
      describe: `Describe this image in detail. Include:
        1. Main subjects and objects
        2. Actions and activities
        3. Setting and context
        4. Any text visible in the image`,
    };

    const selectedPrompt = prompt || prompts[mode] || prompts.describe;

    // Analyze image using VLM
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: selectedPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = response.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      analysis,
      mode,
    });
  } catch (error) {
    console.error('VLM API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
