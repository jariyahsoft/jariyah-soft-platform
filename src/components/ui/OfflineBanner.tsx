'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const t = useTranslations('states');

  useEffect(() => {
    // Only access navigator on client-side
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-danger text-white py-2 px-4 shadow-md transition-all duration-300 animate-in slide-in-from-top flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4 animate-pulse shrink-0" />
      <span className="text-xs font-semibold tracking-wide">
        {t('offline') || 'คุณกำลังใช้งานแบบออฟไลน์'}
      </span>
    </div>
  );
}
