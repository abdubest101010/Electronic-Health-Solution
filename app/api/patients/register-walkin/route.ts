// app/api/patients/register-walkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Types for request body
type Vitals = {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredAt?: string;
};

type RegisterWalkinBody = {
  patient: {
    name: string;
    gender?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  vitals?: Vitals | null;
};

export async function POST(req: NextRequest) {
  try {
    // Parse JSON safely
    let body: RegisterWalkinBody;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    const { patient, vitals } = body;

    // Validate required fields
    if (!patient || !patient.name) {
      return NextResponse.json(
        { error: 'Patient name is required' },
        { status: 400 }
      );
    }

    // Check for existing patient by name
    const existingPatient = await prisma.patient.findUnique({
      where: { name: patient.name },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'A patient with this name already exists' },
        { status: 400 }
      );
    }

    // Create new patient
    const newPatient = await prisma.patient.create({
      data: {
        name: patient.name,
        gender: patient.gender || null,
        phone: patient.phone || null,
        address: patient.address || null,
      },
    });

    // Prepare vitals object for JSON field
    const vitalsData = vitals
      ? {
          weight: vitals.weight || null,
          bpSystolic: vitals.bpSystolic || null,
          bpDiastolic: vitals.bpDiastolic || null,
          measuredAt: vitals.measuredAt || new Date().toISOString(),
        }
      : undefined;

    // Create appointment for walk-in
    // Note: `dateTime` must be `null` or a date — ensure it's optional in your Prisma schema: `dateTime DateTime?`
    const appointment = await prisma.appointment.create({
      data: {
        patientId: newPatient.id,
        dateTime: null, // No scheduled time for walk-in
        visitStatus: 'REGISTERED', // Must be one of the `VisitStatus` enum values
        vitals: vitalsData, // Use `undefined` to skip, never `null`
      },
    });

    // Return success response
    return NextResponse.json(
      {
        message: 'Walk-in patient registered successfully',
        patient: newPatient,
        appointmentId: appointment.id,
        visitStatus: appointment.visitStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in /api/patients/register-walkin:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}