// app/api/lab-orders/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const labOrders = await prisma.labOrder.findMany({
    where: { status: 'ORDERED' },
    include: {
      service: true,
      appointment: { include: { patient: true } }
    }
  })
  return NextResponse.json(labOrders)
}