import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LabOrderStatus, VisitStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  console.log('✅ [SubmitLabResult] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    console.log('❌ [SubmitLabResult] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist only' }, { status: 401 });
  }
  console.log('✅ [SubmitLabResult] User authenticated:', session.user.name, session.user.id);

  const { labOrderId, result } = await req.json();

  if (!labOrderId || typeof labOrderId !== 'string' || !result || typeof result !== 'string' || result.trim().length === 0 || result.length > 1000) {
    console.warn('❌ [SubmitLabResult] Invalid input:', { labOrderId, result });
    return NextResponse.json(
      { error: 'Valid labOrderId (string) and result (non-empty string, max 1000 chars) are required' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 [SubmitLabResult] Submitting result for lab order ${labOrderId}...`);
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    });

    if (!labOrder) {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} not found`);
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });
    }

    if (labOrder.laboratoristId !== session.user.id) {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} not assigned to user ${session.user.id}`);
      return NextResponse.json({ error: 'Forbidden: Not assigned to you' }, { status: 403 });
    }

    if (labOrder.status !== LabOrderStatus.PAID) {
      console.warn(`❌ [SubmitLabResult] Lab order ${labOrderId} status is ${labOrder.status}, expected PAID`);
      return NextResponse.json({ error: 'Only paid tests can be processed' }, { status: 400 });
    }

    // Determine new visitStatus outside the update data
    const pendingLabOrders = await prisma.labOrder.findMany({
      where: { patientId: labOrder.patientId, status: { not: LabOrderStatus.COMPLETED } },
    });
    const newVisitStatus = pendingLabOrders.length === 0 ? VisitStatus.LAB_COMPLETED : undefined;

    await prisma.$transaction([
      prisma.labOrder.update({
        where: { id: labOrderId },
        data: {
          result: result.trim(),
          status: LabOrderStatus.COMPLETED,
          completedAt: new Date(),
        },
      }),
      prisma.patient.update({
        where: { id: labOrder.patientId },
        data: {
          visitStatus: newVisitStatus, // Pass the determined value directly
        },
      }),
    ]);

    console.log('✅ [SubmitLabResult] Lab result submitted:', labOrderId);
    return NextResponse.json({
      success: true,
      message: 'Lab result submitted successfully',
    });
  } catch (error: any) {
    console.error('💥 [SubmitLabResult] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}