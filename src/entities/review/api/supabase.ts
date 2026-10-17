import { createClient } from '@supabase/supabase-js';
import { REVIEW_PAGE_SIZE } from '../model/types.ts';
import type { Review, ReviewRepository, ReviewStatus } from '../model/types.ts';

interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  reply: string;
  created_at: string;
  updated_at: string;
}
const fields = 'id,name,rating,body,status,reply,created_at,updated_at';
function fromRow(row: ReviewRow): Review {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    text: row.body,
    status: row.status,
    reply: row.reply,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseReviewRepository(url: string, publicKey: string): ReviewRepository {
  // Accept only the new public key format, so a server secret cannot be bundled accidentally.
  if (!publicKey.startsWith('sb_publishable_') || new URL(url).protocol !== 'https:')
    throw new Error('Нужны HTTPS-адрес проекта и публичный ключ Supabase (sb_publishable_).');
  const client = createClient(url, publicKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return {
    kind: 'remote',
    async listPublic() {
      const { data, error } = await client
        .from('reviews')
        .select(fields)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .order('id')
        .limit(100);
      if (error) throw new Error('Не удалось загрузить отзывы. Попробуйте ещё раз.');
      return (data as ReviewRow[]).map(fromRow);
    },
    async listModeration(status, offset) {
      const { data, error } = await client
        .from('reviews')
        .select(fields)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .order('id')
        .range(offset, offset + REVIEW_PAGE_SIZE - 1);
      if (error)
        throw new Error('Не удалось загрузить очередь. Проверьте вход и повторите попытку.');
      return (data as ReviewRow[]).map(fromRow);
    },
    async submit(id, draft) {
      const { error } = await client.rpc('submit_review', {
        submission_id: id,
        author_name: draft.name,
        stars: draft.rating,
        review_body: draft.text,
      });
      if (error)
        throw new Error(
          'Не удалось подтвердить отправку. Текст сохранён в форме — попробуйте ещё раз.',
        );
    },
    async update(review, patch) {
      const { data, error } = await client
        .from('reviews')
        .update(patch)
        .eq('id', review.id)
        .eq('updated_at', review.updatedAt)
        .select('id')
        .maybeSingle();
      if (error || !data)
        throw new Error(
          'Изменение не сохранено. Проверьте вход и обновите список: отзыв мог изменить другой администратор.',
        );
    },
    async isModerator() {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) return false;
      const { data, error } = await client
        .from('review_moderators')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (error) throw new Error('Не удалось проверить права доступа. Повторите вход.');
      return Boolean(data);
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Не удалось войти. Проверьте почту, пароль и соединение.');
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error)
        throw new Error('Не удалось завершить сеанс. Повторите выход при доступном соединении.');
    },
    onAuthChange(listener) {
      const { data } = client.auth.onAuthStateChange(() => {
        queueMicrotask(listener);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
