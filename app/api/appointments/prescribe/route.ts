import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { VisitStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, medicines, recommendations } = await req.json();

  if (!appointmentId || typeof appointmentId !== "string") {
    return NextResponse.json({ error: "Appointment ID (string) is required" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Ensure doctor owns this appointment
    if (appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not assigned to this patient" }, { status: 403 });
    }

    // Check if visitStatus is valid for prescription
    const validStatuses: VisitStatus[] = [VisitStatus.EXAMINED, VisitStatus.LAB_COMPLETED];
    if (!appointment.patient.visitStatus || !validStatuses.includes(appointment.patient.visitStatus)) {
      return NextResponse.json({ error: "Invalid visit status for prescription" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "COMPLETED",
        },
      }),
      prisma.patient.update({
        where: { id: appointment.patientId },
        data: {
          prescription: {
            appointmentId,
            medicines,
            recommendations,
            createdAt: new Date(),
          },
          visitStatus: "FINALIZED",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Prescription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}