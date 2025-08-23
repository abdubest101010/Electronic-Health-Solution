// app/api/pending-lab-orders/route.ts (for assign laboratorist)
import { NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function GET() {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const labOrders = await prisma.labOrder.findMany({
    where: { status: 'PAID', laboratoristId: null },
    include: { 
      appointment: { include: { patient: { select: { name: true } } } }, 
      service: { select: { name: true } } 
    },
  });

  return NextResponse.json(labOrders);
}