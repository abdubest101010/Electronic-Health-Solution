import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { name, middleName, lastName, phone, address, gender, age } = await req.json();

  // Validate required fields
  if (!name || !middleName || !lastName || !phone || !gender || age === undefined) {
    return Response.json({ error: 'All name fields, phone, gender, and age are required.' }, { status: 400 });
  }

  // Validate phone
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!/^\d{10,15}$/.test(cleanPhone)) {
    return Response.json({ error: 'Invalid phone number format.' }, { status: 400 });
  }

  // Validate age
  const numAge = Number(age);
  if (isNaN(numAge) || numAge < 0 || numAge > 120) {
    return Response.json({ error: 'Age must be between 0 and 120.' }, { status: 400 });
  }

  try {
    // 🔒 Enforce uniqueness on (name + middleName + lastName)
    const existing = await prisma.patient.findFirst({
      where: {
        name: name.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
      },
    });

    if (existing) {
      return Response.json(
        { error: 'A patient with this exact first, middle, and last name already exists.' },
        { status: 409 }
      );
    }

    // Create new patient
    const patient = await prisma.patient.create({
      data: {
        name: name.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        address: address?.trim() || null,
        gender,
        age: numAge,
      },
    });

    return Response.json({ patient }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Failed to register patient. Please try again.' }, { status: 500 });
  }
}