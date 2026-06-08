'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/firebase/auth-context';

const roleHierarchy: Record<string, number> = {
  member: 1,
  developer: 2,
  moderator: 3,
  admin: 4,
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, role, loading, error, signInWithGoogle, signInWithGitHub, signOut } = context;

  const isAuthenticated = !!user;

  const isRole = (targetRole: string) => {
    return role === targetRole;
  };

  const isAtLeast = (minimumRole: string) => {
    if (!role) return false;
    const currentWeight = roleHierarchy[role] || 0;
    const targetWeight = roleHierarchy[minimumRole] || 0;
    return currentWeight >= targetWeight;
  };

  return {
    user,
    role,
    loading,
    error,
    isAuthenticated,
    isRole,
    isAtLeast,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
  };
};
