import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract the invite code from the URL
    const pathname = new URL(request.url).pathname;
    const segments = pathname.split('/');
    const code = segments[segments.length - 1]; // e.g., /api/invites/abc123 => 'abc123'

    if (!code) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
    }

    // TODO: Fetch invite data from your backend or DB
    // Example response (replace this with your actual logic)
    return NextResponse.json({ success: true, inviteCode: code });
  } catch (error) {
    console.error('Failed to handle invite code:', error);
    return NextResponse.json(
      { error: 'Server error while processing invite' },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split('/');
  const code = segments[segments.length - 1];

  try {
    const body = await request.json();

    // TODO: Process invite accept logic here

    return NextResponse.json({ message: `Invite ${code} accepted.` });
  } catch (error) {
    console.error('Error processing invite POST:', error);
    return NextResponse.json(
      { error: 'Server error while accepting invite' },
      { status: 500 }
    );
  }
}
