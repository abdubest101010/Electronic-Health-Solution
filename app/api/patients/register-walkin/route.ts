import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VisitStatus } from '@prisma/client';

interface VitalsJson {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

type RegisterWalkinBody = {
  patient: {
    name: string;
    gender?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  vitals?: VitalsJson | null;
};

export async function POST(req: NextRequest) {
  try {
    let body: RegisterWalkinBody;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    const { patient, vitals } = body;

    if (!patient || !patient.name) {
      return NextResponse.json({ error: 'Patient name is required' }, { status: 400 });
    }

    const existingPatient = await prisma.patient.findFirst({
      where: { name: patient.name },
    });

    if (existingPatient) {
      return NextResponse.json({ error: 'A patient with this name already exists' }, { status: 400 });
    }

    const newPatient = await prisma.patient.create({
      data: {
        name: patient.name,
        gender: patient.gender || null,
        phone: patient.phone || null,
        address: patient.address || null,
        vitals: vitals
          ? {
              weight: vitals.weight || null,
              bpSystolic: vitals.bpSystolic || null,
              bpDiastolic: vitals.bpDiastolic || null,
              measuredAt: vitals.measuredAt || new Date().toISOString(),
            }
          : null,
        visitStatus: vitals ? VisitStatus.VITALS_TAKEN : VisitStatus.REGISTERED,
      },
    });

    return NextResponse.json(
      {
        message: 'Walk-in patient registered successfully',
        patient: newPatient,
        visitStatus: newPatient.visitStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in /api/patients/register-walkin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
