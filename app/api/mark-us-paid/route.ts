import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  console.log('✅ [MarkUsPaid] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [MarkUsPaid] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [MarkUsPaid] User authenticated:', session.user.name, session.user.id);

  const { labOrderId } = await req.json();

  if (!labOrderId || isNaN(parseInt(labOrderId))) {
    console.warn('❌ [MarkUsPaid] Invalid or missing labOrderId:', labOrderId);
    return NextResponse.json({ error: 'Valid labOrderId (number) is required' }, { status: 400 });
  }

  const parsedLabOrderId = parseInt(labOrderId);

  try {
    console.log(`🔍 [MarkUsPaid] Updating lab order ${parsedLabOrderId} to PAID...`);
    const labOrder = await prisma.labOrder.update({
      where: { id: parsedLabOrderId },
      data: {
        status: 'PAID',
        paidAt: new Date(), // Set paidAt to current timestamp
        updatedAt: new Date(),
      },
      include: { appointment: true },
    });

    console.log(`✅ [MarkUsPaid] Updated lab order ${parsedLabOrderId}:`, {
      status: labOrder.status,
      paidAt: labOrder.paidAt,
    });

    // Check if all lab orders for the appointment are paid
    const allLabOrders = await prisma.labOrder.findMany({
      where: { appointmentId: labOrder.appointmentId },
    });

    const allPaid = allLabOrders.every((lo) => lo.status === 'PAID');

    if (allPaid) {
      await prisma.patient.update({
        where: { id: labOrder.appointment.patientId },
        data: { visitStatus: 'PAID_FOR_LAB' },
      });
      console.log(`✅ [MarkUsPaid] Updated visitStatus to PAID_FOR_LAB for appointment ${labOrder.appointmentId}`);
    }

    console.log('✅ [MarkUsPaid] Lab order marked as paid:', parsedLabOrderId);
    return NextResponse.json({ message: 'Lab order marked as paid' });
  } catch (error: any) {
    console.error('💥 [MarkUsPaid] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}