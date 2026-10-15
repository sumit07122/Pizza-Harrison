'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerAccount, CustomerAddress } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface CustomerAuthContextType {
  customer: CustomerAccount | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  loginWithPassword: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (phone: string) => Promise<{ success: boolean; provider?: string; sandboxOtp?: string; error?: string }>;
  sendOtp: (phone: string, purpose?: string) => Promise<{ success: boolean; dev_token?: string; sandboxOtp?: string; provider?: string; error?: string }>;
  verifyOtpAndLogin: (phone: string, otp: string) => Promise<{ success: boolean; needsRegistration?: boolean; verificationToken?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string, purpose?: string) => Promise<{ success: boolean; token?: string; verificationToken?: string; error?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; needsRegistration?: boolean; error?: string }>;
  registerAccount: (data: { phone: string; full_name: string; email?: string; password?: string; verificationToken?: string }) => Promise<{ success: boolean; error?: string }>;
  registerWithOtp: (data: { name?: string; full_name?: string; phone: string; email?: string; password?: string; otp?: string; verificationToken?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleUser?: { email?: string; name?: string; avatar_url?: string; credential?: string }) => Promise<{ success: boolean; isNew?: boolean; error?: string }>;
  updateProfile: (data: { full_name?: string; name?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  saveAddress: (address: Omit<CustomerAddress, 'id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (addressId: string) => Promise<{ success: boolean; error?: string }>;
  toggleFavorite: (productId: string) => Promise<{ success: boolean; error?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from cookie/localStorage on initial mount
  const checkCurrentSession = async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('ph_customer_token') : null;
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();

      if (data.authenticated && data.customer) {
        setCustomer(data.customer);
        if (storedToken) setToken(storedToken);
      } else {
        setCustomer(null);
        setToken(null);
        if (typeof window !== 'undefined') localStorage.removeItem('ph_customer_token');
      }
    } catch (_) {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const loginWithPassword = async (phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        if (data.sessionToken) {
          setToken(data.sessionToken);
          localStorage.setItem('ph_customer_token', data.sessionToken);
        }
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials.' };
    } catch (e: any) {
      return { success: false, error: 'Network error connecting to login service.' };
    }
  };

  const requestOtp = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          provider: data.provider,
          sandboxOtp: data.sandboxOtp,
        };
      }
      return { success: false, error: data.error || 'Failed to send verification code.' };
    } catch (e: any) {
      return { success: false, error: 'Network error sending verification code.' };
    }
  };

  const sendOtp = async (phone: string, purpose?: string) => {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          provider: data.provider,
          dev_token: data.sandboxOtp,
          sandboxOtp: data.sandboxOtp,
        };
      }
      return { success: false, error: data.error || 'Failed to send OTP code.' };
    } catch (e: any) {
      return { success: false, error: 'Network error sending OTP code.' };
    }
  };

  const verifyOtpAndLogin = async (phone: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (data.needsRegistration) {
        return {
          success: true,
          needsRegistration: true,
          verificationToken: data.verificationToken,
        };
      }

      if (data.success && data.customer) {
        setCustomer(data.customer);
        if (data.sessionToken) {
          setToken(data.sessionToken);
          localStorage.setItem('ph_customer_token', data.sessionToken);
        }
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid verification code.' };
    } catch (e: any) {
      return { success: false, error: 'Network error verifying OTP code.' };
    }
  };

  const verifyOtp = async (phone: string, otp: string, purpose?: string) => {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, purpose }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.customer) {
          setCustomer(data.customer);
        }
        if (data.sessionToken) {
          setToken(data.sessionToken);
          if (typeof window !== 'undefined') localStorage.setItem('ph_customer_token', data.sessionToken);
        }
        return {
          success: true,
          token: data.verificationToken,
          verificationToken: data.verificationToken,
        };
      }
      return { success: false, error: data.error || 'Invalid or expired verification code.' };
    } catch (e: any) {
      return { success: false, error: 'Network error verifying OTP code.' };
    }
  };

  const loginWithOtp = async (phone: string, otp: string) => {
    return verifyOtpAndLogin(phone, otp);
  };

  const registerAccount = async (data: {
    phone: string;
    full_name: string;
    email?: string;
    password?: string;
    verificationToken?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.customer) {
        setCustomer(resData.customer);
        if (resData.sessionToken) {
          setToken(resData.sessionToken);
          localStorage.setItem('ph_customer_token', resData.sessionToken);
        }
        return { success: true };
      }
      return { success: false, error: resData.error || 'Registration failed.' };
    } catch (e: any) {
      return { success: false, error: 'Network error registering account.' };
    }
  };

  const registerWithOtp = async (data: {
    name?: string;
    full_name?: string;
    phone: string;
    email?: string;
    password?: string;
    otp?: string;
    verificationToken?: string;
  }) => {
    let tokenToUse = data.verificationToken;
    if (data.otp && !tokenToUse) {
      const vRes = await verifyOtp(data.phone, data.otp, 'registration');
      if (!vRes.success || !vRes.token) {
        return { success: false, error: vRes.error || 'Invalid OTP code.' };
      }
      tokenToUse = vRes.token;
    }

    return registerAccount({
      phone: data.phone,
      full_name: data.full_name || data.name || '',
      email: data.email,
      password: data.password,
      verificationToken: tokenToUse,
    });
  };

  const loginWithGoogle = async (googleUser?: {
    email?: string;
    name?: string;
    avatar_url?: string;
    credential?: string;
  }) => {
    try {
      // 1. If Supabase is configured and no credentials passed directly, try Supabase OAuth
      const supabase = getSupabaseBrowserClient();
      if (supabase && (!googleUser || (!googleUser.email && !googleUser.credential))) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
          },
        });
        if (error) {
          console.warn('Supabase Google OAuth error:', error);
        } else {
          return { success: true };
        }
      }

      // 2. Direct Google Auth API endpoint
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser || {}),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        if (data.sessionToken) {
          setToken(data.sessionToken);
          if (typeof window !== 'undefined') localStorage.setItem('ph_customer_token', data.sessionToken);
        }
        return { success: true, isNew: data.isNew };
      }

      return { success: false, error: data.error || 'Google Sign-In failed.' };
    } catch (e: any) {
      return { success: false, error: 'Network error connecting to Google Sign-In.' };
    }
  };

  const updateProfile = async (data: { full_name?: string; name?: string; email?: string }) => {
    try {
      const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('ph_customer_token') : null);
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        body: JSON.stringify({
          full_name: data.full_name || data.name,
          email: data.email,
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.customer) {
        setCustomer(resData.customer);
        return { success: true };
      }
      return { success: false, error: resData.error || 'Failed to update profile.' };
    } catch (e: any) {
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    setCustomer(null);
    setToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem('ph_customer_token');
  };

  const refreshCustomer = async () => {
    await checkCurrentSession();
  };

  const saveAddress = async (address: Omit<CustomerAddress, 'id'> & { id?: string }) => {
    if (!token) return { success: false, error: 'Please sign in first.' };
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(address),
      });
      const data = await res.json();
      if (data.success && data.addresses) {
        setCustomer((prev) => prev ? { ...prev, saved_addresses: data.addresses } : null);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to save address.' };
    } catch (e: any) {
      return { success: false, error: 'Network error saving address.' };
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!token) return { success: false, error: 'Please sign in first.' };
    try {
      const res = await fetch(`/api/customer/addresses?id=${addressId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.addresses) {
        setCustomer((prev) => prev ? { ...prev, saved_addresses: data.addresses } : null);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to remove address.' };
    } catch (e: any) {
      return { success: false, error: 'Network error removing address.' };
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!token) return { success: false, error: 'Please sign in first.' };
    try {
      const res = await fetch('/api/customer/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success && data.favorites) {
        setCustomer((prev) => prev ? { ...prev, favorites: data.favorites } : null);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update favorites.' };
    } catch (e: any) {
      return { success: false, error: 'Network error updating favorites.' };
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoggedIn: Boolean(customer),
        isAuthenticated: Boolean(customer),
        loading,
        token,
        loginWithPassword,
        requestOtp,
        sendOtp,
        verifyOtpAndLogin,
        verifyOtp,
        loginWithOtp,
        registerAccount,
        registerWithOtp,
        loginWithGoogle,
        updateProfile,
        logout,
        refreshCustomer,
        saveAddress,
        deleteAddress,
        toggleFavorite,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
