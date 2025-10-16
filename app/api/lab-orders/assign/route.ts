import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { LabOrderStatus, VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId, laboratoristId } = await req.json();

  if (!labOrderId || typeof labOrderId !== 'string') {
    return NextResponse.json({ error: 'Valid labOrderId (string) is required' }, { status: 400 });
  }

  if (!laboratoristId || typeof laboratoristId !== 'string') {
    return NextResponse.json({ error: 'Valid laboratoristId (string) is required' }, { status: 400 });
  }

  try {
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    });

    if (!labOrder) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.labOrder.update({
        where: { id: labOrderId },
        data: { laboratoristId, status: LabOrderStatus.ASSIGNED },
      }),
      prisma.patient.update({
        where: { id: labOrder.patientId },
        data: { visitStatus: VisitStatus.ASSIGNED_TO_LAB },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lab order assign error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}