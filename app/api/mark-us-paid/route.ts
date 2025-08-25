// app/api/receptionist/mark-lab-paid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId } = await req.json();

  if (!labOrderId) {
    return NextResponse.json({ error: 'Lab order ID is required' }, { status: 400 });
  }

  try {
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: { appointment: true },
    });

    if (!labOrder) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    // Ensure it's not already paid
    if (labOrder.status === 'PAID') {
      return NextResponse.json({ error: 'Lab test already paid' }, { status: 400 });
    }

    // Update lab order
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Optional: Update appointment status
    if (labOrder.appointmentId) {
      await prisma.appointment.update({
        where: { id: labOrder.appointmentId },
        data: { visitStatus: 'PAID_FOR_LAB' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}