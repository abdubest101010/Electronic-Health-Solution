import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params?: { id?: string } }) {
  console.log('✅ [PaidLabOrders] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    console.log('❌ [PaidLabOrders] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist only' }, { status: 401 });
  }
  console.log('✅ [PaidLabOrders] User authenticated:', session.user.name, session.user.id);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const perPage = parseInt(url.searchParams.get('perPage') || '20');
  const skip = (page - 1) * perPage;
  const patientId = params?.id ? parseInt(params.id) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today (Africa/Nairobi)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    if (patientId) {
      console.log(`🔍 [PaidLabOrders] Fetching paid lab orders for patient ${patientId}...`);
      if (isNaN(patientId)) {
        console.warn('❌ [PaidLabOrders] Invalid patientId:', params?.id);
        return NextResponse.json({ error: 'Valid patientId is required' }, { status: 400 });
      }

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
        console.warn(`❌ [PaidLabOrders] Patient not found: ${patientId}`);
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

      console.log('✅ [PaidLabOrders] Formatted response for patient:', result);
      return NextResponse.json(result);
    } else {
      console.log(`🔍 [PaidLabOrders] Fetching patients with paid lab orders for laboratorist ${session.user.id}, page ${page}...`);
      const patientIds = await prisma.labOrder.groupBy({
        by: ['patientId'],
        where: {
          laboratoristId: session.user.id,
          status: 'PAID',
          paidAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: { patientId: 'asc' },
        skip,
        take: perPage,
      });

      const total = await prisma.labOrder.groupBy({
        by: ['patientId'],
        where: {
          laboratoristId: session.user.id,
          status: 'PAID',
          paidAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }).then((result) => result.length);

      const patientData = await prisma.patient.findMany({
        where: {
          id: { in: patientIds.map((p) => p.patientId) },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      });

      const formatted = patientData.map((patient) => ({
        patientId: patient.id,
        patientName: patient.name,
      }));

      console.log('✅ [PaidLabOrders] Fetched patients:', formatted.length, 'Total:', total);
      return NextResponse.json({ data: formatted, total });
    }
  } catch (error: any) {
    console.error('💥 [PaidLabOrders] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
