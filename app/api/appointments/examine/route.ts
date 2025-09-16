import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [Examine] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }

  let data;
  try {
    data = await req.json();
    console.log('📥 [Examine] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [Examine] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, complaints, diagnosis, visitDetails } = data;

  if (!patientId || isNaN(parseInt(patientId))) {
    console.warn('❌ [Examine] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId is required' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.update({
      where: { id: parseInt(patientId) },
      data: {
        examination: {
          complaints: complaints || null,
          diagnosis: diagnosis || null,
          visitDetails: visitDetails || null,
        },
      },
    });

    console.log('✅ [Examine] Examination saved for patientId:', patientId);
    return NextResponse.json(patient);
  } catch (error: any) {
    console.error('💥 [Examine] Error saving examination:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}