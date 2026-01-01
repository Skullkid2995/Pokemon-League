'use server';

import { createClient } from '@/lib/supabase/server';
import { generateTemporaryPassword, PasswordOption } from '@/lib/utils/password';

/**
 * Creates a new user with authentication
 * This requires either:
 * 1. Service role key in SUPABASE_SERVICE_ROLE_KEY (recommended for production)
 * 2. Email signups enabled and email confirmation disabled in Supabase settings
 */
export async function createUserWithAuth(
  name: string,
  email: string,
  passwordOption: PasswordOption = 'random',
  role: 'super_admin' | 'player' = 'player',
  nickname?: string | null
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (admin creating the user)
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) {
      return { error: 'Unauthorized', success: false };
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword({
      option: passwordOption,
      name,
    });

    // Try to use service role if available, otherwise use signup
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (serviceRoleKey) {
      // Use service role for admin user creation (bypasses email confirmation)
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const adminClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
      });

      if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create auth user', success: false };
      }

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name,
          nickname: nickname || null,
          email,
          auth_user_id: authData.user.id,
          role,
          must_change_password: true,
        })
        .select()
        .single();

      if (userError) {
        return { error: userError.message, success: false };
      }

      return {
        success: true,
        user: userData,
        temporaryPassword: tempPassword,
      };
    } else {
      // Fallback: Use regular signup (requires email confirmation disabled)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
      });

      if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create auth user', success: false };
      }

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          name,
          nickname: nickname || null,
          email,
          auth_user_id: authData.user.id,
          role,
          must_change_password: true,
        })
        .select()
        .single();

      if (userError) {
        return { error: userError.message, success: false };
      }

      return {
        success: true,
        user: userData,
        temporaryPassword: tempPassword,
      };
    }
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { error: error.message || 'Failed to create user', success: false };
  }
}

