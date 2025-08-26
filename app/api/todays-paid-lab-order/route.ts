// app/api/laboratorist/paid-lab-orders/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const labOrders = await prisma.labOrder.findMany({
      where: {
        laboratoristId: session.user.id,
        status: 'PAID',
        paidAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                name: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    const formatted = labOrders.map((order) => ({
      labOrderId: order.id,
      appointmentId: order.appointmentId,
      patientName: order.appointment.patient.name,
      serviceName: order.service.name,
      doctorName: order.appointment.doctor?.name || 'Unknown',
      doctorId: order.appointment.doctor?.id,
      orderedAt: order.createdAt,
      paidAt: order.paidAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Fetch paid lab orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}