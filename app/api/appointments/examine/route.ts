import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { VisitStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, complaints, diagnosis, visitDetails } = await req.json();

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

    if (appointment.doctorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update examination and visitStatus in Patient model
    await prisma.patient.update({
      where: { id: appointment.patientId },
      data: {
        examination: {
          appointmentId,
          complaints,
          diagnosis,
          visitStatus: VisitStatus.EXAMINED,
          createdAt: new Date(),
        },
        visitStatus: VisitStatus.EXAMINED,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Examination saved successfully",
    });
  } catch (error) {
    console.error("Examination error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
