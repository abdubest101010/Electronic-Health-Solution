import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    console.log(`🔍 [PaidLabOrders] Fetching paid lab orders for laboratorist ${session.user.id}, page ${page}...`);
    const [labOrders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where: {
          laboratoristId: session.user.id,
          status: 'PAID',
          paidAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          patient: {
            include: {
              doctor: { select: { id: true, name: true } },
            },
          },
          service: {
            select: { name: true },
          },
          orderedBy: {
            select: { name: true },
          },
          laboratorist: {
            select: { name: true },
          },
        },
        orderBy: { paidAt: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.labOrder.count({
        where: {
          laboratoristId: session.user.id,
          status: 'PAID',
          paidAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    const formatted = labOrders.map((order) => ({
      labOrderId: order.id,
      patientName: order.patient.name,
      serviceName: order.service.name,
      doctorId: order.patient.doctor?.id || '',
      doctorName: order.patient.doctor?.name || 'Not assigned',
      orderedByName: order.orderedBy.name,
      laboratoristName: order.laboratorist?.name || 'Not assigned',
      orderedAt: order.orderedAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || '',
    }));

    console.log('✅ [PaidLabOrders] Fetched lab orders:', formatted.length, 'Total:', total);
    return NextResponse.json({ data: formatted, total });
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