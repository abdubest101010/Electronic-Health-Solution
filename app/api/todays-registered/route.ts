import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('Unauthorized access attempt:', { session });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setUTCHours(-3, 0, 0, 0); // Start of today in EAT (UTC+3)
    const endOfDay = new Date();
    endOfDay.setUTCHours(20, 59, 59, 999); // End of today in EAT (UTC+3)

    const patients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    console.log('Fetched today’s patients:', patients);
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching today’s patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
