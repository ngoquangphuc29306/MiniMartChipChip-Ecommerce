
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

// 🔒 ADMIN CONFIGURATION
// Primary: Check 'role' column in profiles table
// Fallback: Check against this email if role column doesn't exist
const ADMIN_EMAIL_FALLBACK = "chipchiptaphoa@gmail.com";

/**
 * Check if user is admin based on profile role or fallback email
 * @param {object} profile - User profile from database
 * @param {string} email - User email
 * @returns {boolean} True if user is admin
 */
const checkIsAdmin = (profile, email) => {
  // Primary: Check role from database
  if (profile?.role === 'admin') {
    return true;
  }
  // Fallback: Check email (for backward compatibility before migration)
  if (email === ADMIN_EMAIL_FALLBACK) {
    return true;
  }
  return false;
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const resetAuthState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const fetchProfile = useCallback(async (userId, userEmail = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (data) {
        data.points = data.points || 0;
        setProfile(data);

        // Update admin status based on profile role
        const email = userEmail || data.email;
        setIsAdmin(checkIsAdmin(data, email));

        return data;
      } else {
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error("Unhandled error in fetchProfile:", error);
      return null;
    }
  }, []);

  const createProfileForNewUser = useCallback(async (user) => {
    if (!user) return;

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const metaName = user.user_metadata?.full_name;
      const metaPhone = user.user_metadata?.phone;
      const fallbackName = user.email?.split('@')[0] || 'User';
      const fullNameToUse = metaName || fallbackName;
      const phoneToUse = metaPhone && metaPhone.trim() ? metaPhone.trim() : null;

      if (existingProfile) {
        // Update profile if metadata has new info
        const updates = {};
        if (!existingProfile.full_name && metaName) {
          updates.full_name = metaName;
        }
        if (!existingProfile.phone && phoneToUse) {
          updates.phone = phoneToUse;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);
          await fetchProfile(user.id);
        } else {
          existingProfile.points = existingProfile.points || 0;
          setProfile(prev => prev || existingProfile);
        }
        return;
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: fullNameToUse,
        phone: phoneToUse,
        points: 0,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          await fetchProfile(user.id);
        } else {
          console.error("Error creating profile:", insertError);
        }
      } else {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error("Critical error in createProfileForNewUser:", error);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session first
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Initial session check error:", error);
          if (error.message && (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token"))) {
            await supabase.auth.signOut();
            resetAuthState();
          }
        }

        // Process initial session if exists
        if (initialSession && mounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Create/fetch profile first, then check admin role
          await createProfileForNewUser(initialSession.user);
          // Admin check will be done after profile is fetched
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          resetAuthState();
          setLoading(false);
          return;
        }

        setSession(session);
        const currentUser = session.user;
        setUser(currentUser);

        // CHECK ADMIN ROLE (will be updated after profile fetch)
        // Temporary check based on email, will be corrected after profile loads
        setIsAdmin(checkIsAdmin(null, currentUser.email));

        if (event === 'SIGNED_IN') {
          await createProfileForNewUser(currentUser);
        } else if (event === 'TOKEN_REFRESHED') {
          await fetchProfile(currentUser.id);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, createProfileForNewUser]);

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Đăng nhập thất bại", description: "Sai email hoặc mật khẩu." });
      return { error };
    }

    if (data?.user) {
      await createProfileForNewUser(data.user);
    }

    setLoading(false);

    if (data.user.email === ADMIN_EMAIL_FALLBACK) {
      toast({ title: "Xin chào Admin!", description: "Đang chuyển hướng tới trang quản trị." });
    } else {
      toast({ title: "Đăng nhập thành công!", description: "Chào mừng bạn quay trở lại." });
    }

    return { error: null };
  };

  const signUp = async (email, password, fullName, phone = '') => {
    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });

    if (signUpError) {
      setLoading(false);
      toast({ variant: "destructive", title: "Đăng ký thất bại", description: signUpError.message });
      return { user: null, session: null, error: signUpError };
    }

    if (authData?.user) {
      // Trim phone và đảm bảo lưu đúng giá trị
      const phoneToSave = phone && phone.trim() ? phone.trim() : null;

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        phone: phoneToSave,
        points: 0,
      }, { onConflict: 'id', ignoreDuplicates: true });

      if (profileError) {
        console.error("Profile creation error during explicit signup:", profileError);
      } else {
        await fetchProfile(authData.user.id);
      }
    }

    setLoading(false);
    toast({ title: "Đăng ký thành công!", description: "Vui lòng kiểm tra email để xác thực tài khoản." });
    return { user: authData.user, session: authData.session, error: null };
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`,
      }
    });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Đăng nhập với Google thất bại", description: error.message });
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  const signInWithFacebook = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/account`,
      }
    });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Đăng nhập với Facebook thất bại", description: error.message });
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Đăng xuất thất bại", description: error.message });
    } else {
      toast({ title: "Đã đăng xuất." });
    }
  };

  const value = { user, session, profile, loading, isAdmin, signUp, signIn, signOut, signInWithGoogle, signInWithFacebook, fetchProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
