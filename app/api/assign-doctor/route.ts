import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  console.log('✅ [AssignDoctor] Request received');

  // Authenticate user
  const session = await auth();
  if (!session || !session.user || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [AssignDoctor] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [AssignDoctor] User authenticated:', session.user.name, session.user.id);

  let data;
  try {
    data = await req.json();
    console.log('📥 [AssignDoctor] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [AssignDoctor] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, doctorId } = data;

  // Validate input
  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [AssignDoctor] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  if (!doctorId || typeof doctorId !== 'string') {
    console.warn('❌ [AssignDoctor] Invalid or missing doctorId:', doctorId);
    return NextResponse.json({ error: 'Valid doctorId (string) is required' }, { status: 400 });
  }

  try {
    console.log('🔍 [AssignDoctor] Checking patient existence...');
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.warn(`❌ [AssignDoctor] Patient with id ${patientId} not found`);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    console.log('✅ [AssignDoctor] Found patient:', patient.name, patient.id);

    console.log('🔍 [AssignDoctor] Checking doctor existence and role...');
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      console.warn(`❌ [AssignDoctor] Doctor with id ${doctorId} not found`);
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    if (doctor.role !== 'DOCTOR') {
      console.warn(`❌ [AssignDoctor] User ${doctorId} is not a DOCTOR. Role:`, doctor.role);
      return NextResponse.json({ error: 'Selected user is not a doctor' }, { status: 400 });
    }
    console.log('✅ [AssignDoctor] Valid doctor found:', doctor.name, doctor.id);

    console.log('🔄 [AssignDoctor] Updating patient with doctorId and visitStatus...');
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        doctorId: doctorId,
        visitStatus: VisitStatus.ASSIGNED_TO_DOCTOR,
        assignedAt: new Date(),
      },
    });

    console.log('✅ [AssignDoctor] Successfully updated patient:', updatedPatient);
    return NextResponse.json(updatedPatient, { status: 200 });
  } catch (error: any) {
    console.error('💥 [AssignDoctor] Unexpected error during assignment:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}