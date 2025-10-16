import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

interface HistoryJson {
  [key: string]: any; // Index signature for InputJsonValue
}

interface NotificationsJson {
  [key: string]: any; // Index signature for InputJsonValue
}

interface VitalsJson {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredById?: string | null;
  measuredAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

interface ExaminationJson {
  appointmentId?: string | null;
  complaints?: string | null;
  diagnosis?: string | null;
  visitStatus?: VisitStatus | null;
  createdAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

interface PrescriptionJson {
  appointmentId?: string | null;
  medicines?: string | null;
  recommendations?: string | null;
  createdAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log('✅ [PatientGET] Request received for patient ID:', id);

  const session = await auth();
  if (!session?.user || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [PatientGET] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor or Receptionist only' }, { status: 401 });
  }
  console.log('✅ [PatientGET] User authenticated:', session.user.name, session.user.id, session.user.role);

  if (!id || typeof id !== 'string') {
    console.log('❌ [PatientGET] Invalid patient ID:', id);
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
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
      },
    });

    if (!patient) {
      console.log('❌ [PatientGET] Patient not found:', id);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const filteredPatient: Record<string, any> = {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      address: patient.address,
      gender: patient.gender,
      age: patient.age,
      dob: patient.dob?.toISOString() || null,
      history: patient.history ? (patient.history as unknown as HistoryJson) : null,
      notifications: patient.notifications ? (patient.notifications as unknown as NotificationsJson) : null,
      visitStatus: patient.visitStatus || null,
      vitals: patient.vitals ? (patient.vitals as unknown as VitalsJson) : null,
      examination: patient.examination ? (patient.examination as unknown as ExaminationJson) : null,
      prescription: patient.prescription ? (patient.prescription as unknown as PrescriptionJson) : null,
      doctorName: patient.doctor?.name || null,
    };

    console.log('✅ [PatientGET] Patient details:', filteredPatient);
    return NextResponse.json(filteredPatient);
  } catch (error) {
    console.error('💥 [PatientGET] Error fetching patient details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}