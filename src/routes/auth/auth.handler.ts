// Houses business logic for handling WhatsApp webhook requests
import type { Context } from 'hono'
import { setCookie } from 'hono/cookie';
import type { Env } from '../../bindings';
import { HTTPException } from 'hono/http-exception'
import { makeApiRequester } from '../../core/makeApiRequester';
import type { AuthResponse, User } from './auth.schema';

// Authentication handlers
// Handles authentication requests and responses

/**
 * Success response interface for token verification
 */
interface TokenVerificationSuccessResponse {
  status: 'success'
  message: string
  userId: string
}

export const authHandlers = {
  
  verifyToken: async (c: Context<{ Bindings: Env }>) => {
    try {
        const body = await c.req.json();
        const { token } = body;
    
        const apiRequester = makeApiRequester({
            apiUrl: `${c.env.OTPLESS_API_URL}/auth/verify`,
            service: c.env.AUTH_SERVICE
        });

        const response = await apiRequester({token});

        const data: AuthResponse = await response.json();
        const { user, accessToken, refreshToken } = data;

        console.log('Response data:', data);
        
         // CRITICAL SECURITY: Set tokens in HttpOnly cookies instead of returning them
      setCookie(c, 'session_token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 15 * 60, // 15 minutes for access token
      });

      setCookie(c, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days for refresh token
      });

      // Return success response without sensitive tokens
      const successResponse: TokenVerificationSuccessResponse = {
        status: 'success',
        message: 'Login successful. You are now authenticated.',
        userId: user.id
      };

      return c.json(successResponse, 200)
    } catch (error) {
        console.error('Token verification error:', error);
        if (error instanceof HTTPException) {
            throw error
        }
        throw new HTTPException(400, { message: 'Invalid token verification request' })
    }
  }
  
}

// Contains business logic for handling authentication requests