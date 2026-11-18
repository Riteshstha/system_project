// POST /api/admin/clients/invite
// Admin creates a client account with a default password.
// The client can log in immediately without activation.
//
// Security decisions:
// - Requires admin role (checked in middleware + DB).
// - Default password is set automatically.
// - No email invitation needed.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  orderId: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Require admin session
  const session = await requireAdmin();
  const actorEmail = session.client.email;

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, phone, orderId } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if client already exists
  const existing = await prisma.client.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A client with this email already exists' },
      { status: 400 }
    );
  }

  // Use a default password for all admin-created clients
  const defaultPassword = 'default@321';
  const passwordHash = await hashPassword(defaultPassword);

  // Create the client account with ACTIVE status
  const client = await prisma.client.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      roles: 'CLIENT',
      status: 'ACTIVE',
    },
  });

  // Link to existing order if provided
  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: { clientId: client.id },
    });
  }

  await writeAuditLog({
    actorEmail,
    action: 'CLIENT_CREATED',
    entity: 'Client',
    entityId: client.id,
    detail: { clientEmail: normalizedEmail, defaultPassword, ip },
    ip,
  });

  return NextResponse.json(
    {
      ok: true,
      clientId: client.id,
      email: client.email,
      defaultPassword: 'default@321', // Return the default password for the admin to give to the client
    },
    { status: 201 }
  );
}