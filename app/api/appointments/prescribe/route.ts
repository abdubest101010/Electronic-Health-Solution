// app/api/appointments/prescribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth'; // use the new helper from your auth.ts

export async function POST(req: NextRequest) {
  const session = await auth(); // instead of getServerSession(authOptions)
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, medicines, recommendations, nextAppointment } = await req.json();

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Allow prescribe if EXAMINED (no lab) or LAB_COMPLETED (after lab)
    if (!['EXAMINED', 'LAB_COMPLETED'].includes(appointment.visitStatus)) {
      return NextResponse.json({ error: 'Invalid visit status for prescription' }, { status: 400 });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        prescription: {
          doctorId: session.user.id,
          medicines,
          recommendations,
          nextAppointment: nextAppointment ? new Date(nextAppointment) : undefined,
          createdAt: new Date(),
        },
        visitStatus: 'FINALIZED',
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}