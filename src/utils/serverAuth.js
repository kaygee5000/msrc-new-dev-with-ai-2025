"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Verify authentication for API routes using NextAuth
 * @param {Request} req - Next.js request object
 * @param {string[]} [requiredRoles] - Optional roles required for this route
 * @returns {Object} Authentication result with success, user, and status
 */
export async function verifyServerAuth(req, requiredRoles = null) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return {
        success: false,
        message: 'Authentication required',
        status: 401
      };
    }
    
    // Check if the user has the required role(s)
    if (requiredRoles) {
      const userRole = session.user.role;
      const requiredRoleArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      const hasRequiredRole = requiredRoleArray.includes(userRole);
      if (!hasRequiredRole) {
        return {
          success: false,
          message: 'Insufficient permissions',
          status: 403
        };
      }
    }
    
    return { success: true, user: session.user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      message: 'Authentication error',
      status: 500
    };
  }
}