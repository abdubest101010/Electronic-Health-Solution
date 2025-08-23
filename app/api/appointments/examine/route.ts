// app/api/appointments/examine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth'; // use the new helper from your auth.ts
import { VisitStatus } from '@prisma/client';


export async function POST(req: NextRequest) {
  const session = await auth(); // instead of getServerSession(authOptions)
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, complaints, diagnosis, visitDetails, labServiceIds } = await req.json();

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Update examination
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        examination: {
          doctorId: session.user.id,
          complaints,
          diagnosis,
          examinedAt: new Date(),
        },
        visitStatus: VisitStatus.EXAMINED,
      },
    });

    // Append to patient history
    const currentHistory: any[] = Array.isArray(appointment.patient.history)
      ? (appointment.patient.history as any[])
      : [];
    const updatedHistory = [
      ...currentHistory,
      { appointmentId, visitDetails, completedAt: new Date() },
    ];
    await prisma.patient.update({
      where: { id: appointment.patientId },
      data: {
        history: updatedHistory,
      },
    });

    // If labs needed
    let visitStatus: VisitStatus = VisitStatus.EXAMINED;
    if (labServiceIds && labServiceIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const serviceId of labServiceIds) {
          await tx.labOrder.create({
            data: {
              appointmentId,
              serviceId,
              orderedById: session.user.id,
              status: 'ORDERED',
            },
          });
        }
      });
      visitStatus = VisitStatus.LAB_ORDERED;
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { visitStatus },
      });
    }

    return NextResponse.json({ ...appointment, visitStatus });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}