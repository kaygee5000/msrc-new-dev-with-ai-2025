import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get the current logged-in user's session data
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    // No session = not authenticated
    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Not authenticated' 
        }, 
        { status: 401 }
      );
    }
    
    // Return the user data from the session
    return NextResponse.json({
      success: true,
      user: session.user
    });
    
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get user data' 
      }, 
      { status: 500 }
    );
  }
}