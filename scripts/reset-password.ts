/**
 * Script to reset password for a user
 * Run with: npx tsx scripts/reset-password.ts <email>
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

async function resetPassword(email: string) {
  // Generate a new random secure password
  const newPassword = generateTemporaryPassword({ option: 'random', length: 16 });

  console.log('\n=== Resetting Password ===\n');
  console.log(`Email: ${email}`);
  console.log(`\nGenerating new password...\n`);

  // Create Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // First, get the user by email
    console.log('Finding user...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ User with email ${email} not found!`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

    // Update the user's password
    console.log('Resetting password...');
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Password reset successfully!\n');
    console.log('='.repeat(50));
    console.log('NEW PASSWORD:');
    console.log('='.repeat(50));
    console.log(newPassword);
    console.log('='.repeat(50));
    console.log(`\n⚠️  IMPORTANT: Save this password securely!`);
    console.log(`User can now login with this new password.\n`);

  } catch (error: any) {
    console.error('\n❌ Error resetting password:');
    console.error(error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Error: Please provide an email address');
  console.error('Usage: npx tsx scripts/reset-password.ts <email>');
  console.error('Example: npx tsx scripts/reset-password.ts skullkid2995@gmail.com');
  process.exit(1);
}

resetPassword(email);

