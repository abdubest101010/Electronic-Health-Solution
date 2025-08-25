// app/api/appointments/prescribe/route.ts
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, medicines, recommendations } = await req.json(); // ❌ Removed nextAppointment

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Ensure doctor owns this appointment
    if (appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: Not assigned to this patient' }, { status: 403 });
    }

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
          createdAt: new Date(),
        },
        visitStatus: 'FINALIZED',
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prescription error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}