// app/api/pending-examinations/route.ts (for doctor examine)
import { NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function GET() {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session.user.id, visitStatus: 'ASSIGNED_TO_DOCTOR' },
    include: { patient: { select: { name: true } } },
  });

  return NextResponse.json(appointments);
}