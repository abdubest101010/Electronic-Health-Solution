import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subHours } from 'date-fns';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [Prescribe] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }

  let data;
  try {
    data = await req.json();
    console.log('📥 [Prescribe] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [Prescribe] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, medicines, recommendations, appointmentId } = data;

  if (!patientId || isNaN(parseInt(patientId))) {
    console.warn('❌ [Prescribe] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId is required' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      select: { prescription: true },
    });

    const appointment = await prisma.appointment.findFirst({
      where: { 
        patientId: parseInt(patientId),
        doctorId: session.user.id,
        dateTime: { gte: subHours(startOfDay(new Date()), 3) }, // Adjust for EAT
      },
      select: { id: true },
    });

    if (!appointment && appointmentId) {
      console.warn('❌ [Prescribe] Invalid appointmentId:', appointmentId);
      return NextResponse.json({ error: 'Valid appointmentId is required' }, { status: 400 });
    }

    const existingPrescriptions = Array.isArray(patient?.prescription) ? patient.prescription : [];

    const newPrescription = {
      appointmentId: appointment ? appointment.id : null,
      medicines: medicines || null,
      recommendations: recommendations || null,
      createdAt: new Date().toISOString(),
    };

    const updatedPatient = await prisma.$transaction([
      prisma.patient.update({
        where: { id: parseInt(patientId) },
        data: {
          prescription: [...existingPrescriptions, newPrescription],
          visitStatus: 'FINALIZED',
        },
      }),
    ]);

    console.log('✅ [Prescribe] Prescription appended for patientId:', patientId);
    return NextResponse.json(updatedPatient[0]);
  } catch (error: any) {
    console.error('💥 [Prescribe] Error saving prescription:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
