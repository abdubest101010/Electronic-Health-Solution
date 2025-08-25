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
    // Fetch patients with today's appointments in relevant visitStatus
    const patients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        appointments: {
          some: {
            visitStatus: {
              in: ['REGISTERED', 'VITALS_TAKEN', 'LAB_ORDERED', 'PAID_FOR_LAB'],
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

    // Flatten: Create a list of objects with Appointment.id as the main ID
    const result = patients.flatMap((patient) =>
      patient.appointments.map((app) => ({
        id: app.id,                    // ✅ Appointment ID (what you need!)
        name: patient.name,
        patientId: patient.id,
        visitStatus: app.visitStatus,
        labOrderCount: app.labOrders.length,
        hasPendingLab: app.labOrders.some((lo) => lo.status !== 'COMPLETED'),
        createdAt: patient.createdAt,
      }))
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching today registered patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}