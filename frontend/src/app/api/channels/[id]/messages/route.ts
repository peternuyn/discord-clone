import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await params;
  try {
    if (!code) {
      return NextResponse.json(
        { error: 'Channel code is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/channels/${code}/messages`, {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await params;
  try {
    if (!code) {
      return NextResponse.json(
        { error: 'Channel code is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/channels/${code}/messages`, {
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