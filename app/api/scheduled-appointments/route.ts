import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    where: { visitStatus: VisitStatus.REGISTERED },
    select: { id: true, name: true },
  });

  return NextResponse.json(patients);
}