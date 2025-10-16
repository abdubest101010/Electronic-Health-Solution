// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/auth';
// import prisma from '@/lib/prisma';

// export async function GET(req: NextRequest) {
//   const session = await auth();
//   if (!session || !['LABORATORIST', 'RECEPTIONIST'].includes(session.user.role)) {
//     console.log('Unauthorized access attempt:', { session });
//     return NextResponse.json({ error: 'Unauthorized: Laboratorist or Receptionist only' }, { status: 401 });
//   }
//   console.log('✅ [LabOrdersGET] User authenticated:', session.user.name, session.user.id, session.user.role);

//   try {
//     const labOrders = await prisma.labOrder.findMany({
//       where: { status: 'ORDERED' },
//       include: {
//         service: { select: { name: true } },
//         appointment: {
//           include: {
//             patient: { select: { id: true, name: true } },
//           },
//         },
//       },
//     });

//     const formatted = labOrders.map((order) => ({
//       labOrderId: order.id,
//       serviceName: order.service.name,
//       patientId: order.appointment.patient.id,
//       patientName: order.appointment.patient.name,
//       appointmentId: order.appointment.id,
//       orderedAt: order.orderedAt.toISOString(),
//       status: order.status,
//     }));

//     console.log('✅ [LabOrdersGET] Fetched lab orders:', formatted.length);
//     return NextResponse.json(formatted);
//   } catch (error: any) {
//     console.error('💥 [LabOrdersGET] Error fetching lab orders:', {
//       message: error.message,
//       stack: error.stack,
//       ...(error.code && { prismaCode: error.code }),
//       ...(error.meta && { prismaMeta: error.meta }),
//     });
//     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
//   }
// }
