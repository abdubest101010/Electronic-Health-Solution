// app/api/appointments/create/route.ts (new for doctors to create appointments, dateTime required but can be future)
import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';
export async function POST(req: NextRequest) {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { patientId, dateTime } = await req.json();

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: session.user.id,
        dateTime: new Date(dateTime),
        status: 'SCHEDULED',
        visitStatus: 'REGISTERED',
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}