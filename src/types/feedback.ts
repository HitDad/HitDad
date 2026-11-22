import type { UserSummary } from './user';

/**
 * In-app feedback and bug report contracts matching `/api/feedback/*`
 * in CSE HitDad API v1.2.4.
 */

export type FeedbackCategory = 'BUG' | 'FEATURE' | 'UX' | 'OTHER';

export type FeedbackStatus = 'NEW' | 'REVIEWING' | 'RESOLVED';

export interface FeedbackItem {
  id: string;
  category: FeedbackCategory;
  rating: number | null;
  message: string;
  pagePath: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: UserSummary;
}

export interface CreateFeedbackBody {
  category?: FeedbackCategory;
  message: string;
  rating?: number;
  pagePath?: string;
}

export interface CreateFeedbackResponse {
  message: string;
  feedback: Pick<FeedbackItem, 'id' | 'status' | 'createdAt'>;
}

export interface UpdateFeedbackBody {
  status?: FeedbackStatus;
  adminNote?: string;
}

export interface FeedbackListResponse {
  feedbacks: FeedbackItem[];
  stats: {
    total: number;
    NEW: number;
    REVIEWING: number;
    RESOLVED: number;
  };
}
