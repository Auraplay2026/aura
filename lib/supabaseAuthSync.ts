import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export interface SupabaseAuthUserData {
  id?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  username: string;
  mustChangePassword?: boolean;
}

/**
 * Synchronizes or creates a user in Supabase auth.users and auth.identities
 * so that they immediately appear in the Supabase Authentication Dashboard.
 */
export async function syncUserToSupabaseAuth(data: SupabaseAuthUserData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const email = data.email.trim().toLowerCase();
    const username = data.username.trim();
    const mustChangePassword = Boolean(data.mustChangePassword);

    let passwordHash = data.passwordHash;
    if (!passwordHash && data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (!passwordHash) {
      passwordHash = await bcrypt.hash("TempPass2026!", 10);
    }

    const metadata = JSON.stringify({
      username,
      must_change_password: mustChangePassword,
      created_by: "aura-admin",
      synced_at: new Date().toISOString()
    });

    // Check if user already exists in auth.users by email
    const existingRows: any[] = await prisma.$queryRaw`
      SELECT id FROM auth.users WHERE LOWER(email) = LOWER(${email}) LIMIT 1;
    `;

    let userId: string;

    if (existingRows.length > 0) {
      userId = existingRows[0].id;
      // Update existing auth.users record
      await prisma.$executeRaw`
        UPDATE auth.users
        SET 
          encrypted_password = ${passwordHash},
          raw_user_meta_data = ${metadata}::jsonb,
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          updated_at = NOW()
        WHERE id = ${userId}::uuid;
      `;
    } else {
      userId = data.id || crypto.randomUUID();
      // Insert into auth.users (Supabase Auth core table)
      await prisma.$executeRaw`
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          role,
          aud,
          created_at,
          updated_at
        ) VALUES (
          ${userId}::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          ${email},
          ${passwordHash},
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          ${metadata}::jsonb,
          'authenticated',
          'authenticated',
          NOW(),
          NOW()
        );
      `;

      // Insert identity into auth.identities for complete dashboard compatibility
      await prisma.$executeRaw`
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          ${userId}::uuid,
          ${userId}::uuid,
          json_build_object('sub', ${userId}::text, 'email', ${email}),
          'email',
          ${email},
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (provider, provider_id) DO NOTHING;
      `;
    }

    return { success: true, id: userId };
  } catch (err: any) {
    console.error("[Supabase Auth Sync Error]:", err.message);
    return { success: false, error: err.message };
  }
}