// Updated API route for patient registration (no appointmentDateTime, set to now)
import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';
export async function POST(req: NextRequest) {
const session = await auth(); // instead of getServerSession(authOptions)
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const {
    name,
    gender,
    phone,
    address,
    weight,
    bpSystolic,
    bpDiastolic,
  } = data;

  try {
    // Find or create patient
    let patient = await prisma.patient.findFirst({ where: { phone } });
    if (!patient) {
      patient = await prisma.patient.create({
        data: { name, gender, phone, address },
      });
    }

    // Create appointment with current time
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        dateTime: new Date(),
        status: 'SCHEDULED',
        visitStatus: 'REGISTERED',
      },
    });

    // Update vitals
    await prisma.appointment.update({
      where: { id: appointment.id },
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

    return NextResponse.json({ patient, appointment });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}