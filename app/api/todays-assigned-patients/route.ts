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
        doctorId: session.user.id,
        visitStatus: {
          in: [
            'ASSIGNED_TO_DOCTOR',
            'LAB_ORDERED',
            'ASSIGNED_TO_LAB',
            'PAID_FOR_LAB',
            'LAB_COMPLETED',
            'EXAMINED',
          ],
        },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            history: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ✅ Map with proper typing
    const result = appointments.map((apt) => {
      // ✅ Safely parse vitals (it's Json? so could be object or null)
      const vitals = apt.vitals as { weight?: number; bpSystolic?: number; bpDiastolic?: number } | null;

      return {
        id: apt.id,
        patient: {
          id: apt.patient.id,           // ✅ Pass id
          name: apt.patient.name,
          history: apt.patient.history,        },
        vitals: {
          weight: vitals?.weight ?? null,
          bpSystolic: vitals?.bpSystolic ?? null,
          bpDiastolic: vitals?.bpDiastolic ?? null,
        },
        visitStatus: apt.visitStatus,
        // ✅ Pass examination field (it's a Json? field)
        examination: apt.examination,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching assigned patients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};