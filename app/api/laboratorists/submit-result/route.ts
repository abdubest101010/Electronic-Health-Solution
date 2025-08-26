// app/api/laboratorist/submit-result/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId, result } = await req.json();

  if (!labOrderId || result === undefined) {
    return NextResponse.json(
      { error: 'labOrderId and result are required' },
      { status: 400 }
    );
  }

  try {
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: {
        appointment: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!labOrder) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    if (labOrder.laboratoristId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not assigned to you' }, { status: 403 });
    }

    if (labOrder.status !== 'PAID') {
      return NextResponse.json({ error: 'Only paid tests can be processed' }, { status: 400 });
    }

    // Update lab order
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        result,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update appointment status
    await prisma.appointment.update({
      where: { id: labOrder.appointmentId },
      data: { visitStatus: 'LAB_COMPLETED' },
    });

    // Optional: Notify doctor via DB or email
    // You can add a notification field later

    return NextResponse.json({
      success: true,
      message: 'Lab result submitted successfully',
    });
  } catch (error) {
    console.error('Submit lab result error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}