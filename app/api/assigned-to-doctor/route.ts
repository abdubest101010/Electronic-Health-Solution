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
  appointmentId?: number | null;
  complaints?: string | null;
  diagnosis?: string | null;
  visitStatus?: string | null;
  createdAt?: string | null;
}

interface PrescriptionJson {
  appointmentId?: number | null;
  medicines?: string | null;
  recommendations?: string | null;
  createdAt?: string | null;
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
        in: ['REGISTERED', 'VITALS_TAKEN', 'ASSIGNED_TO_DOCTOR', 'EXAMINED', 'LAB_ORDERED', 'PAID_FOR_LAB', 'ASSIGNED_TO_LAB', 'LAB_COMPLETED', 'FINALIZED'],
      },
    };

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm } }, // Removed mode: 'insensitive'
      ];
      const parsedId = parseInt(searchTerm);
      if (!isNaN(parsedId)) {
        whereClause.OR.push({ id: { equals: parsedId } });
      }
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
        assignedAt: { sort: 'desc', nulls: 'last' }, // Sort by assignedAt, nulls last
      },
    });

    const formatted = patients.map((patient) => {
      const vitals = patient.vitals as VitalsJson | null;
      const examinations = Array.isArray(patient.examination) ? patient.examination as ExaminationJson[] : [];
      const prescriptions = Array.isArray(patient.prescription) ? patient.prescription as PrescriptionJson[] : [];
      const latestExamination = examinations[examinations.length - 1];
      const latestPrescription = prescriptions[prescriptions.length - 1];

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
        examination: latestExamination
          ? {
              id: latestExamination.appointmentId || 0,
              complaints: latestExamination.complaints || '',
              diagnosis: latestExamination.diagnosis || '',
              visitStatus: latestExamination.visitStatus || patient.visitStatus || '',
              medicines: latestPrescription?.medicines || '',
              recommendations: latestPrescription?.recommendations || '',
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