import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

// Reuse your types
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

export async function GET(req: NextRequest) {
  console.log('✅ [AssignedToDoctor] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [AssignedToDoctor] Unauthorized access');
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('search')?.trim().toLowerCase() || '';

  try {
    const whereClause: any = {
      doctorId: session.user.id,
      visitStatus: {
        in: [
          VisitStatus.REGISTERED,
          VisitStatus.VITALS_TAKEN,
          VisitStatus.ASSIGNED_TO_DOCTOR,
          VisitStatus.EXAMINED,
          VisitStatus.LAB_ORDERED,
          VisitStatus.PAID_FOR_LAB,
          VisitStatus.ASSIGNED_TO_LAB,
          VisitStatus.LAB_COMPLETED,
          VisitStatus.FINALIZED,
        ],
      },
    };

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { id: { equals: searchTerm } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        history: true,
        visitStatus: true,
        vitals: true,
        examination: true,
        prescription: true,
        assignedAt: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    const formatted = patients.map((patient) => {
      const vitals = patient.vitals as VitalsJson | null;
      const examination = patient.examination as ExaminationJson | null;
      const prescription = patient.prescription as PrescriptionJson | null;

      return {
        id: patient.id,
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
              id: examination.appointmentId || null,
              complaints: examination.complaints || '',
              diagnosis: examination.diagnosis || '',
              visitStatus: examination.visitStatus || patient.visitStatus || '',
              medicines: prescription?.medicines || '',
              recommendations: prescription?.recommendations || '',
            }
          : null,
        visitStatus: patient.visitStatus,
        assignedAt: patient.assignedAt ? patient.assignedAt.toISOString() : null,
      };
    });

    console.log('✅ [AssignedToDoctor] Formatted response:', formatted.length, 'patients');
    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('💥 [AssignedToDoctor] Unexpected error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}