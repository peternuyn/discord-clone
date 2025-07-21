import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const id = pathname.split('/')[4]; // Adjust if your route is deeper

  try {
    const response = await fetch(`${BACKEND_URL}/api/channels/${id}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const id = pathname.split('/')[4]; // Adjust based on your route structure

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/channels/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
