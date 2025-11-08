import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    if (!name && !image) {
      return NextResponse.json({ error: 'Name or image is required' }, { status: 400 });
    }

    const updateData: { name?: string; image?: string; updatedAt: Date } = { updatedAt: new Date() };
    if (name) {
      updateData.name = name;
    }
    if (image) {
      updateData.image = image;
    }

    await db.update(user).set(updateData).where(eq(user.id, session.user.id));

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}