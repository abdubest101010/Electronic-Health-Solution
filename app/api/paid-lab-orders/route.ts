import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { VisitStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  console.log("✅ [LabOrders] Request received");

  const session = await auth();
  if (!session || session.user.role !== "LABORATORIST") {
    console.log(
      "❌ [LabOrders] Unauthorized access - Missing or invalid session:",
      session
    );
    return NextResponse.json(
      { error: "Unauthorized: Laboratorist only" },
      { status: 401 }
    );
  }
  console.log(
    "✅ [LabOrders] User authenticated:",
    session.user.name,
    session.user.id
  );

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("perPage") || "20");
  const skip = (page - 1) * perPage;

  try {
    console.log(
      `🔍 [LabOrders] Fetching paid lab orders for laboratorist ${session.user.id}, page ${page}...`
    );

    const patients = await prisma.patient.findMany({
      where: {
        labOrders: {
          some: {
            laboratoristId: session.user.id,
            status: "PAID", // Ensure this filter is correct
          },
        },
      },
      select: {
        id: true,
        name: true,
        visitStatus: true,
        doctor: {
          select: { id: true, name: true },
        },
        labOrders: {
          where: {
            laboratoristId: session.user.id,
            status: "PAID", // Double-check this condition
          },
          select: {
            id: true,
            service: { select: { name: true } },
            orderedBy: { select: { name: true } },
            laboratorist: { select: { name: true } },
            status: true,
            orderedAt: true,
            paidAt: true,
          },
          orderBy: { orderedAt: "desc" },
        },
        _count: {
          select: {
            labOrders: {
              where: {
                laboratoristId: session.user.id,
                status: "PAID",
              },
            },
          },
        },
      },
      take: perPage,
      skip,
    });

    console.log(
      "🔍 [LabOrders] Raw patients data:",
      JSON.stringify(patients, null, 2)
    ); // Debug raw data

    const total = await prisma.patient.count({
      where: {
        labOrders: {
          some: {
            laboratoristId: session.user.id,
            status: "PAID",
          },
        },
      },
    });

    const formatted = patients.map((patient) => ({
      patientId: patient.id,
      patientName: patient.name,
      doctorId: patient.doctor?.id || "",
      doctorName: patient.doctor?.name || "Not assigned",
      visitStatus: patient.visitStatus || null,
      labOrders: patient.labOrders.map((order) => ({
        labOrderId: order.id,
        serviceName: order.service.name,
        orderedByName: order.orderedBy.name,
        doctorId: patient.doctor?.id || "",
        doctorName: patient.doctor?.name || "Not assigned",
        laboratoristName: order.laboratorist?.name || "Not assigned",
        status: order.status,
        orderedAt: order.orderedAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || "",
      })),
    }));

    console.log(
      "🔍 [LabOrders] Formatted response:",
      JSON.stringify(formatted, null, 2)
    ); // Debug formatted data

    const sortedFormatted = formatted.sort((a, b) => {
      const aLatest = a.labOrders[0]?.orderedAt || "0";
      const bLatest = b.labOrders[0]?.orderedAt || "0";
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });

    console.log(
      "✅ [LabOrders] Fetched patients:",
      sortedFormatted.length,
      "Total:",
      total
    );
    return NextResponse.json({ data: sortedFormatted, total });
  } catch (error: any) {
    console.error("💥 [LabOrders] Unexpected error:", {
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
