import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { VisitStatus } from "@prisma/client";
import { startOfDay, subHours } from "date-fns";

interface PrescriptionJson {
  appointmentId?: string | null;
  medicines?: string | null;
  recommendations?: string | null;
  createdAt?: string | null;
  [key: string]: any; // Index signature for InputJsonValue
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    console.log(
      "❌ [Prescribe] Unauthorized access - Missing or invalid session:",
      session
    );
    return NextResponse.json(
      { error: "Unauthorized: Doctor only" },
      { status: 401 }
    );
  }

  let data;
  try {
    data = await req.json();
    console.log("📥 [Prescribe] Parsed JSON payload:", data);
  } catch (err) {
    console.error("❌ [Prescribe] Failed to parse JSON:", err);
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { patientId, medicines, recommendations, appointmentId } = data;

  if (!patientId || typeof patientId !== "string") {
    console.warn("❌ [Prescribe] Invalid or missing patientId:", patientId);
    return NextResponse.json(
      { error: "Valid patientId (string) is required" },
      { status: 400 }
    );
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.warn("❌ [Prescribe] Patient not found:", patientId);
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          patientId,
          doctorId: session.user.id,
          dateTime: { gte: subHours(startOfDay(new Date()), 3) },
        },
      });

      if (!appointment) {
        console.warn("❌ [Prescribe] Invalid appointmentId:", appointmentId);
        return NextResponse.json(
          { error: "Valid appointmentId is required" },
          { status: 400 }
        );
      }
    }

    const newPrescription: PrescriptionJson = {
      appointmentId: appointmentId || null,
      medicines: medicines?.trim() || null,
      recommendations: recommendations?.trim() || null,
      createdAt: new Date().toISOString(),
    };

    if (!newPrescription.medicines && !newPrescription.recommendations) {
      console.warn(
        "❌ [Prescribe] No valid medicines or recommendations provided"
      );
      return NextResponse.json(
        { error: "At least one of medicines or recommendations is required" },
        { status: 400 }
      );
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        prescription: newPrescription,
        visitStatus: VisitStatus.FINALIZED,
      },
    });

    console.log("✅ [Prescribe] Prescription set for patientId:", patientId);
    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error("💥 [Prescribe] Error saving prescription:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
