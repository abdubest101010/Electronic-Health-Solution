import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('Unauthorized access attempt:', { session }); // Debug log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const { name, phone, address, gender, age } = data;

  // Validate input
  if (!name || !phone || !gender || age === undefined) {
    console.log('Invalid input:', { name, phone, address, gender, age }); // Debug log
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!/^\d{10,15}$/.test(phone.replace(/[^0-9]/g, ''))) {
    console.log('Invalid phone number:', phone); // Debug log
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  if (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120) {
    console.log('Invalid age:', age); // Debug log
    return NextResponse.json({ error: 'Invalid age (must be 0-120)' }, { status: 400 });
  }

  try {
    // Find or create patient
    let patient = await prisma.patient.findFirst({ where: { phone } });
    if (patient) {
      // Update existing patient
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: { name, gender, phone, address, age: Number(age), updatedAt: new Date() },
      });
      console.log('Updated patient:', patient); // Debug log
    } else {
      // Create new patient
      patient = await prisma.patient.create({
        data: { name, gender, phone, address, age: Number(age), createdAt: new Date() },
      });
      console.log('Created patient:', patient); // Debug log
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error registering patient:', error); // Debug log
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
