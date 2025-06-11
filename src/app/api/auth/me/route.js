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
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }
    
    // Return the user data from the session with caching headers
    return NextResponse.json({
      success: true,
      user: session.user
    }, {
      status: 200,
      headers: {
        // Cache for 15 minutes (900 seconds)
        'Cache-Control': 'private, max-age=900',
        // Add ETag for validation
        'ETag': `"user-${session.user.id || session.user.email}-${Date.now()}"`,
      }
    });
    
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get user data' 
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}