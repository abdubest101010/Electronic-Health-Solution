import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  console.log('✅ [SubmitLabResult] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    console.log('❌ [SubmitLabResult] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist only' }, { status: 401 });
  }
  console.log('✅ [SubmitLabResult] User authenticated:', session.user.name, session.user.id);

  const { labOrderId, result } = await req.json();

  if (!labOrderId || !result || typeof result !== 'string' || result.trim().length === 0 || result.length > 1000) {
    console.warn('❌ [SubmitLabResult] Invalid input:', { labOrderId, result });
    return NextResponse.json(
      { error: 'Valid labOrderId and result (non-empty string, max 1000 chars) are required' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 [SubmitLabResult] Submitting result for lab order ${labOrderId}...`);
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: {
        patient: {
          include: {
            labOrders: true,
          },
        },
      },
    });

    if (!labOrder) {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} not found`);
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    if (labOrder.laboratoristId !== session.user.id) {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} not assigned to user ${session.user.id}`);
      return NextResponse.json({ error: 'Forbidden: Not assigned to you' }, { status: 403 });
    }

    if (labOrder.status !== 'PAID') {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} status is ${labOrder.status}, expected PAID`);
      return NextResponse.json({ error: 'Only paid tests can be processed' }, { status: 400 });
    }

    // Update lab order
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        result: result.trim(),
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update patient visitStatus if all lab orders for the appointment are completed
    const allLabOrders = await prisma.labOrder.findMany({
      where: { patientId: labOrder.patientId },
    });

    const allCompleted = allLabOrders.every((lo) => lo.status === 'COMPLETED');

    if (allCompleted) {
      await prisma.patient.update({
        where: { id: labOrder.patientId },
        data: { visitStatus: 'LAB_COMPLETED' },
      });
      // console.log(`✅ [SubmitLabResult] Updated visitStatus to LAB_COMPLETED for appointment ${labOrder.[]}`);
    }

    console.log('✅ [SubmitLabResult] Lab result submitted:', labOrderId);
    return NextResponse.json({
      success: true,
      message: 'Lab result submitted successfully',
    });
  } catch (error: any) {
    console.error('💥 [SubmitLabResult] Unexpected error:', {
      message: error.message,
      stack: error.message,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}