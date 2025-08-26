// app/api/patients/medical-history/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (isNaN(patientId)) {
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { history: true },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ history: patient.history || '' });
  } catch (error) {
    console.error('Fetch medical history error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (isNaN(patientId)) {
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  const { history } = await req.json();

  if (typeof history !== 'string') {
    return NextResponse.json({ error: 'History must be a string' }, { status: 400 });
  }

  try {
    const updatedPatient = await prisma.patient.update({
       
        where: { id: patientId },
        data: { history},
    });

    return NextResponse.json({
      success: true,
      message: 'Medical history updated successfully',
      history: updatedPatient.history,
    });
  } catch (error) {
    console.error('Update medical history error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}