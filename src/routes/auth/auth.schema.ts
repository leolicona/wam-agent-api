// Authentication validation schemas
// Houses data validation schemas for request bodies and parameters
import { z } from 'zod'

/**
 * Schema for token verification request
 */
export const tokenVerificationSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

/**
 * User interface for authentication responses
 */
export interface User {
  id: string
  phoneNumber: string
  name: string
  createdAt: number
  lastLogin: number
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

/**
 * Type for token verification response
 */
export type TokenVerificationResponse = AuthResponse