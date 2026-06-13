'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/Button';

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Listen to latest 5 notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    // Listen to unread count (using a separate query for accuracy if needed, or derived if count is small)
    const unreadQ = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('readAt', '==', null)
    );

    const unreadUnsubscribe = onSnapshot(unreadQ, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => {
      unsubscribe();
      unreadUnsubscribe();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="relative p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700">
          <div className="py-2">
            <h3 className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
              การแจ้งเตือน
            </h3>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">ไม่มีการแจ้งเตือนใหม่</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${!notif.readAt ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)} className="text-sm text-blue-600 hover:text-blue-500 font-medium block text-center">
                ดูทั้งหมด
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
