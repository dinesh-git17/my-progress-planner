// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      );
    }

    // Check if password matches
    if (password === adminPassword) {
      return NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    );
  }
}
