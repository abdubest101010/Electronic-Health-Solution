// app/api/lab-orders/result/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth'; // use the new helper from your auth.ts

export async function POST(req: NextRequest) {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'LABORATORIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { labOrderId, result } = await req.json();

  try {
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { result, completedAt: new Date(), status: 'COMPLETED' },
    });

    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: { appointment: { include: { labOrders: true } } },
    });

    if (labOrder) {
      const allCompleted = labOrder.appointment.labOrders.every(o => o.status === 'COMPLETED');
      if (allCompleted) {
        await prisma.appointment.update({
          where: { id: labOrder.appointmentId },
          data: { visitStatus: 'LAB_COMPLETED' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}