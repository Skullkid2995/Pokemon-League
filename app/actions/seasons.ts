'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function closeSeason(seasonId: string) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Unauthorized', success: false };
    }

    // Update season status to completed
    const { error: updateError } = await supabase
      .from('seasons')
      .update({ status: 'completed' })
      .eq('id', seasonId);

    if (updateError) {
      return { error: updateError.message, success: false };
    }

    revalidatePath('/seasons');
    revalidatePath('/');
    revalidatePath(`/seasons/${seasonId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error closing season:', error);
    return { error: error.message || 'Failed to close season', success: false };
  }
}

