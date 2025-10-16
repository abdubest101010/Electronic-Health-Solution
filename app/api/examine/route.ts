import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

interface Examination {
  appointmentId: string | null;
  complaints: string | null;
  diagnosis: string | null;
  visitStatus: VisitStatus;
  createdAt: string;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  console.log('✅ [Examine] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [Examine] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }
  console.log('✅ [Examine] User authenticated:', session.user.name, session.user.id);

  let data;
  try {
    data = await req.json();
    console.log('📥 [Examine] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [Examine] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, complaints, diagnosis, appointmentId } = data;

  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [Examine] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.warn('❌ [Examine] Patient not found:', patientId);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // ✅ Parse existing examination history (ensure it's an array)
    const existingExaminations = Array.isArray(patient.examination)
      ? patient.examination
      : [];

    // ✅ Create new examination record (partial is OK)
    const newExamination: Examination = {
      appointmentId: appointmentId || null,
      createdAt: new Date().toISOString(),
      complaints: complaints?.trim() || null,
      diagnosis: diagnosis?.trim() || null,
      visitStatus: VisitStatus.EXAMINED,
    };

    if (!newExamination.complaints && !newExamination.diagnosis) {
      console.warn('❌ [Examine] No valid complaints or diagnosis provided');
      return NextResponse.json({ error: 'At least one of complaints or diagnosis is required' }, { status: 400 });
    }

    // ✅ Append new record to history
    const updatedExaminations = [...existingExaminations, newExamination];

    // ✅ Save the full array back
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        examination: updatedExaminations as any, // Prisma accepts Json as any
        visitStatus: VisitStatus.EXAMINED,
      },
    });

    console.log('✅ [Examine] Appended examination. Total records:', updatedExaminations.length);
    return NextResponse.json({ examination: newExamination });
  } catch (error: any) {
    console.error('💥 [Examine] Error saving examination:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}