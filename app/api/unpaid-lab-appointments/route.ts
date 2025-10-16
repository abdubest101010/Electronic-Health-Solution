import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('Unauthorized access attempt:', { session });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patients = await prisma.patient.findMany({
      where: { visitStatus: 'LAB_ORDERED' },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching unpaid lab patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
