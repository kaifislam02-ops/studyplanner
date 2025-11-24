import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, system } = await request.json();

    // Get Gemini API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

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

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData },
        { status: response.status }
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