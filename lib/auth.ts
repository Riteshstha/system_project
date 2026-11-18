// Auth library — argon2id hashing, JWT session tokens, TOTP 2FA.
//
// Security decisions:
// - argon2id (not bcrypt): current winner in password-hashing contests,
//   resistant to GPU/ASIC attacks. Memory-hard by default.
// - Session token: a signed JWT containing clientId + roles. The JWT is
//   verified in middleware (fast, no DB) AND re-checked against the DB
//   Session table in every page/route, so revocation works.
// - Cookie: HttpOnly, SameSite=Lax, Secure in production. Never accessible to JS.
// - 2FA: TOTP via otplib. Admins only (per requirements).

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from './prisma';

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

// ---- Passwords ----

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// ---- Sessions (JWT + DB-backed) ----

export function createSessionToken(clientId: string, roles: string): string {
  return jwt.sign(
    { clientId, roles, purpose: 'session' },
    process.env.SESSION_SECRET!,
    { algorithm: 'HS256', expiresIn: SESSION_MAX_AGE_SECONDS }
  );
}

export function verifySessionToken(token: string): { clientId: string; roles: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET!) as any;
    if (decoded.purpose !== 'session') return null;
    return { clientId: decoded.clientId, roles: decoded.roles };
  } catch {
    return null;
  }
}

export async function createSession(
  clientId: string,
  ip?: string,
  userAgent?: string
) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Get current roles for the JWT
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error('Client not found');

  const token = createSessionToken(clientId, client.roles);

  const session = await prisma.session.create({
    data: { clientId, token, expiresAt, ip, userAgent },
    include: { client: true },
  });

  return session;
}

export async function getSession(token: string | undefined) {
  if (!token) return null;

  // Verify JWT first (fast, no DB)
  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  // Check DB session exists and is valid
  const session = await prisma.session.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.clientId !== decoded.clientId) return null;

  return session;
}

export async function revokeSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

export async function revokeAllSessions(clientId: string) {
  await prisma.session.deleteMany({ where: { clientId } });
}

// ---- 2FA (TOTP) ----

export { generateTotpSecret, verifyTotpCode, totpUri } from './totp';

// ---- Role helpers ----

export function hasRole(client: { roles: string }, role: string): boolean {
  return client.roles.includes(role);
}

export function isClient(client: { roles: string }): boolean {
  return client.roles.includes('CLIENT');
}

export function isTeam(client: { roles: string }): boolean {
  return client.roles.includes('TEAM');
}

export function isClientOrTeam(client: { roles: string }): boolean {
  return client.roles.includes('CLIENT') || client.roles.includes('TEAM');
}

export function isClientOrAdmin(client: { roles: string }): boolean {
  return client.roles.includes('CLIENT') || client.roles.includes('ADMIN');
}

export function isAdmin(client: { roles: string }): boolean {
  return client.roles.includes('ADMIN');
}