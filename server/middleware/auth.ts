import { Request, Response, NextFunction } from 'express'
import { getSessionUser } from '../lib/session.js'
import { verifyCsrfToken } from '../lib/csrf.js'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    name: string
    group: string | null
    facultyId: string | null
    mustChangePassword: boolean
  }
  isBearerAuth?: boolean
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // 1. Check Bearer token first (Mobile / API clients)
  const authHeader = req.headers.authorization
  let token: string | undefined
  let isBearer = false

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
    isBearer = true
  }

  // 2. Fall back to cp_session cookie (Web browser client)
  if (!token && req.cookies?.cp_session) {
    token = req.cookies.cp_session
    isBearer = false
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.'
      }
    })
    return
  }

  const user = await getSessionUser(token)
  if (!user) {
    res.clearCookie('cp_session')
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Session expired or invalid.'
      }
    })
    return
  }

  // 3. CSRF Verification for state-changing browser cookie requests
  if (!isBearer) {
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())
    if (isStateChanging) {
      const csrfHeader = req.headers['x-csrf-token'] as string | undefined
      if (!csrfHeader || !verifyCsrfToken(csrfHeader)) {
        res.status(403).json({
          error: {
            code: 'INVALID_CSRF_TOKEN',
            message: 'Missing or invalid CSRF token.'
          }
        })
        return
      }
    }
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    group: user.group,
    facultyId: user.facultyId,
    mustChangePassword: user.mustChangePassword,
  }
  req.isBearerAuth = isBearer

  // An admin-provisioned faculty account must rotate its temporary password
  // before it can reach anything else. These three routes stay open so the
  // client can rotate the password, read its own identity, or log out.
  if (user.mustChangePassword) {
    const allowed = ['/api/auth/change-password', '/api/auth/me', '/api/auth/logout']
    const path = req.baseUrl + req.path
    if (!allowed.includes(path)) {
      res.status(403).json({
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your temporary password before continuing.'
        }
      })
      return
    }
  }

  next()
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.'
        }
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden.'
        }
      })
      return
    }

    next()
  }
}
