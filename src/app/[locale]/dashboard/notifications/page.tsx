'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.readAt);
      if (unreadNotifs.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifs.forEach(notif => {
        batch.update(doc(db, 'notifications', notif.id), { readAt: new Date() });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>;
  }

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          การแจ้งเตือน
          {unreadCount > 0 && (
            <span className="ml-3 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
              {unreadCount} ใหม่
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            อ่านทั้งหมด
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
            ไม่มีการแจ้งเตือนในขณะนี้
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(notif => (
              <li key={notif.id} className={!notif.readAt ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}>
                <div className="px-4 py-4 sm:px-6 flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => markAsRead(notif.id)}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                        {notif.subject}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {notif.createdAt?.toDate().toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  {!notif.readAt && (
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                      >
                        <span className="sr-only">ทำเครื่องหมายว่าอ่านแล้ว</span>
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
