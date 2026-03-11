import { NextRequest, NextResponse } from 'next/server';

// LLM Chat API endpoint
// Used for AI-driven insights, recommendations, and adaptive learning
// Supports multiple AI providers via environment variables

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Get AI configuration from environment or .z-ai-config
async function getAIConfig() {
  // Option 1: Use environment variables (recommended for local development)
  const envBaseUrl = process.env.AI_BASE_URL;
  const envApiKey = process.env.AI_API_KEY;
  
  if (envBaseUrl && envApiKey) {
    return {
      baseUrl: envBaseUrl,
      apiKey: envApiKey,
      chatId: process.env.AI_CHAT_ID,
      userId: process.env.AI_USER_ID,
    };
  }
  
  // Option 2: Use z-ai-web-dev-sdk (requires .z-ai-config file)
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    return zai.config;
  } catch (error) {
    console.error('AI config not found. Set AI_BASE_URL and AI_API_KEY environment variables.');
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      messages, 
      systemPrompt, 
      mode = 'chat',
      studentContext 
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get AI configuration
    const config = await getAIConfig();
    
    if (!config) {
      // Return a helpful error message with setup instructions
      return NextResponse.json({
        success: false,
        error: 'AI not configured',
        setupInstructions: `To enable AI features, you need to configure an AI API. You have two options:

**Option 1: Use OpenAI (Recommended)**
1. Get an API key from https://platform.openai.com/api-keys
2. Add to your .env file:
   AI_BASE_URL=https://api.openai.com/v1
   AI_API_KEY=your-openai-api-key

**Option 2: Use Groq (Free tier available)**
1. Get an API key from https://console.groq.com/keys
2. Add to your .env file:
   AI_BASE_URL=https://api.groq.com/openai/v1
   AI_API_KEY=your-groq-api-key

**Option 3: Use Together AI**
1. Get an API key from https://api.together.xyz/settings/api-keys
2. Add to your .env file:
   AI_BASE_URL=https://api.together.xyz/v1
   AI_API_KEY=your-together-api-key

**Option 4: Use any OpenAI-compatible API**
Set AI_BASE_URL and AI_API_KEY in your .env file.

After adding the environment variables, restart your development server.`,
      });
    }

    // Set default system prompts based on mode
    const systemPrompts: Record<string, string> = {
      chat: 'You are a helpful educational assistant. Provide clear, encouraging responses suitable for students with special needs.',
      
      sped_tutor: `You are a patient, encouraging AI tutor for students with learning disabilities. Your role is to:
1. ALWAYS be patient, kind, and encouraging
2. Use SIMPLE language - short sentences, common words
3. Break down complex ideas into SMALL steps
4. Use EXAMPLES from everyday life
5. Celebrate SMALL wins and effort
6. Never make the student feel bad for not understanding
7. Use emojis occasionally to make learning fun 😊
8. If the student is frustrated, acknowledge their feelings FIRST, then help`,
      
      teacher_insights: `You are an AI assistant for special education teachers.
        Analyze student performance data and provide:
        1. Key insights about learning patterns
        2. Specific intervention recommendations
        3. Accommodation suggestions
        4. Progress predictions
        
        Format your response in a clear, structured manner.`,
      
      adaptive_content: `You are an adaptive learning system aligned with Vygotsky's Zone of Proximal Development (ZPD).
        Adjust content difficulty based on student ability:
        - If student struggles: provide simpler explanations, more examples
        - If student excels: introduce more challenging concepts
        - Always scaffold learning appropriately
        
        Consider the student's disability type and provide appropriate accommodations.`,
      
      quiz_generator: `You are an educational quiz generator for special needs students.
        Generate clear, accessible quiz questions that:
        - Use simple, direct language
        - Include clear instructions
        - Provide appropriate difficulty levels
        - Consider various learning styles`,
      
      feedback: `You are a supportive educational feedback generator.
        Provide constructive, encouraging feedback that:
        - Highlights strengths and improvements
        - Offers specific, actionable suggestions
        - Uses positive, growth-oriented language
        - Considers the student's individual needs`,
      
      content_simplifier: `You are a patient educational assistant who helps students with learning disabilities understand complex content.
        Simplify the content while keeping important information.
        Always be encouraging and use a friendly tone.`,
      
      social_story: `You are an expert in creating social stories for students with autism and learning disabilities.
        Create social stories following Carol Gray's guidelines.
        Use first person perspective, short sentences, and positive language.
        Be reassuring and include coping strategies when appropriate.`,
      
      encouragement: `You are a supportive friend who provides personalized encouragement for students with learning disabilities.
        Be warm, genuine, and celebrate their efforts and progress.
        Use simple language and positive reinforcement.`,
    };

    const selectedSystemPrompt = systemPrompt || systemPrompts[mode] || systemPrompts.chat;

    // Add student context if provided
    const contextPrefix = studentContext 
      ? `\n\nStudent Context:\n- Name: ${studentContext.name || 'Student'}\n- Disability Type: ${studentContext.disabilityType || 'None'}\n- Current Level: ${studentContext.currentLevel || '3'}\n`
      : '';

    // Prepare messages for the API
    const apiMessages: ChatMessage[] = [
      {
        role: 'system',
        content: selectedSystemPrompt + contextPrefix,
      },
      ...messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Make the API request
    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    if (config.chatId) headers['X-Chat-Id'] = config.chatId;
    if (config.userId) headers['X-User-Id'] = config.userId;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      // Try to parse the error for more details
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.error?.message || errorJson.error || errorText;
      } catch {}
      
      throw new Error(`AI API error: ${errorDetail}`);
    }

    const completion = await response.json();
    const responseContent = completion.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from AI API');
    }

    return NextResponse.json({
      success: true,
      response: responseContent,
      mode,
    });
  } catch (error) {
    console.error('LLM API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response' },
      { status: 500 }
    );
  }
}
