import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !['LABORATORIST', 'DOCTOR'].includes(session.user.role)) {
    console.log('❌ [LabResults GET] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Laboratorist or Doctor only' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId || typeof patientId !== 'string') {
    console.warn('❌ [LabResults GET] Invalid or missing patientId:', patientId);
    return NextResponse.json({ error: 'Valid patientId (string) is required' }, { status: 400 });
  }

  try {
    const whereClause: any = {
      patientId: patientId,
      status: 'COMPLETED',
    };

    if (session.user.role === 'LABORATORIST') {
      whereClause.laboratoristId = session.user.id;
    }

    const results = await prisma.labOrder.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            name: true,
          },
        },
        laboratorist: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    console.log(
      `[LabResults GET] Fetched ${results.length} lab results for patientId ${patientId} by ${session.user.role} ${session.user.id}`
    );

    return NextResponse.json(
      results.map((r) => ({
        labOrderId: r.id,
        serviceName: r.service.name,
        result: r.result,
        laboratoristName: r.laboratorist?.name || 'Unknown',
        completedAt: r.completedAt,
      }))
    );
  } catch (error: any) {
    console.error('💥 [LabResults GET] Error fetching lab results:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}