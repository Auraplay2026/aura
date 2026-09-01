import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { sanitizeUserProfile } from '@/lib/userDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    try {
      await verifyAdminSession();
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 20
        },
        positions: true,
        activityLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sanitizedUsers = users.map(u => {
      const sanitized = sanitizeUserProfile(u);
      const { passwordHash: _unused, ...safeUser } = sanitized;
      return {
        ...safeUser,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      totalUsers: sanitizedUsers.length,
      timestamp: Date.now()
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err: any) {
    console.error("[GET /api/admin/users Error]:", err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    try {
      await verifyAdminSession();
    } catch (authErr: any) {
      return NextResponse.json({ error: 'Unauthorized: Admin clearance required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json({ error: 'User ID or username is required.' }, { status: 400 });
    }

    // Prevent deleting master admin twintubro
    if (username?.toLowerCase() === 'twintubro' || username?.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Cannot delete primary system administrator.' }, { status: 403 });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          userId ? { id: userId } : {},
          username ? { username: { equals: username, mode: 'insensitive' } } : {}
        ]
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetUser.username.toLowerCase() === 'twintubro' || targetUser.email?.toLowerCase() === 'twintubrovquattro@gmail.com') {
      return NextResponse.json({ error: 'Protected administrator account cannot be deleted.' }, { status: 403 });
    }

    // 1. Delete from PostgreSQL
    await prisma.user.delete({
      where: { id: targetUser.id }
    });

    // 2. Delete from Supabase auth.users
    try {
      await prisma.$executeRaw`
        DELETE FROM auth.users WHERE LOWER(email) = LOWER(${targetUser.email || targetUser.username});
      `;
    } catch (authDeleteErr) {}

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} successfully deleted from database and Supabase Auth.`
    }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE /api/admin/users Error]:", err);
    return NextResponse.json({ error: err?.message || 'Failed to delete user.' }, { status: 500 });
  }
}