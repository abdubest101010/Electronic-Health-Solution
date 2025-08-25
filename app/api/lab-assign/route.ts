// app/api/lab-assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { LabOrderStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderIds, laboratoristId } = await req.json();

  if (!labOrderIds || !Array.isArray(labOrderIds) || labOrderIds.length === 0) {
    return NextResponse.json({ error: 'At least one lab order ID is required' }, { status: 400 });
  }

  if (!laboratoristId) {
    return NextResponse.json({ error: 'Laboratorist ID is required' }, { status: 400 });
  }

  try {
    // Verify laboratorist exists and is a LABORATORIST
    const laboratorist = await prisma.user.findUnique({
      where: { id: laboratoristId },
    });

    if (!laboratorist || laboratorist.role !== 'LABORATORIST') {
      return NextResponse.json({ error: 'Invalid or unauthorized laboratorist' }, { status: 400 });
    }

    // Get lab orders and verify they are ORDERED and belong to doctor's patients
    const labOrders = await prisma.labOrder.findMany({
      where: {
        id: { in: labOrderIds },
        status: 'ORDERED',
        appointment: {
          doctorId: session.user.id,
        },
      },
      include: { appointment: true },
    });

    if (labOrders.length === 0) {
      return NextResponse.json({ error: 'No valid lab orders found' }, { status: 404 });
    }

    // Assign all valid lab orders
    await prisma.$transaction(
      labOrders.map((order) =>
        prisma.labOrder.update({
          where: { id: order.id },
          data: {
            laboratoristId,
            status: LabOrderStatus.ASSIGNED,
          },
        })
      )
    );

    // Update appointments to reflect new visit status
    const appointmentIds = [...new Set(labOrders.map((o) => o.appointmentId))];
    await prisma.$transaction(
      appointmentIds.map((id) =>
        prisma.appointment.update({
          where: { id },
          data: { visitStatus: 'ASSIGNED_TO_LAB' },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Assigned ${labOrders.length} lab test(s) to ${laboratorist.name}`,
    });
  } catch (error) {
    console.error('Lab assignment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}