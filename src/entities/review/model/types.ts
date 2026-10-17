export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'rejected';
export interface ReviewDraft {
  name: string;
  rating: number;
  text: string;
}
export interface Review extends ReviewDraft {
  id: string;
  status: ReviewStatus;
  reply: string;
  createdAt: string;
  updatedAt: string;
}
export interface ReviewPage {
  reviews: Review[];
  total: number;
}
export interface ReviewRepository {
  kind: 'demo' | 'remote' | 'offline';
  listPublic(): Promise<Review[]>;
  listModeration(status: ReviewStatus, offset: number): Promise<ReviewPage>;
  submit(id: string, draft: ReviewDraft): Promise<void>;
  update(review: Review, patch: { status?: ReviewStatus; reply?: string }): Promise<void>;
  isModerator(): Promise<boolean>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(listener: () => void): () => void;
}

export const REVIEW_PAGE_SIZE = 10;
export const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: 'На проверке',
  published: 'Опубликованные',
  hidden: 'Скрытые',
  rejected: 'Отклонённые',
};

export function prepareReview(draft: ReviewDraft): ReviewDraft {
  const name = draft.name.trim();
  const text = draft.text.trim();
  if (!name || name.length > 60) throw new Error('Укажите имя: до 60 символов.');
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5)
    throw new Error('Выберите оценку от 1 до 5 звёзд.');
  if (text.length < 10 || text.length > 1500)
    throw new Error('Напишите отзыв длиной от 10 до 1500 символов.');
  return { name, rating: draft.rating, text };
}

export function canChangeReviewStatus(from: ReviewStatus, to: ReviewStatus): boolean {
  const transitions: Record<ReviewStatus, ReviewStatus[]> = {
    pending: ['published', 'rejected'],
    published: ['hidden'],
    hidden: ['published'],
    rejected: ['pending'],
  };
  return from === to || transitions[from].includes(to);
}
