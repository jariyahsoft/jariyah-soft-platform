export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewItem {
  id: string;
  softwareId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt?: string;
  updatedAt?: string;
  moderationReason?: {
    reasonCode?: string;
    note?: string;
    rejectedAt?: string;
    rejectedBy?: string;
  } | null;
}
