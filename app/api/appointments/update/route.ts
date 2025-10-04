import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  console.log('✅ [UpdateAppointment] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [UpdateAppointment] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }
  console.log('✅ [UpdateAppointment] User authenticated:', session.user.name, session.user.id);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id || isNaN(parseInt(id))) {
    console.warn('❌ [UpdateAppointment] Invalid or missing appointment ID:', id);
    return NextResponse.json({ error: 'Valid appointment ID is required' }, { status: 400 });
  }

  let data;
  try {
    data = await req.json();
    console.log('📥 [UpdateAppointment] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [UpdateAppointment] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, dateTime } = data;

  if (!patientId || isNaN(parseInt(patientId))) {
    console.warn('❌ [UpdateAppointment] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (number) is required' }, { status: 400 });
  }

  if (!dateTime || isNaN(Date.parse(dateTime))) {
    console.warn('❌ [UpdateAppointment] Invalid or missing dateTime:', dateTime);
    return NextResponse.json({ error: 'Valid dateTime is required' }, { status: 400 });
  }

  try {
    console.log('🔍 [UpdateAppointment] Updating appointment...');
    const parsedPatientId = parseInt(patientId);
    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        patientId: parsedPatientId,
        doctorId: session.user.id,
        dateTime: new Date(dateTime),
      },
    });

    console.log('✅ [UpdateAppointment] Appointment updated:', appointment.id);
    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('💥 [UpdateAppointment] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}