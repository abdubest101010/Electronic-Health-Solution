// app/api/appointments/update-vitals/route.ts (new for receptionist to add vitals to existing appointments, e.g., for scheduled ones)
import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId, weight, bpSystolic, bpDiastolic } = await req.json();

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        vitals: {
          weight,
          bpSystolic,
          bpDiastolic,
          measuredById: session.user.id,
          measuredAt: new Date(),
        },
        visitStatus: 'VITALS_TAKEN',
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}