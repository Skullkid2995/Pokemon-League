/**
 * One-time script to create the first super admin user
 * Run with: npx tsx scripts/create-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import { generateTemporaryPassword } from '../lib/utils/password';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

async function createAdminUser() {
  const email = 'skullkid2995@gmail.com';
  const name = 'Jesus Contreras Maldonado';
  const role = 'super_admin';

  // Generate a random secure password
  const tempPassword = generateTemporaryPassword({ option: 'random', length: 16 });

  console.log('\n=== Creating Super Admin User ===\n');
  console.log(`Email: ${email}`);
  console.log(`Name: ${name}`);
  console.log(`Role: ${role}`);
  console.log(`\nGenerating temporary password...\n`);

  // Create Supabase admin client
  // TypeScript: We've already validated these are not undefined above
  const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Create auth user directly (will error if already exists)
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      // If user already exists, try to find them and create users table record
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        console.log('⚠️  User with this email already exists in Auth!');
        console.log('Attempting to find user and create users table record...\n');
        
        // List users to find the existing one (we'll use a query to the users table to check)
        // Actually, let's just try to create the users record - if auth user exists, we need to get the ID
        // For now, let's instruct user to check Supabase dashboard
        console.log('\n⚠️  User already exists in Supabase Auth.');
        console.log('Please check Supabase Dashboard → Authentication → Users');
        console.log('If you need to create the users table record, you can:');
        console.log('1. Find the user in Supabase Dashboard → Authentication → Users');
        console.log('2. Copy the User ID (UUID)');
        console.log('3. Run this SQL in SQL Editor:');
        console.log(`   INSERT INTO users (name, email, auth_user_id, role, must_change_password)`);
        console.log(`   VALUES ('${name}', '${email}', 'USER_ID_FROM_DASHBOARD', '${role}', false)`);
        console.log(`   ON CONFLICT (auth_user_id) DO UPDATE SET role = '${role}';`);
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user - no user returned');
    }

    console.log('✅ Auth user created');

    // Create user record in users table
    console.log('Creating user record...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        auth_user_id: authData.user.id,
        role,
        must_change_password: false, // Set to false for admin
      })
      .select()
      .single();

    if (userError) {
      // If users record already exists, that's okay
      if (userError.code === '23505' || userError.message.includes('already exists')) {
        console.log('⚠️  User record already exists in users table. Updating role...');
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ role })
          .eq('email', email);
        
        if (updateError) {
          throw updateError;
        }
        console.log('✅ User record updated with super_admin role');
      } else {
        throw userError;
      }
    } else {
      console.log('✅ User record created');
    }

    // Success!
    console.log('\n' + '='.repeat(50));
    console.log('✅ SUPER ADMIN USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${tempPassword}`);
    console.log(`\n⚠️  IMPORTANT: Save this password!`);
    console.log('You can now login at: http://localhost:3000/login\n');

  } catch (error: any) {
    console.error('\n❌ Error creating admin user:');
    console.error(error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

createAdminUser();

