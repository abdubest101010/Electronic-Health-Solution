import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Define the VisitStatus type based on the Prisma schema
type VisitStatus = 'REGISTERED' | 'VITALS_TAKEN' | 'ASSIGNED_TO_DOCTOR' | 'EXAMINED' | 'LAB_ORDERED' | 'PAID_FOR_LAB' | 'ASSIGNED_TO_LAB' | 'LAB_COMPLETED' | 'FINALIZED';

// Define the Examination interface with index signature for JSON compatibility
interface Examination {
  appointmentId: number | null;
  complaints: string | null;
  diagnosis: string | null;
  visitStatus: VisitStatus;
  createdAt: string;
  [key: string]: any; // Index signature for InputJsonValue compatibility
}

// Helper function to validate and convert JSON array to Examination[]
function validateExaminations(json: any): Examination[] {
  const result: Examination[] = [];

  if (!Array.isArray(json)) {
    return result;
  }

  const validStatuses: VisitStatus[] = [
    'REGISTERED',
    'VITALS_TAKEN',
    'ASSIGNED_TO_DOCTOR',
    'EXAMINED',
    'LAB_ORDERED',
    'PAID_FOR_LAB',
    'ASSIGNED_TO_LAB',
    'LAB_COMPLETED',
    'FINALIZED',
  ];

  for (const item of json) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'visitStatus' in item &&
      'createdAt' in item &&
      typeof item.visitStatus === 'string' &&
      validStatuses.includes(item.visitStatus as VisitStatus) &&
      typeof item.createdAt === 'string' &&
      ('complaints' in item ? item.complaints === null || typeof item.complaints === 'string' : true) &&
      ('diagnosis' in item ? item.diagnosis === null || typeof item.diagnosis === 'string' : true) &&
      ('appointmentId' in item ? item.appointmentId === null || typeof item.appointmentId === 'number' : true)
    ) {
      result.push({
        appointmentId: item.appointmentId === null || typeof item.appointmentId === 'number' ? item.appointmentId : null,
        complaints: item.complaints === null || typeof item.complaints === 'string' ? item.complaints : null,
        diagnosis: item.diagnosis === null || typeof item.diagnosis === 'string' ? item.diagnosis : null,
        visitStatus: item.visitStatus as VisitStatus,
        createdAt: item.createdAt as string,
        // Preserve any additional fields for JSON compatibility
        ...Object.keys(item).reduce((acc, key) => {
          if (!['appointmentId', 'complaints', 'diagnosis', 'visitStatus', 'createdAt'].includes(key)) {
            acc[key] = item[key];
          }
          return acc;
        }, {} as Record<string, any>),
      });
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  console.log('✅ [Examine] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    console.log('❌ [Examine] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor only' }, { status: 401 });
  }
  console.log('✅ [Examine] User authenticated:', session.user.name, session.user.id);

  let data;
  try {
    data = await req.json();
    console.log('📥 [Examine] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [Examine] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, complaints, diagnosis, appointmentId } = data;

  if (!patientId || isNaN(parseInt(patientId))) {
    console.warn('❌ [Examine] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId is required' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      select: { examination: true },
    });

    // Validate and cast examination to Examination[]
    let existingExaminations: Examination[] = patient?.examination
      ? validateExaminations(patient.examination)
      : [];

    // Get the current date (without time) for comparison
    const currentDate = new Date().toISOString().split('T')[0];

    // Find the most recent examination with non-empty complaints from the same day
    const recentExamination = existingExaminations
      .filter((exam) => exam.complaints && exam.createdAt.startsWith(currentDate) && exam.diagnosis === null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const newExamination: Examination = {
      appointmentId: appointmentId ? parseInt(appointmentId) : null,
      createdAt: new Date().toISOString(),
      complaints: null,
      diagnosis: null,
      visitStatus: 'EXAMINED', // Use EXAMINED for both complaints and diagnosis
      // [key: string]: any, // Ensure index signature is present
    };

    // Add complaints if provided
    if (complaints && complaints.trim()) {
      newExamination.complaints = complaints.trim();
    }

    // Add diagnosis if provided, and merge with recent complaints if available
    if (diagnosis && diagnosis.trim()) {
      newExamination.diagnosis = diagnosis.trim();
      if (!newExamination.complaints && recentExamination?.complaints) {
        newExamination.complaints = recentExamination.complaints; // Merge recent complaints
        console.log('🔍 [Examine] Combining existing complaints:', recentExamination.complaints, 'with new diagnosis:', diagnosis);
      }
    }

    // Only append new examination if at least one of complaints or diagnosis is provided
    if (!newExamination.complaints && !newExamination.diagnosis) {
      console.warn('❌ [Examine] No valid complaints or diagnosis provided');
      return NextResponse.json({ error: 'At least one of complaints or diagnosis is required' }, { status: 400 });
    }

    // Remove the complaints-only examination if merging with a diagnosis
    if (recentExamination && newExamination.diagnosis) {
      existingExaminations = existingExaminations.filter(
        (exam) => !(exam.complaints === recentExamination.complaints && exam.diagnosis === null && exam.createdAt === recentExamination.createdAt)
      );
      console.log('✅ [Examine] Removed complaints-only examination:', recentExamination);
    }

    // Update patient with the new examination array and visitStatus
    const updatedPatient = await prisma.patient.update({
      where: { id: parseInt(patientId) },
      data: {
        examination: [...existingExaminations, newExamination],
        visitStatus: 'EXAMINED', // Use EXAMINED for consistency
      },
    });

    console.log('✅ [Examine] Examination saved for patientId:', patientId, newExamination);
    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error('💥 [Examine] Error saving examination:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
