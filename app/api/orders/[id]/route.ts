// GET /api/orders/[id] - Get order detail (Public for tracking)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        package: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Return limited fields for public tracking if needed,
    // but here we return most info since it's targeted by ID.
    return NextResponse.json({ order });
  } catch (e) {
    console.error('Fetch order failed', e);
    return NextResponse.json({ error: 'Could not fetch order' }, { status: 500 });
  }
}
