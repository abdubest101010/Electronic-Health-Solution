import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  console.log('✅ [PatientLabOrders] Request received');

  const session = await auth();
  if (!session || session.user.role !== 'RECEPTIONIST') {
    console.log('❌ [PatientLabOrders] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Receptionist only' }, { status: 401 });
  }
  console.log('✅ [PatientLabOrders] User authenticated:', session.user.name, session.user.id);

  try {
    console.log('🔍 [PatientLabOrders] Fetching lab orders for today...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today (Africa/Nairobi)
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of tomorrow

    const patients = await prisma.patient.findMany({
      include: {
        doctor: {
          select: {
            name: true,
            role: true,
          },
        },
        appointments: {
          include: {
            labOrders: {
              where: {
                orderedBy: {
                  role: 'DOCTOR',
                },
                orderedAt: {
                  gte: today,
                  lt: tomorrow,
                },
              },
              include: {
                service: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
                laboratorist: {
                  select: {
                    name: true,
                  },
                },
                orderedBy: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Filter patients with lab orders and format response
    const result = patients
      .filter((patient) => patient.appointments.some((apt) => apt.labOrders.length > 0))
      .map((patient) => ({
        patientId: patient.id,
        patientName: patient.name,
        doctorName: patient.doctor?.name || 'Not assigned',
        visitStatus: patient.visitStatus || 'REGISTERED',
        appointments: patient.appointments
          .filter((apt) => apt.labOrders.length > 0)
          .map((apt) => ({
            appointmentId: apt.id,
            labTests: apt.labOrders.map((lo) => ({
              labOrderId: lo.id,
              serviceName: lo.service.name,
              orderedById: lo.orderedById,
              orderedByName: lo.orderedBy.name,
              laboratoristName: lo.laboratorist?.name || 'Not assigned',
              status: lo.status,
              orderedAt: lo.orderedAt.toISOString(),
            })),
            assignedAt: apt.createdAt.toISOString(),
          })),
      }));

    console.log('✅ [PatientLabOrders] Formatted response:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('💥 [PatientLabOrders] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}