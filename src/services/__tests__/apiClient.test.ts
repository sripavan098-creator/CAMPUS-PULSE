// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, extractErrorMessage } from '../apiClient'
import { tokenStorage } from '../tokenStorage'

/**
 * The backend wraps failures as `{ error: { code, message } }`. Before this was
 * handled, a failed login surfaced as "[object Object]" and every 401 was
 * reported as "Session expired", even a plain wrong password.
 */
describe('extractErrorMessage', () => {
  it('reads the nested backend error envelope', () => {
    expect(
      extractErrorMessage({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } }, 401)
    ).toBe('Email or password is incorrect.')
  })

  it('reads flat message, string error and detail shapes', () => {
    expect(extractErrorMessage({ message: 'Flat message' }, 400)).toBe('Flat message')
    expect(extractErrorMessage({ error: 'String error' }, 400)).toBe('String error')
    expect(extractErrorMessage({ detail: 'Detail text' }, 422)).toBe('Detail text')
  })

  it('falls back to the status code when there is nothing usable', () => {
    expect(extractErrorMessage(null, 500)).toBe('Request failed with status 500')
    expect(extractErrorMessage({}, 503)).toBe('Request failed with status 503')
    expect(extractErrorMessage({ error: {} }, 502)).toBe('Request failed with status 502')
  })
})

describe('apiClient 401 handling', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('reports a failed login with no token as invalid credentials, not session expired', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    )

    await expect(
      apiClient.post('/api/auth/login', { email: 'a@b.c', password: 'nope' }, { requiresAuth: false })
    ).rejects.toThrow('Email or password is incorrect.')
  })

  it('still reports session expiry when a token was sent and the session is gone', async () => {
    await tokenStorage.setToken('stale-token')
    const expired = vi.fn()
    window.addEventListener('campus_pulse_session_expired', expired)

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }), {
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    )

    await expect(apiClient.get('/api/auth/me')).rejects.toThrow('Session expired. Please log in again.')
    expect(expired).toHaveBeenCalled()
    expect(await tokenStorage.getToken()).toBeNull()

    window.removeEventListener('campus_pulse_session_expired', expired)
  })

  it('surfaces the backend message for a non-401 failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Section is required.' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    )

    await expect(apiClient.post('/api/auth/signup/student', {}, { requiresAuth: false })).rejects.toThrow(
      'Section is required.'
    )
  })
})
