// app/api/appointments/examine/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, complaints, diagnosis, visitDetails } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Only update examination — DO NOT touch `history` as array
    await prisma.appointment.update({
       
        where: { id: appointmentId },
         data:{
          examination: {
            doctorId: session.user.id,
            complaints,
            diagnosis,
            examinedAt: new Date(),
          },
          visitStatus: VisitStatus.EXAMINED,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Examination saved successfully',
    });
  } catch (error) {
    console.error('Examination error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}