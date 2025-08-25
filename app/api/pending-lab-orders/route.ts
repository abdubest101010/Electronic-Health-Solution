// app/api/receptionist/todays-lab-patients/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const patients = await prisma.appointment.findMany({
      where: {
        visitStatus: 'ASSIGNED_TO_LAB',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
        labOrders: {
          include: {
            service: {
              select: {
                name: true,
                type: true,
              },
            },
            laboratorist: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format response
    const result = patients.map((apt) => ({
      appointmentId: apt.id,
      patientName: apt.patient.name,
      labTests: apt.labOrders.map((lo) => ({
        labOrderId: lo.id,
        serviceName: lo.service.name,
        orderedById: lo.orderedById,
        laboratoristName: lo.laboratorist?.name || 'Not assigned',
        status: lo.status,
      })),
      assignedAt: apt.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch lab patients error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}