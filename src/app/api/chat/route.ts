import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, system } = await request.json();

    // Get Gemini API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log('API Key check:', apiKey ? 'Key found' : 'Key NOT found');

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: { 
            message: 'API key not configured. Add GEMINI_API_KEY to .env.local. Get free key at: https://makersuite.google.com/app/apikey' 
          } 
        },
        { status: 500 }
      );
    }

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: any) => {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    // Add system prompt as first message if provided
    if (system) {
      geminiMessages.unshift({
        role: 'user',
        parts: [{ text: system }]
      });
      geminiMessages.splice(1, 0, {
        role: 'model',
        parts: [{ text: 'I understand. I will act as an expert AI tutor and follow those guidelines.' }]
      });
    }

    // Call Google Gemini API - try multiple models in order of preference
    const models = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    let response;
    let lastError;
    
    for (const model of models) {
      try {
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
          break; // Success! Use this model
        }
        lastError = await response.text();
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { 
          error: { 
            message: `Unable to connect to Gemini API. Last error: ${lastError}. Please verify your API key at https://makersuite.google.com/app/apikey` 
          } 
        },
        { status: response?.status || 500 }
      );
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I encountered an error.';
    
    // Return in Claude-compatible format
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