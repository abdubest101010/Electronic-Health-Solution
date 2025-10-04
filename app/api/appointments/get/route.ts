import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [GetAppointment] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }

  const patientId = req.nextUrl.searchParams.get('patientId');
  if (!patientId || isNaN(parseInt(patientId))) {
    console.warn('❌ [GetAppointment] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId is required' }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: parseInt(patientId),
        dateTime: { not: null },
        status: 'SCHEDULED', // Only fetch active appointments
      },
      orderBy: { dateTime: 'desc' }, // Get the latest appointment
    });

    if (!appointment) {
      console.log('✅ [GetAppointment] No appointment found for patientId:', patientId);
      return NextResponse.json({ hasAppointment: false });
    }

    console.log('✅ [GetAppointment] Appointment found for patientId:', patientId, 'appointmentId:', appointment.id);
    return NextResponse.json({
      id: appointment.id,
      patientId: appointment.patientId,
      dateTime: appointment?.dateTime?.toISOString(),
      status: appointment.status,
    });
  } catch (error: any) {
    console.error('💥 [GetAppointment] Error fetching appointment:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}