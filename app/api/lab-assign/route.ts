import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { LabOrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  console.log("✅ [LabAssign] Request received");

  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    console.log(
      "❌ [LabAssign] Unauthorized access - Missing or invalid session:",
      session
    );
    return NextResponse.json(
      { error: "Unauthorized: Doctor only" },
      { status: 401 }
    );
  }
  console.log(
    "✅ [LabAssign] User authenticated:",
    session.user.name,
    session.user.id
  );

  let data;
  try {
    data = await req.json();
    console.log("📥 [LabAssign] Parsed JSON payload:", data);
  } catch (err) {
    console.error("❌ [LabAssign] Failed to parse JSON:", err);
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { patientId, serviceIds, laboratoristId } = data;

  if (!patientId || typeof patientId !== "string") {
    console.warn("❌ [LabAssign] Invalid or missing patientId:", patientId);
    return NextResponse.json(
      { error: "Valid patientId (string) is required" },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(serviceIds) ||
    serviceIds.length === 0 ||
    !serviceIds.every((id) => typeof id === "string")
  ) {
    console.warn("❌ [LabAssign] Invalid or missing serviceIds:", serviceIds);
    return NextResponse.json(
      { error: "At least one valid lab service ID (string) is required" },
      { status: 400 }
    );
  }

  if (!laboratoristId || typeof laboratoristId !== "string") {
    console.warn(
      "❌ [LabAssign] Invalid or missing laboratoristId:",
      laboratoristId
    );
    return NextResponse.json(
      { error: "Valid laboratoristId (string) is required" },
      { status: 400 }
    );
  }

  try {
    console.log("🔍 [LabAssign] Verifying patient and laboratorist...");
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      console.warn("❌ [LabAssign] Patient not found:", patientId);
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const laboratorist = await prisma.user.findUnique({
      where: { id: laboratoristId },
    });

    if (!laboratorist || laboratorist.role !== "LABORATORIST") {
      console.warn(
        "❌ [LabAssign] Invalid or unauthorized laboratorist:",
        laboratoristId
      );
      return NextResponse.json(
        { error: "Invalid or unauthorized laboratorist" },
        { status: 400 }
      );
    }

    console.log(
      "🔄 [LabAssign] Creating lab orders and updating patient status..."
    );
    await prisma.$transaction([
      ...serviceIds.map((serviceId: string) =>
        prisma.labOrder.create({
          data: {
            patientId: patientId,
            serviceId,
            orderedById: session.user.id,
            laboratoristId,
            status: LabOrderStatus.ASSIGNED,
          },
        })
      ),
      prisma.patient.update({
        where: { id: patientId },
        data: { visitStatus: "ASSIGNED_TO_LAB" },
      }),
    ]);

    console.log(
      "✅ [LabAssign] Assigned",
      serviceIds.length,
      "lab test(s) to",
      laboratorist.name
    );
    return NextResponse.json({
      success: true,
      message: `Assigned ${serviceIds.length} lab test(s) to ${laboratorist.name}`,
    });
  } catch (error: any) {
    console.error("💥 [LabAssign] Unexpected error:", {
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
