import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LabOrderStatus, VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  console.log('✅ [MarkAsPaid] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [MarkAsPaid] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [MarkAsPaid] User authenticated:', session.user.name, session.user.id);

  let data;
  try {
    data = await req.json();
    console.log('📥 [MarkAsPaid] Parsed JSON payload:', data);
  } catch (err) {
    console.error('❌ [MarkAsPaid] Failed to parse JSON:', err);
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }

  const { patientId, date } = data;

  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [MarkAsPaid] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn('❌ [MarkAsPaid] Invalid or missing date:', date);
    return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
  }

  // Adjust for Africa/Nairobi (EAT, UTC+3)
  const startOfDay = new Date(`${date}T00:00:00+03:00`);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  try {
    console.log(`🔍 [MarkAsPaid] Checking lab orders for patient ${patientId} on ${date}...`);
    const labOrders = await prisma.labOrder.findMany({
      where: {
        patientId: patientId,
        status: LabOrderStatus.ASSIGNED,
        orderedAt: { gte: startOfDay, lt: endOfDay },
      },
      select: { id: true, orderedAt: true, status: true },
    });

    if (labOrders.length === 0) {
      console.warn(`❌ [MarkAsPaid] No ASSIGNED lab orders found for patient ${patientId} on ${date}`);
      const allLabOrders = await prisma.labOrder.findMany({
        where: {
          patientId: patientId,
          orderedAt: { gte: startOfDay, lt: endOfDay },
        },
        select: { id: true, status: true, orderedAt: true },
      });
      console.log(`🔍 [MarkAsPaid] All lab orders for patient ${patientId} on ${date}:`, allLabOrders);
      return NextResponse.json(
        { error: `No ASSIGNED lab orders found for patient ${patientId} on ${date}`, allLabOrders },
        { status: 404 }
      );
    }

    console.log(`🔍 [MarkAsPaid] Updating ${labOrders.length} lab orders for patient ${patientId} on ${date} to PAID...`);
    await prisma.$transaction([
      prisma.labOrder.updateMany({
        where: {
          patientId: patientId,
          status: LabOrderStatus.ASSIGNED,
          orderedAt: { gte: startOfDay, lt: endOfDay },
        },
        data: {
          status: LabOrderStatus.PAID,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.patient.update({
        where: { id: patientId },
        data: { visitStatus: VisitStatus.PAID_FOR_LAB },
      }),
    ]);

    console.log(`✅ [MarkAsPaid] Updated ${labOrders.length} lab orders for patient ${patientId} on ${date}`);
    return NextResponse.json({ message: `Marked ${labOrders.length} lab orders as paid` });
  } catch (error: any) {
    console.error('💥 [MarkAsPaid] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}