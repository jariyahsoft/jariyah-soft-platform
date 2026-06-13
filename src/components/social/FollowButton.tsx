'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface FollowButtonProps {
  targetType: 'software' | 'developer';
  targetId: string;
  initialFollowCount?: number;
}

export function FollowButton({ targetType, targetId, initialFollowCount = 0 }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const apiPath = `/api/v1/${targetType === 'software' ? 'software' : 'developers'}/${targetId}/follow`;

  useEffect(() => {
    if (!user) {
      setIsFetching(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const res = await fetch(apiPath, {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.data?.following || false);
        }
      } catch (error) {
        console.error('Failed to check follow status', error);
      } finally {
        setIsFetching(false);
      }
    };

    checkFollowStatus();
  }, [user, apiPath]);

  const handleToggleFollow = async () => {
    if (!user) {
      // Could show a toast or redirect to login
      alert('Please log in to follow.');
      return;
    }

    setIsLoading(true);
    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!previousState);

    try {
      const method = previousState ? 'DELETE' : 'POST';
      const res = await fetch(apiPath, {
        method,
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error('Follow action failed');
      }
    } catch (error) {
      // Revert optimistic update
      setIsFollowing(previousState);
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching && user) {
    return <Button variant="outline" disabled size="sm">...</Button>;
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'primary'}
      size="sm"
      onClick={handleToggleFollow}
      disabled={isLoading}
      aria-pressed={isFollowing}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
