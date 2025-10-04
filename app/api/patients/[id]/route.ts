import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('✅ [PatientGET] Request received for patient ID:', id);

  const session = await auth();
  console.log('🔍 [PatientGET] Session:', JSON.stringify(session, null, 2));

  if (!session?.user || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [PatientGET] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor or Receptionist only' }, { status: 401 });
  }
  console.log('✅ [PatientGET] User authenticated:', session.user.name, session.user.id, session.user.role);

  const patientId = parseInt(id);
  if (isNaN(patientId)) {
    console.log('❌ [PatientGET] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        gender: true,
        age: true,
        dob: true,
        history: true,
        notifications: true,
        visitStatus: true,
        vitals: true,
        examination: true,
        prescription: true,
        doctorId: true,
        doctor: {
          select: {
            name: true,
          },
        },
        appointments: {
          where: { doctorId: session.user.id },
          orderBy: { dateTime: 'desc' },
          take: 1,
          select: {
            id: true,
            dateTime: true,
          },
        },
      },
    });

    if (!patient) {
      console.log('❌ [PatientGET] Patient not found:', patientId);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Normalize examination and prescription to arrays
    const normalizedPatient = {
      ...patient,
      examination: Array.isArray(patient.examination) ? patient.examination : [],
      prescription: Array.isArray(patient.prescription) ? patient.prescription : [],
    };

    // Filter out null fields and format response
    const filteredPatient: Record<string, any> = {};
    for (const [key, value] of Object.entries(normalizedPatient)) {
      if (value !== null && value !== undefined) {
        if (key === 'doctor' && normalizedPatient.doctor) {
          filteredPatient.doctorName = normalizedPatient.doctor.name;
        } else if (key === 'appointments' && normalizedPatient.appointments[0]) {
          filteredPatient.latestAppointment = {
            id: normalizedPatient.appointments[0].id,
            dateTime: normalizedPatient.appointments[0].dateTime,
            examination: normalizedPatient.examination,
            prescription: normalizedPatient.prescription,
          };
        } else if (key !== 'doctor' && key !== 'appointments') {
          filteredPatient[key] = value;
        }
      }
    }

    console.log('✅ [PatientGET] Patient details:', filteredPatient);
    return NextResponse.json(filteredPatient);
  } catch (error) {
    console.error('💥 [PatientGET] Error fetching patient details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}