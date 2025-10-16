import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    where: {
      doctorId: session.user.id,
      visitStatus: { in: [VisitStatus.EXAMINED, VisitStatus.LAB_COMPLETED] },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json(patients);
}