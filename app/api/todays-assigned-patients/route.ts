// app/api/todays-assigned-patients/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export const GET = async () => {
  const session = await auth();
  if (!session || session.user.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        visitStatus: 'ASSIGNED_TO_DOCTOR',
        doctorId: session.user.id, // ✅ Only patients assigned to this doctor
        createdAt: {
          gte: today,
          lt: tomorrow, // Use `lt` instead of `lte` for clarity
        },
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = appointments.map((apt) => {
      const vitals = apt.vitals as { weight?: number; bpSystolic?: number; bpDiastolic?: number } | null;

      return {
        id: apt.id,
        patient: {
          name: apt.patient.name,
        },
        vitals: {
          weight: vitals?.weight ?? null,
          bpSystolic: vitals?.bpSystolic ?? null,
          bpDiastolic: vitals?.bpDiastolic ?? null,
        },
        visitStatus: apt.visitStatus,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching assigned patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};