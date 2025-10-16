import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("✅ [CreateAppointment] Request received");

  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    console.log(
      "❌ [CreateAppointment] Unauthorized access - Missing or invalid session:",
      session
    );
    return NextResponse.json(
      { error: "Unauthorized: Doctor only" },
      { status: 401 }
    );
  }
  console.log(
    "✅ [CreateAppointment] User authenticated:",
    session.user.name,
    session.user.id
  );

  let data;
  try {
    data = await req.json();
    console.log("📥 [CreateAppointment] Parsed JSON payload:", data);
  } catch (err) {
    console.error("❌ [CreateAppointment] Failed to parse JSON:", err);
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { patientId, dateTime } = data;

  if (!patientId || typeof patientId !== "string") {
    console.warn(
      "❌ [CreateAppointment] Invalid or missing patientId:",
      patientId
    );
    return NextResponse.json(
      { error: "Valid patientId (string) is required" },
      { status: 400 }
    );
  }

  if (!dateTime || isNaN(Date.parse(dateTime))) {
    console.warn(
      "❌ [CreateAppointment] Invalid or missing dateTime:",
      dateTime
    );
    return NextResponse.json(
      { error: "Valid dateTime is required" },
      { status: 400 }
    );
  }

  try {
    console.log(
      "🔍 [CreateAppointment] Creating appointment and updating patient..."
    );
    const appointment = await prisma.$transaction([
      prisma.appointment.create({
        data: {
          patientId: patientId, // String ObjectID
          doctorId: session.user.id,
          dateTime: new Date(dateTime),
          status: "SCHEDULED",
        },
      }),
      prisma.patient.update({
        where: { id: patientId },
        data: { visitStatus: "REGISTERED" },
      }),
    ]);

    console.log(
      "✅ [CreateAppointment] Appointment created:",
      appointment[0].id
    );
    return NextResponse.json(appointment[0]);
  } catch (error: any) {
    console.error("💥 [CreateAppointment] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
