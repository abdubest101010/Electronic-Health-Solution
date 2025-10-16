import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const labOrders = await prisma.labOrder.findMany({
    where: { laboratoristId: session.user.id, status: 'ASSIGNED' },
    include: { 
      patient: { select: { name: true } }, 
      service: { select: { name: true } } 
    },
  });

  return NextResponse.json(labOrders);
}
