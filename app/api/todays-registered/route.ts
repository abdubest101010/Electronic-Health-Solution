// app/api/todays-registered/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

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
        appointments: {
          some: {
            visitStatus: {
              in: ['REGISTERED', 'VITALS_TAKEN', 'LAB_ORDERED'],
            },
          },
        },
      },
      include: {
        appointments: {
          where: {
            visitStatus: {
              in: ['REGISTERED', 'VITALS_TAKEN', 'LAB_ORDERED', 'PAID_FOR_LAB'],
            },
          },
          select: {
            id: true,
            visitStatus: true,
            labOrders: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching today registered patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}