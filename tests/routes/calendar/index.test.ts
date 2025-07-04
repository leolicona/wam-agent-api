import { describe, it, expect } from 'vitest'
import app from '../../../src/index'

describe('Calendar Route', () => {
  it('should return a 200 response on GET /calendar', async () => {
    const req = new Request('https://tourist-guide-service.leolicona-dev.workers.dev/calendar', {
      method: 'GET',
    })
    
    const res = await app.request(req)
    const json = await res.json()
    
    expect(res.status).toBe(200)
    expect(json).toEqual({ message: 'Get calendar' })
  })
})