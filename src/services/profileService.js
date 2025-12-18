import { supabase } from '@/lib/customSupabaseClient';

export const updateProfile = async (profileData) => {
  // Use getSession instead of getUser to avoid 403 errors
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('User not logged in');
  const user = session.user;

  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

// Admin: Get all customers
export const adminGetAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, address, points, total_points, avatar_url, created_at, updated_at');

  if (error) {
    console.error('Error fetching profiles (likely RLS restricted):', error);
    // Return empty array instead of throwing to prevent app crash for non-superadmins
    return [];
  }
  return data || [];
};

// Admin: Update any profile
export const adminUpdateProfile = async (id, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile as admin:', error);
    throw error;
  }

  return data;
};

/**
 * Admin: Add points to a user (updates both points and total_points)
 */
export const adminAddPoints = async (userId, pointsToAdd) => {
  // First get current values
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('points, total_points')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching profile:', fetchError);
    throw fetchError;
  }

  const currentPoints = profile?.points || 0;
  const currentTotalPoints = profile?.total_points || 0;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      points: currentPoints + pointsToAdd,
      total_points: currentTotalPoints + pointsToAdd
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error adding points:', error);
    throw error;
  }

  return data;
};