'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffRole } from '@/lib/types';

interface AdminContextType {
  currentRole: StaffRole | 'owner' | 'manager' | 'staff' | 'kitchen_staff' | 'order_staff';
  staffName: string;
  setCurrentRole: (role: any) => void;
  setStaffName: (name: string) => void;
}

const AdminContext = createContext<AdminContextType>({
  currentRole: 'owner',
  staffName: 'Harrison Sharma (Owner)',
  setCurrentRole: () => {},
  setStaffName: () => {},
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<string>('owner');
  const [staffName, setStaffNameState] = useState<string>('Harrison Sharma (Owner)');

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('ph_admin_role');
      const savedName = localStorage.getItem('ph_admin_name');
      if (savedRole) setCurrentRoleState(savedRole);
      if (savedName) setStaffNameState(savedName);
    } catch (e) {
      // Ignore localStorage unavailable
    }
  }, []);

  const setCurrentRole = (role: any) => {
    setCurrentRoleState(role);
    try {
      localStorage.setItem('ph_admin_role', role);
      if (role === 'owner') setStaffNameState('Harrison Sharma (Owner)');
      else if (role === 'manager') setStaffNameState('Rohan Verma (Manager)');
      else if (role === 'kitchen_staff') setStaffNameState('Vikram Cook (Kitchen)');
      else setStaffNameState('Staff Counter');
    } catch (e) {}
  };

  const setStaffName = (name: string) => {
    setStaffNameState(name);
    try {
      localStorage.setItem('ph_admin_name', name);
    } catch (e) {}
  };

  return (
    <AdminContext.Provider
      value={{
        currentRole: currentRole as any,
        staffName,
        setCurrentRole,
        setStaffName,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
