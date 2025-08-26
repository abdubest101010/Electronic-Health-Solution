// app/api/lab-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const appointmentId = searchParams.get('appointmentId');

  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
  }

  try {
    const results = await prisma.labOrder.findMany({
      where: {
        appointmentId: parseInt(appointmentId),
        status: 'COMPLETED', // Only completed tests
      },
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

    return NextResponse.json(
      results.map((r) => ({
        labOrderId: r.id,
        serviceName: r.service.name,
        result: r.result,
        laboratoristName: r.laboratorist?.name || 'Unknown',
        completedAt: r.completedAt,
      }))
    );
  } catch (error) {
    console.error('Fetch lab results error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}