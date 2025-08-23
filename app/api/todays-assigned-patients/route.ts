// app/api/todays-assigned-patients/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming you're using NextAuth
import prisma from '@/lib/prisma';

export const GET = async () => {
  // Authenticate user
  const session = await auth();
  if (!session || !['DOCTOR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const assignedPatients = await prisma.appointment.findMany({
      where: {
        visitStatus: 'ASSIGNED_TO_DOCTOR',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(assignedPatients);
  } catch (error) {
    console.error('Error fetching assigned patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};