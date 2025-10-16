import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('✅ [LabOrdersByPatient] Request received for patient:', params.id);

  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    console.log('❌ [LabOrdersByPatient] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist only' }, { status: 401 });
  }
  console.log('✅ [LabOrdersByPatient] User authenticated:', session.user.name, session.user.id);

  const patientId = params.id;
  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [LabOrdersByPatient] Invalid patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    console.log(`🔍 [LabOrdersByPatient] Fetching paid lab orders for patient ${patientId}...`);
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        visitStatus: true,
        doctor: { select: { id: true, name: true } },
        labOrders: {
          where: {
            laboratoristId: session.user.id,
            status: 'PAID', // Ensure this matches
          },
          select: {
            id: true,
            service: { select: { name: true } },
            orderedBy: { select: { name: true } },
            laboratorist: { select: { name: true } },
            status: true,
            orderedAt: true,
            paidAt: true,
          },
          orderBy: { orderedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      console.warn(`❌ [LabOrdersByPatient] Patient not found: ${patientId}`);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (patient.labOrders.length === 0) {
      console.warn(`❌ [LabOrdersByPatient] No paid lab orders found for patient ${patientId}`);
      return NextResponse.json({ error: 'No paid lab orders found for this patient' }, { status: 404 });
    }

    const result = {
      patientId: patient.id,
      patientName: patient.name,
      doctorId: patient.doctor?.id || '',
      doctorName: patient.doctor?.name || 'Not assigned',
      visitStatus: patient.visitStatus || null,
      labOrders: patient.labOrders.map((order) => ({
        labOrderId: order.id,
        serviceName: order.service.name,
        orderedByName: order.orderedBy.name,
        doctorId: patient.doctor?.id || '',
        doctorName: patient.doctor?.name || 'Not assigned',
        laboratoristName: order.laboratorist?.name || 'Not assigned',
        status: order.status,
        orderedAt: order.orderedAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || '',
      })),
    };

    console.log('🔍 [LabOrdersByPatient] Formatted response:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('💥 [LabOrdersByPatient] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}