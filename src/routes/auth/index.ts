// Authentication routes
// This file defines the Hono router for authentication endpoints
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zodValidator } from '../../middleware/zod.validator'
import { AuthErrors } from '../../middleware/error.handler'
import { z } from 'zod'
import type { Env } from '../../bindings'
import { authHandlers } from './auth.handler'
import { tokenVerificationSchema } from './auth.schema' 

const auth = new Hono<{ Bindings: Env }>()

auth.post('/verify', 
  zodValidator('json', tokenVerificationSchema),
  async (c) =>authHandlers.verifyToken(c))

// Health check endpoint
auth.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  })
})

export default auth


export { auth }