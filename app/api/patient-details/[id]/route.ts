import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← Note: params is a Promise
) {
  const { id } = await params; // ✅ Await the params

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id, 10) }, // safely parse with radix
      include: { appointments: true },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}