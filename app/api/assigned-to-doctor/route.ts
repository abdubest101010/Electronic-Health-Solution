import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Reuse your types
interface VitalsJson {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredById?: string | null;
  measuredAt?: string | null;
}

interface ExaminationJson {
  doctorId?: string | null;
  complaints?: string | null;
  diagnosis?: string | null;
  examinedAt?: string | null;
}

interface PrescriptionJson {
  doctorId?: string | null;
  medicines?: string | null;
  recommendations?: string | null;
  nextAppointment?: string | null;
  createdAt?: string | null;
}

export async function GET(req: NextRequest) {
  console.log('✅ [AssignedToDoctor] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [AssignedToDoctor] Unauthorized access');
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }

  try {
    const patients = await prisma.patient.findMany({
      where: {
        doctorId: session.user.id,
        visitStatus: {
          in: ['REGISTERED', 'VITALS_TAKEN', 'ASSIGNED_TO_DOCTOR', 'EXAMINED', 'LAB_ORDERED', 'PAID_FOR_LAB', 'ASSIGNED_TO_LAB', 'LAB_COMPLETED', 'FINALIZED'],
        },
      },
      select: {
        id: true,
        name: true,
        history: true,
        visitStatus: true,
        vitals: true,
        appointments: {
          where: { doctorId: session.user.id },
          orderBy: { dateTime: 'desc' },
          take: 1,
          select: {
            id: true,
            dateTime: true,
            examination: true,
            prescription: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = patients.map((patient) => {
      const latestAppointment = patient.appointments[0];
      const vitals = patient.vitals as VitalsJson | null;
      const examination = latestAppointment?.examination as ExaminationJson | null;
      const prescription = latestAppointment?.prescription as PrescriptionJson | null;

      return {
        id: latestAppointment?.id || 0,
        patient: {
          id: patient.id,
          name: patient.name,
          history: patient.history || '',
        },
        vitals: {
          weight: vitals?.weight ?? null,
          bpSystolic: vitals?.bpSystolic ?? null,
          bpDiastolic: vitals?.bpDiastolic ?? null,
        },
        examination: examination
          ? {
              id: latestAppointment.id,
              complaints: examination.complaints || '',
              diagnosis: examination.diagnosis || '',
              medicines: prescription?.medicines || '',
              recommendations: prescription?.recommendations || '',
            }
          : null,
        visitStatus: patient.visitStatus,
        latestAppointment: latestAppointment
          ? {
              id: latestAppointment.id,
              dateTime: latestAppointment.dateTime?.toISOString() || null,
            }
          : null,
      };
    });

    console.log('✅ [AssignedToDoctor] Formatted response:', formatted.length);
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('💥 [AssignedToDoctor] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}