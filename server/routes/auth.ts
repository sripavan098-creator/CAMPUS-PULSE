import { Router, Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { createSession, deleteSession } from '../lib/session.js'
import { generateCsrfToken } from '../lib/csrf.js'
import { loginRateLimit, resetLoginAttempts, RateLimitedResponse } from '../middleware/rateLimit.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { log } from '../lib/logger.js'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, 'Password must be at least 10 characters'),
})

const INVALID_CREDENTIALS_RESPONSE = {
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Email or password is incorrect.',
  },
}

/**
 * Shapes a user row into the session object the SPA expects. The frontend keys
 * its dashboards off `identifier`, `sectionId` and `facultyId`, which are not
 * columns on User, so they are resolved from the linked Faculty/Group here.
 */
async function buildSessionUser(user: {
  id: string
  email: string
  name: string
  role: string
  group: string | null
  facultyId: string | null
  mustChangePassword: boolean
}) {
  const [faculty, group] = await Promise.all([
    user.facultyId
      ? prisma.faculty.findUnique({ where: { id: user.facultyId }, select: { code: true, departmentId: true } })
      : Promise.resolve(null),
    user.group
      ? prisma.group.findUnique({ where: { name: user.group }, select: { departmentId: true } })
      : Promise.resolve(null),
  ])

  const departmentId = faculty?.departmentId ?? group?.departmentId ?? null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    group: user.group,
    facultyId: user.facultyId,
    // Registration number / faculty code, shown in the UI chrome.
    identifier: faculty?.code ?? user.group ?? user.email,
    sectionId: user.group ?? null,
    departmentId,
    mustChangePassword: user.mustChangePassword,
  }
}

// GET /api/auth/csrf - provides a CSRF token for web clients
router.get('/csrf', (_req: Request, res: Response) => {
  const csrfToken = generateCsrfToken()
  res.json({ csrfToken })
})

// POST /api/auth/login - dual client login: sets cp_session cookie & returns bearer token in JSON
router.post('/login', loginRateLimit, async (req: Request, res: RateLimitedResponse) => {
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0]?.message || 'Invalid login request.',
      },
    })
    return
  }

  const { email, password } = result.data
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    // Timing attack mitigation: dummy comparison
    await bcrypt.compare(password, '$2b$10$DUMMYHASHFORCONSTTIMEPASSWORDCHECKSxxxxxxxxx')
    if (res.incrementLoginFailure) await res.incrementLoginFailure()
    await prisma.failedLogin.create({
      data: {
        email: normalizedEmail,
        ip: req.ip || null,
      },
    }).catch(() => {})
    res.status(401).json(INVALID_CREDENTIALS_RESPONSE)
    return
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    if (res.incrementLoginFailure) await res.incrementLoginFailure()
    await prisma.failedLogin.create({
      data: {
        email: normalizedEmail,
        userId: user.id,
        ip: req.ip || null,
      },
    }).catch(() => {})
    log('warn', 'Failed login attempt', { email: normalizedEmail })
    res.status(401).json(INVALID_CREDENTIALS_RESPONSE)
    return
  }

  resetLoginAttempts(normalizedEmail)
  const { token, expiresAt } = await createSession(user.id)

  const isProduction = process.env.NODE_ENV === 'production'
  const sameSiteSetting = (process.env.COOKIE_SAMESITE?.toLowerCase() === 'none' ? 'none' : 'lax') as 'lax' | 'none'

  // Set HttpOnly session cookie cp_session for web browser
  res.cookie('cp_session', token, {
    httpOnly: true,
    sameSite: sameSiteSetting,
    secure: isProduction || sameSiteSetting === 'none',
    path: '/',
    expires: expiresAt,
  })

  log('info', 'User authenticated successfully', { userId: user.id, role: user.role })

  // Return user info and bearer token for Android APK / API consumers
  res.json({
    user: await buildSessionUser(user),
    token,
    expiresAt: expiresAt.toISOString(),
  })
})

// POST /api/auth/logout - deletes session and clears cookie
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.substring(7).trim()
    : req.cookies?.cp_session

  if (token) {
    await deleteSession(token)
  }

  res.clearCookie('cp_session', { path: '/' })
  res.json({ success: true, message: 'Logged out successfully.' })
})

// GET /api/auth/me - inspect current authenticated session
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!
  res.json({ user: await buildSessionUser(user) })
})

// Registration numbers look like 211FA04001 (batch + programme + serial).
const ROLL_NUMBER_PATTERN = /^\d{2,3}[A-Z]{2,4}\d{4,5}$/

const StudentSignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  rollNumber: z.string().trim().toUpperCase().regex(ROLL_NUMBER_PATTERN, 'Roll number must look like 211FA04001'),
  email: z.string().email(),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  section: z.string().min(1, 'Section is required'),
})

// POST /api/auth/signup/student - self-service student registration.
router.post('/signup/student', loginRateLimit, async (req: Request, res: RateLimitedResponse) => {
  const result = StudentSignupSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid signup request.' },
    })
    return
  }

  const { name, rollNumber, password, section } = result.data
  const email = result.data.email.toLowerCase().trim()

  // The section must be a real Group so the student's timetable resolves.
  const group = await prisma.group.findUnique({ where: { name: section } })
  if (!group) {
    res.status(400).json({
      error: { code: 'INVALID_SECTION', message: `Section "${section}" does not exist in the academic directory.` },
    })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({
      error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' },
    })
    return
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      role: 'student',
      name,
      group: section,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'auth.signup.student',
      entity: 'User',
      entityId: user.id,
      detail: `Student self-registration: ${rollNumber} (${name}) into section ${section}`,
    },
  })

  log('info', 'Student self-registered', { userId: user.id, section })
  res.status(201).json({ user: await buildSessionUser(user) })
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(10, 'New password must be at least 10 characters'),
})

// POST /api/auth/change-password - used by admin-provisioned faculty on first login.
router.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = ChangePasswordSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid request.' },
    })
    return
  }

  const { currentPassword, newPassword } = result.data
  const record = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!record) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } })
    return
  }

  const valid = await bcrypt.compare(currentPassword, record.password)
  if (!valid) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' } })
    return
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'New password must differ from the current password.' },
    })
    return
  }

  await prisma.user.update({
    where: { id: record.id },
    data: { password: await bcrypt.hash(newPassword, 10), mustChangePassword: false },
  })

  await prisma.auditLog.create({
    data: {
      userId: record.id,
      action: 'auth.password.change',
      entity: 'User',
      entityId: record.id,
      detail: 'Password changed by account owner',
    },
  })

  res.json({ success: true, mustChangePassword: false })
})

export default router
