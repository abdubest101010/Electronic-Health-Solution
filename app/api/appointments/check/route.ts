import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    console.log(
      "❌ [AppointmentsCheck] Unauthorized access - Missing or invalid session:",
      session
    );
    return NextResponse.json(
      { error: "Unauthorized: Doctor only" },
      { status: 401 }
    );
  }

  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId || typeof patientId !== "string") {
    console.warn(
      "❌ [AppointmentsCheck] Invalid or missing patientId:",
      patientId
    );
    return NextResponse.json(
      { error: "Valid patientId is required" },
      { status: 400 }
    );
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        patientId: patientId, // String ObjectID
        dateTime: { not: null },
      },
    });

    console.log(
      "✅ [AppointmentsCheck] Appointment check for patientId:",
      patientId,
      "hasAppointment:",
      !!appointment
    );
    return NextResponse.json({ hasAppointment: !!appointment });
  } catch (error: any) {
    console.error("💥 [AppointmentsCheck] Error checking appointment:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
