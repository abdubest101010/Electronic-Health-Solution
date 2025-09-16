// app/api/lab-orders/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {auth} from '@/auth'; // use the new helper from your auth.ts

export async function POST(req: NextRequest) {
    const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appointmentId } = await req.json();

  try {
    await prisma.labOrder.updateMany({
      where: { appointmentId, status: 'ORDERED' },
      data: { status: 'PAID', paidAt: new Date() },
    });

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { visitStatus: 'PAID_FOR_LAB' },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}