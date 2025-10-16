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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [VitalsPOST] Unauthorized access');
    return NextResponse.json({ error: 'Unauthorized: Doctor or Receptionist only' }, { status: 401 });
  }

  if (!id || typeof id !== 'string') {
    console.log('❌ [VitalsPOST] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { weight, bpSystolic, bpDiastolic } = body;

    console.log('🔍 [VitalsPOST] Request body:', body);

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

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      console.log('❌ [VitalsPOST] Patient not found:', id);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
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

    console.log('✅ [VitalsPOST] Vitals added for patient:', id);
    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('💥 [VitalsPOST] Error adding vitals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [VitalsPUT] Unauthorized access');
    return NextResponse.json({ error: 'Unauthorized: Doctor or Receptionist only' }, { status: 401 });
  }

  if (!id || typeof id !== 'string') {
    console.log('❌ [VitalsPUT] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { weight, bpSystolic, bpDiastolic } = body;

    console.log('🔍 [VitalsPUT] Request body:', body);

    if (isNaN(weight) || weight <= 0) {
      console.log('❌ [VitalsPUT] Invalid weight:', weight);
      return NextResponse.json({ error: 'Invalid weight: must be a positive number' }, { status: 400 });
    }
    if (isNaN(bpSystolic) || bpSystolic <= 0) {
      console.log('❌ [VitalsPUT] Invalid bpSystolic:', bpSystolic);
      return NextResponse.json({ error: 'Invalid systolic blood pressure: must be a positive number' }, { status: 400 });
    }
    if (isNaN(bpDiastolic) || bpDiastolic <= 0) {
      console.log('❌ [VitalsPUT] Invalid bpDiastolic:', bpDiastolic);
      return NextResponse.json({ error: 'Invalid diastolic blood pressure: must be a positive number' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      console.log('❌ [VitalsPUT] Patient not found');
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        vitals: {
          weight,
          bpSystolic,
          bpDiastolic,
          measuredById: session.user.id,
          measuredAt: new Date().toISOString(),
        } as VitalsJson,
      },
    });

    console.log('✅ [VitalsPUT] Vitals updated for patient:', id);
    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('💥 [VitalsPUT] Error updating vitals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}