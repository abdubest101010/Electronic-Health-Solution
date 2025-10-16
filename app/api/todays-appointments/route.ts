import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const patients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        visitStatus: {
          in: [
            VisitStatus.REGISTERED,
            VisitStatus.VITALS_TAKEN,
            VisitStatus.ASSIGNED_TO_DOCTOR,
            VisitStatus.EXAMINED,
            VisitStatus.LAB_ORDERED,
            VisitStatus.PAID_FOR_LAB,
            VisitStatus.ASSIGNED_TO_LAB,
            VisitStatus.LAB_COMPLETED,
            VisitStatus.FINALIZED,
          ],
        },
      },
      include: {
        labOrders: true,
        doctor: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching today’s patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}