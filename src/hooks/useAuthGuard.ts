'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing'; // Assuming next-intl routing wrapper is setup
import { useAuth } from './useAuth';

interface UseAuthGuardOptions {
  requiredRole?: string;
  redirectTo?: string;
}

export const useAuthGuard = ({ requiredRole, redirectTo = '/login' }: UseAuthGuardOptions = {}) => {
  const { loading, isAuthenticated, isAtLeast } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && !isAtLeast(requiredRole)) {
      // Typically, one might redirect to a generic 403 page or home.
      // Assuming a generic access-denied or simply redirecting to home.
      router.push('/');
    }
  }, [loading, isAuthenticated, requiredRole, isAtLeast, router, redirectTo]);

  return { loading, isAuthenticated, authorized: requiredRole ? isAtLeast(requiredRole) : isAuthenticated };
};
