import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

interface LabTest {
  labOrderId: string;
  serviceName: string;
  orderedByName: string;
  doctorId: string;
  doctorName: string;
  laboratoristName: string;
  status: string;
  orderedAt: string;
  paidAt?: string;
}

interface LabPatient {
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  visitStatus?: VisitStatus | null;
  labTestsByDate: { date: string; labTests: LabTest[] }[];
}

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔥 FIXED: Await params FIRST, then log
  const { id: patientId } = await params;
  console.log('✅ [PatientLabOrdersById] Request received for patient:', patientId);

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [PatientLabOrdersById] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [PatientLabOrdersById] User authenticated:', session.user.name, session.user.id);

  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [PatientLabOrdersById] Invalid patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    console.log(`🔍 [PatientLabOrdersById] Fetching lab orders for patient ${patientId}...`);
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        labOrders: {
          where: { orderedBy: { role: 'DOCTOR' } },
          include: {
            service: { select: { name: true } },
            orderedBy: { select: { name: true } },
            laboratorist: { select: { name: true } },
          },
          orderBy: { orderedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      console.warn(`❌ [PatientLabOrdersById] Patient not found: ${patientId}`);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const labTestsByDate = patient.labOrders.reduce((acc, lo) => {
      const date = lo.orderedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      let dateGroup = acc.find((d) => d.date === date);
      if (!dateGroup) {
        dateGroup = { date, labTests: [] };
        acc.push(dateGroup);
      }
      dateGroup.labTests.push({
        labOrderId: lo.id,
        serviceName: lo.service.name,
        orderedByName: lo.orderedBy.name,
        doctorId: patient.doctor?.id || '',
        doctorName: patient.doctor?.name || 'Not assigned',
        laboratoristName: lo.laboratorist?.name || 'Not assigned',
        status: lo.status,
        orderedAt: lo.orderedAt.toISOString(),
        paidAt: lo.paidAt?.toISOString(),
      });
      return acc;
    }, [] as { date: string; labTests: LabTest[] }[]);

    const result: LabPatient = {
      patientId: patient.id,
      patientName: patient.name,
      doctorId: patient.doctor?.id || '',
      doctorName: patient.doctor?.name || 'Not assigned',
      visitStatus: patient.visitStatus || null,
      labTestsByDate: labTestsByDate.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };

    console.log('✅ [PatientLabOrdersById] Formatted response:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('💥 [PatientLabOrdersById] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}