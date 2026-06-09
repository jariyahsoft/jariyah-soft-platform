'use client';

import React, { useState } from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ className = '', src, name = 'User', size = 'md', ...props }: AvatarProps) {
  const [error, setError] = useState(false);

  // Generate initials (up to 2 letters)
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const firstInitial = parts[0][0] || '';
    const lastPart = parts[parts.length - 1];
    const lastInitial = lastPart ? lastPart[0] || '' : '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  // Harmonious gradient background based on username length or random hash
  const getBgColor = (text: string) => {
    const charCodeSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = charCodeSum % 5;
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      'bg-gradient-to-br from-purple-500 to-pink-600 text-white',
      'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
      'bg-gradient-to-br from-rose-500 to-red-600 text-white',
    ];
    return gradients[index];
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none border border-text-secondary/10 ${sizes[size]} ${className}`}
      {...props}
    >
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={`flex items-center justify-center h-full w-full font-bold tracking-wider ${getBgColor(name)}`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
