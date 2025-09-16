// app/api/lab-orders/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {auth} from '@/auth'; // use the new helper from your auth.ts

export async function POST(req: NextRequest) {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || !['RECEPTIONIST', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId, laboratoristId } = await req.json();

  try {
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { laboratoristId, status: 'ASSIGNED' },
    });

    const labOrder = await prisma.labOrder.findFirst({
      where: { id: labOrderId },
      select: { appointmentId: true },
    });

    if (labOrder) {
      await prisma.appointment.update({
        where: { id: labOrder.appointmentId },
        data: { visitStatus: 'ASSIGNED_TO_LAB' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}