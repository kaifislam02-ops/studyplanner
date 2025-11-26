import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, system } = await request.json();

    // Get Gemini API key - check both server and client env vars
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log('=== API Route Debug ===');
    console.log('API Key exists:', !!apiKey);
    console.log('Messages count:', messages?.length);

    if (!apiKey) {
      console.error('API key not found in environment variables');
      return NextResponse.json(
        { 
          error: { 
            message: 'API key not configured. Add GEMINI_API_KEY to .env.local' 
          } 
        },
        { status: 500 }
      );
    }

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system prompt if provided
    if (system) {
      geminiMessages.unshift({
        role: 'user',
        parts: [{ text: system }]
      });
      geminiMessages.splice(1, 0, {
        role: 'model',
        parts: [{ text: 'I understand. I will help as an expert AI tutor.' }]
      });
    }

    console.log('Calling Gemini API...');

    // Try different models
    const models = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro'
    ];
    
    let response;
    let lastError;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
            }),
          }
        );
        
        if (response.ok) {
          console.log(`Success with model: ${model}`);
          break;
        }
        
        const errorText = await response.text();
        console.error(`Failed with ${model}:`, errorText);
        lastError = errorText;
        
      } catch (e: any) {
        console.error(`Error with ${model}:`, e.message);
        lastError = e.message;
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error('All models failed. Last error:', lastError);
      return NextResponse.json(
        { 
          error: { 
            message: `Unable to connect to Gemini. Error: ${lastError}` 
          } 
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Got response from Gemini');
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    
    // Return in format expected by frontend
    return NextResponse.json({
      content: [{ text }]
    });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';