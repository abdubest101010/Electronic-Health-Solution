import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LabOrderStatus, VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId } = await req.json();

  if (!labOrderId || typeof labOrderId !== 'string') {
    return NextResponse.json({ error: 'Valid labOrderId (string) is required' }, { status: 400 });
  }

  try {
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    });

    if (!labOrder) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    if (labOrder.status === LabOrderStatus.PAID) {
      return NextResponse.json({ error: 'Lab test already paid' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.labOrder.update({
        where: { id: labOrderId },
        data: {
          status: LabOrderStatus.PAID,
          paidAt: new Date(),
        },
      }),
      prisma.patient.update({
        where: { id: labOrder.patientId },
        data: { visitStatus: VisitStatus.PAID_FOR_LAB },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}