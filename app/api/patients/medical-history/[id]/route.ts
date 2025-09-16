import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await params to unwrap the Promise
  console.log('✅ [MedicalHistoryGET] Request received for patientId:', id);

  const session = await auth();
  if (!session || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [MedicalHistoryGET] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('✅ [MedicalHistoryGET] User authenticated:', session.user.name, session.user.id);

  const patientId = parseInt(id);
  if (isNaN(patientId)) {
    console.warn('❌ [MedicalHistoryGET] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    console.log('🔍 [MedicalHistoryGET] Fetching patient history...');
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { history: true },
    });

    if (!patient) {
      console.warn('❌ [MedicalHistoryGET] Patient not found:', patientId);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    console.log('✅ [MedicalHistoryGET] Fetched history:', patient.history || 'None');
    return NextResponse.json({ history: patient.history || '' });
  } catch (error: any) {
    console.error('💥 [MedicalHistoryGET] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await params to unwrap the Promise
  console.log('✅ [MedicalHistoryPUT] Request received for patientId:', id);

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [MedicalHistoryPUT] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }
  console.log('✅ [MedicalHistoryPUT] User authenticated:', session.user.name, session.user.id);

  const patientId = parseInt(id);
  if (isNaN(patientId)) {
    console.warn('❌ [MedicalHistoryPUT] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  let data;
  try {
    data = await req.json();
    console.log('📥 [MedicalHistoryPUT] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [MedicalHistoryPUT] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { history } = data;
  if (typeof history !== 'string') {
    console.warn('❌ [MedicalHistoryPUT] Invalid history format:', history);
    return NextResponse.json({ error: 'History must be a string' }, { status: 400 });
  }

  try {
    console.log('🔄 [MedicalHistoryPUT] Updating patient history...');
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { history },
    });

    console.log('✅ [MedicalHistoryPUT] History updated for patient:', patientId);
    return NextResponse.json({
      success: true,
      message: 'Medical history updated successfully',
      history: updatedPatient.history,
    });
  } catch (error: any) {
    console.error('💥 [MedicalHistoryPUT] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}