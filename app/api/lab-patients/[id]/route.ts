import { NextRequest } from 'next/server';
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

// ✅ CORRECT SIGNATURE
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: patientId } = params; // ✅ Destructure here

  console.log('✅ [PatientLabOrdersById] Request received for patient:', patientId);

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    return new Response(JSON.stringify({ error: 'Unauthorized: Receptionist only' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!patientId || typeof patientId !== 'string') {
    return new Response(JSON.stringify({ error: 'Valid patientId (string) is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
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
      return new Response(JSON.stringify({ error: 'Patient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const labTestsByDate = patient.labOrders.reduce((acc, lo) => {
      const date = lo.orderedAt.toISOString().split('T')[0];
      let group = acc.find((g) => g.date === date);
      if (!group) {
        group = { date, labTests: [] };
        acc.push(group);
      }
      group.labTests.push({
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('💥 [PatientLabOrdersById] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}