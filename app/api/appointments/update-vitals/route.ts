import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "RECEPTIONIST") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, weight, bpSystolic, bpDiastolic } = await req.json();

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

    const updatedPatient = await prisma.patient.update({
      where: { id: appointment.patientId },
      data: {
        vitals: {
          weight,
          bpSystolic,
          bpDiastolic,
          measuredById: session.user.id,
          measuredAt: new Date(),
        },
        visitStatus: "VITALS_TAKEN",
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Vitals update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
