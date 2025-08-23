// app/api/todays-paid-lab-patients/route.ts (new for laboratorist to fetch today's paid lab patients)
import { NextResponse } from 'next/server';
import {auth} from '@/auth';
import prisma from '@/lib/prisma';
export async function GET() {
const session = await auth();
    if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const labOrders = await prisma.labOrder.findMany({
    where: {
      paidAt: { gte: todayStart, lte: todayEnd },
      laboratoristId: session.user.id,
    },
    include: {
      appointment: { include: { patient: true } },
      service: true,
    },
    distinct: ['appointmentId'], // Unique by appointment/patient
  });

  return NextResponse.json(labOrders);
}