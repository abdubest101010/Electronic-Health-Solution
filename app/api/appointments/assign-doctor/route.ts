// app/api/appointments/assign-doctor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';


export async function POST(req: NextRequest) {
  const session = await auth(); // instead of getServerSession(authOptions)

  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, doctorId } = await req.json();

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorId,
        visitStatus: 'ASSIGNED_TO_DOCTOR',
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
