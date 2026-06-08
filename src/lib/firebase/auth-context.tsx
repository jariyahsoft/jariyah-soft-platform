'use client';

import React, { createContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './config';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        try {
          setUser(currentUser);
          if (currentUser) {
            // Force refresh to get the latest custom claims if needed
            const idTokenResult = await currentUser.getIdTokenResult();
            const userRole = (idTokenResult.claims.role as string) || 'member';
            setRole(userRole);
          } else {
            setRole(null);
          }
        } catch (err: unknown) {
          console.error('Failed to get user claims', err);
          setError(err instanceof Error ? err.message : 'Authentication error');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Auth state change error', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      // provider.addScope('email');
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      throw err;
    }
  };

  const signInWithGitHub = async () => {
    try {
      setError(null);
      const provider = new GithubAuthProvider();
      // provider.addScope('user:email');
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        error,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
