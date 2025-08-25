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

  const { appointmentId, serviceIds, laboratoristId } = await req.json();

  // ✅ Validate inputs
  if (!appointmentId) {
    return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
  }

  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    return NextResponse.json({ error: 'At least one lab service ID is required' }, { status: 400 });
  }

  if (!laboratoristId) {
    return NextResponse.json({ error: 'Laboratorist ID is required' }, { status: 400 });
  }

  try {
    // Verify appointment exists and belongs to doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Appointment not found or unauthorized' }, { status: 404 });
    }

    // Verify laboratorist
    const laboratorist = await prisma.user.findUnique({
      where: { id: laboratoristId },
    });

    if (!laboratorist || laboratorist.role !== 'LABORATORIST') {
      return NextResponse.json({ error: 'Invalid or unauthorized laboratorist' }, { status: 400 });
    }

    // ✅ Create new lab orders
    await prisma.$transaction(
      serviceIds.map((serviceId: number) =>
        prisma.labOrder.create({
          data: {
            appointmentId,
            serviceId,
            orderedById: session.user.id,
            laboratoristId,
            status: LabOrderStatus.ASSIGNED,
          },
        })
      )
    );

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { visitStatus: 'ASSIGNED_TO_LAB' },
    });

    return NextResponse.json({
      success: true,
      message: `Assigned ${serviceIds.length} lab test(s) to ${laboratorist.name}`,
    });
  } catch (error) {
    console.error('Lab assignment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}