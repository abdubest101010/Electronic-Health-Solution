import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { LabOrderStatus, VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { patientId } = await req.json();

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.labOrder.updateMany({
        where: { patientId, status: LabOrderStatus.ORDERED },
        data: { status: LabOrderStatus.PAID, paidAt: new Date() },
      }),
      prisma.patient.update({
        where: { id: patientId },
        data: { visitStatus: VisitStatus.PAID_FOR_LAB },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lab order payment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}