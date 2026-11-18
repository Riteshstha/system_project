// PATCH /api/clients/[id]/roles
// Updates a client's roles. Only admins can change roles.
//
// Security decisions:
// - Requires admin session.
// - Validates roles are a subset of {CLIENT, TEAM, ADMIN}.
// - Prevents an admin from removing their own admin role (no self-lockout).
// - Writes an audit log entry.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import { writeAuditLog, getClientIp } from '@/lib/audit';

const VALID_ROLES = ['CLIENT', 'TEAM', 'ADMIN'];

const rolesSchema = z.object({
  roles: z
    .string()
    .refine(
      (r) => r.split(',').every((role) => VALID_ROLES.includes(role.trim())),
      'Invalid role'
    ),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireSession();

  if (!session.client.roles.includes('ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = rolesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid roles', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (id === session.client.id && !parsed.data.roles.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin role' },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: { roles: parsed.data.roles },
    });

    await writeAuditLog({
      actorEmail: session.client.email,
      action: 'CLIENT_ROLE_UPDATE',
      entity: 'Client',
      entityId: client.id,
      detail: { newRoles: parsed.data.roles, clientEmail: client.email },
      ip: getClientIp(req),
    });

    return NextResponse.json({ ok: true, roles: client.roles });
  } catch (e) {
    console.error('Role update failed', e);
    return NextResponse.json(
      { error: 'Could not update roles' },
      { status: 500 }
    );
  }
}