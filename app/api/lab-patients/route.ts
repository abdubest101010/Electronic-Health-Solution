import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

interface LabTest {
  labOrderId: number;
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
  patientId: number;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  visitStatus?: string;
  labTestsByDate: { date: string; labTests: LabTest[] }[];
}

export async function GET(req: NextRequest) {
  console.log('✅ [LabOrders] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [LabOrders] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [LabOrders] User authenticated:', session.user.name, session.user.id);

  try {
    console.log('🔍 [LabOrders] Fetching all lab orders...');
    const labOrders = await prisma.labOrder.findMany({
      where: { orderedBy: { role: 'DOCTOR' } },
      include: {
        patient: { include: { doctor: { select: { id: true, name: true } } } },
        service: { select: { name: true } },
        orderedBy: { select: { name: true } },
        laboratorist: { select: { name: true } },
      },
      orderBy: { orderedAt: 'desc' },
    });

    const groupedByPatient = labOrders.reduce((acc, order) => {
      const patientId = order.patient.id;
      const date = order.orderedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!acc[patientId]) {
        acc[patientId] = {
          patientId,
          patientName: order.patient.name,
          doctorId: order.patient.doctor?.id || '',
          doctorName: order.patient.doctor?.name || 'Not assigned',
          visitStatus: order.patient.visitStatus || 'REGISTERED',
          labTestsByDate: [],
        };
      }
      let dateGroup = acc[patientId].labTestsByDate.find((d) => d.date === date);
      if (!dateGroup) {
        dateGroup = { date, labTests: [] };
        acc[patientId].labTestsByDate.push(dateGroup);
      }
      dateGroup.labTests.push({
        labOrderId: order.id,
        serviceName: order.service.name,
        orderedByName: order.orderedBy.name,
        doctorId: order.patient.doctor?.id || '',
        doctorName: order.patient.doctor?.name || 'Not assigned',
        laboratoristName: order.laboratorist?.name || 'Not assigned',
        status: order.status,
        orderedAt: order.orderedAt.toISOString(),
        paidAt: order.paidAt?.toISOString(),
      });
      return acc;
    }, {} as { [key: number]: LabPatient });

    const result = Object.values(groupedByPatient).map((patient) => ({
      ...patient,
      labTestsByDate: patient.labTestsByDate.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));

    console.log('✅ [LabOrders] Fetched lab orders:', result.length);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('💥 [LabOrders] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}