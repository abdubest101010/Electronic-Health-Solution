import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  console.log('✅ [PatientsGET] Request received');

  const session = await auth();
  if (!session || !['DOCTOR', 'RECEPTIONIST'].includes(session.user.role)) {
    console.log('❌ [PatientsGET] Unauthorized access - Missing or invalid session:', session);
    return NextResponse.json({ error: 'Unauthorized: Doctor or Receptionist only' }, { status: 401 });
  }
  console.log('✅ [PatientsGET] User authenticated:', session.user.name, session.user.id, session.user.role);

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('search')?.trim().toLowerCase() || '';

  try {
    console.log('🔍 [PatientsGET] Fetching patients with search term:', searchTerm);
    const patients = await prisma.patient.findMany({
      where: searchTerm
        ? {
            name: {
              contains: searchTerm.toLowerCase(), // Convert search term to lowercase
            },
          }
        : {},
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('✅ [PatientsGET] Fetched patients:', patients.length);
    return NextResponse.json(patients);
  } catch (error: any) {
    console.error('💥 [PatientsGET] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      ...(error.code && { prismaCode: error.code }),
      ...(error.meta && { prismaMeta: error.meta }),
    });
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}