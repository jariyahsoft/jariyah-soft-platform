'use client';

import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  // Protect this route, requiring the user to be logged in
  const { loading: guardLoading, isAuthenticated } = useAuthGuard();
  const { user, role, signOut } = useAuth();

  if (guardLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <button
              onClick={signOut}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p><strong>Welcome back!</strong> You have successfully authenticated.</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Profile</h2>
              <ul className="space-y-2 font-mono text-sm">
                <li><span className="text-gray-500">Email:</span> {user?.email}</li>
                <li><span className="text-gray-500">UID:</span> {user?.uid}</li>
                <li><span className="text-gray-500">Role:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">{role || 'Loading...'}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
