import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

interface VitalsJson {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredById?: string | null;
  measuredAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('Unauthorized access attempt:', { session });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { patientId, weight, bpSystolic, bpDiastolic } = await req.json();

  if (!patientId || typeof patientId !== 'string') {
    console.log('❌ [VitalsPOST] Invalid patient ID:', patientId);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  if (isNaN(weight) || weight <= 0) {
    console.log('❌ [VitalsPOST] Invalid weight:', weight);
    return NextResponse.json({ error: 'Invalid weight: must be a positive number' }, { status: 400 });
  }
  if (isNaN(bpSystolic) || bpSystolic <= 0) {
    console.log('❌ [VitalsPOST] Invalid bpSystolic:', bpSystolic);
    return NextResponse.json({ error: 'Invalid systolic blood pressure: must be a positive number' }, { status: 400 });
  }
  if (isNaN(bpDiastolic) || bpDiastolic <= 0) {
    console.log('❌ [VitalsPOST] Invalid bpDiastolic:', bpDiastolic);
    return NextResponse.json({ error: 'Invalid diastolic blood pressure: must be a positive number' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.log('❌ [VitalsPOST] Patient not found:', patientId);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        vitals: {
          weight,
          bpSystolic,
          bpDiastolic,
          measuredById: session.user.id,
          measuredAt: new Date().toISOString(),
        } as VitalsJson,
        visitStatus: VisitStatus.VITALS_TAKEN,
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Error updating vitals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
