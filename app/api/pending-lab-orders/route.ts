import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

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
    const patients = await prisma.patient.findMany({
      where: {
        visitStatus: VisitStatus.ASSIGNED_TO_LAB,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
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

    const result = patients.map((patient) => ({
      patientId: patient.id,
      patientName: patient.name,
      labTests: patient.labOrders.map((lo) => ({
        labOrderId: lo.id,
        serviceName: lo.service.name,
        orderedById: lo.orderedById,
        laboratoristName: lo.laboratorist?.name || 'Not assigned',
        status: lo.status,
      })),
      assignedAt: patient.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch lab patients error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
