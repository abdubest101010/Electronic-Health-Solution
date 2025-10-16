import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import type { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    console.log('Unauthorized access attempt:', { session });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  try {
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as Role } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
