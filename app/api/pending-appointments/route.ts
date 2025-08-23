// app/api/pending-appointments/route.ts (for assign doctor)
import { NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function GET() {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { visitStatus: 'VITALS_TAKEN', doctorId: null },
    include: { patient: { select: { name: true } } },
  });

  return NextResponse.json(appointments);
}