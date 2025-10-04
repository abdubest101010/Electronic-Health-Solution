// app/api/laboratorists/route.ts
import { NextResponse } from 'next/server';
import {auth} from '@/auth'; // use the new helper from your auth.ts
import prisma from '@/lib/prisma';

export async function GET() {
const session = await auth(); // instead of getServerSession(authOptions)
    if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const laboratorists = await prisma.user.findMany({
    where: { role: 'LABORATORIST' },
    select: { id: true, name: true },
  });

  return NextResponse.json(laboratorists);
}