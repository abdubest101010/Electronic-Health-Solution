// app/api/doctors/my-patients/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: session.user.id,
        visitStatus: {
          in: ['ASSIGNED_TO_DOCTOR', 'EXAMINED', 'LAB_ORDERED', 'LAB_COMPLETED'],
        },
      },
      include: {
        patient: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}