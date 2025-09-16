import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ServiceType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // Validate that type is a valid ServiceType enum value
  const validType = type && Object.values(ServiceType).includes(type as ServiceType)
    ? type as ServiceType
    : undefined;

  try {
    const services = await prisma.service.findMany({
      where: validType ? { type: validType } : {}, // Omit filter if type is invalid or null
      select: { id: true, name: true },
    });
    console.log('✅ [Services] Fetched services:', services);
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('💥 [Services] Error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}