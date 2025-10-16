import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ patientId: string }> } // 🔥 LINE 6: FIXED
) {
  // 🔥 LINE 10: AWAIT params FIRST
  const { patientId } = await params;
  console.log('✅ [PaidLabOrdersByPatient] Request received for patient:', patientId);

  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    console.log('❌ [PaidLabOrdersByPatient] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist only' }, { status: 401 });
  }
  console.log('✅ [PaidLabOrdersByPatient] User authenticated:', session.user.name, session.user.id);

  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [PaidLabOrdersByPatient] Invalid patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    console.log(`🔍 [PaidLabOrdersByPatient] Fetching TODAY'S paid lab orders for patient ${patientId}...`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        labOrders: {
          where: {
            laboratoristId: session.user.id,
            status: 'PAID',
            paidAt: { gte: today, lt: tomorrow },
          },
          include: {
            service: { select: { name: true } },
            orderedBy: { select: { name: true } },
            laboratorist: { select: { name: true } },
          },
          orderBy: { paidAt: 'asc' },
        },
      },
    });

    if (!patient) {
      console.warn(`❌ [PaidLabOrdersByPatient] Patient not found: ${patientId}`);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const result = {
      patientId: patient.id,
      patientName: patient.name,
      labTests: patient.labOrders.map((order) => ({
        labOrderId: order.id,
        serviceName: order.service.name,
        orderedByName: order.orderedBy.name,
        doctorId: patient.doctor?.id || '',
        doctorName: patient.doctor?.name || 'Not assigned',
        laboratoristName: order.laboratorist?.name || 'Not assigned',
        orderedAt: order.orderedAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || '',
      })),
    };

    console.log('✅ [PaidLabOrdersByPatient] Formatted TODAY response:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('💥 [PaidLabOrdersByPatient] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}