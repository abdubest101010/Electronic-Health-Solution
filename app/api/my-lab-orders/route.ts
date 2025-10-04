// app/api/my-lab-orders/route.ts (for laboratorist results)
import { NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function GET() {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const labOrders = await prisma.labOrder.findMany({
    where: { laboratoristId: session.user.id, status: 'ASSIGNED' },
    include: { 
      appointment: { include: { patient: { select: { name: true } } } }, 
      service: { select: { name: true } } 
    },
  });

  return NextResponse.json(labOrders);
}