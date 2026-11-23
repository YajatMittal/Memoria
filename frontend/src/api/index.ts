import { Platform } from 'react-native';

import { request } from './client';

export { ApiError, API_URL, errorMessage, setAuthToken, setUnauthorizedHandler } from './client';

export type User = { id: number; email: string; username: string };
export type Session = { token: string; user: User };

export type Memory = {
  id: number;
  caption: string;
  captured_on: string; // YYYY-MM-DD (user's local day)
  captured_at: string; // ISO timestamp (UTC)
  image: string; // base64
  mime_type: string;
};

export type ChatTurn = { role: 'user' | 'assistant'; text: string };
export type ChatReply = { reply: string; date: string | null; memories: Memory[] };

export type Place = { id: number; name: string; address: string; first_visited_at: string };

export type ForumPost = {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  comment_count: number;
};
export type ForumComment = {
  id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  author: string;
  created_at: string;
};

export const memoryUri = (m: Memory) => `data:${m.mime_type};base64,${m.image}`;

async function photoFormData(uri: string, capturedOn: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // On web the picker returns a blob:/data: URI; send it as a real Blob.
    const blob = await (await fetch(uri)).blob();
    form.append('image', blob, 'photo.jpg');
  } else {
    // React Native's FormData accepts {uri, name, type} file descriptors.
    form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  form.append('captured_on', capturedOn);
  return form;
}

export const api = {
  auth: {
    signup: (email: string, username: string, password: string) =>
      request<{ account_id: number; email: string }>('/auth/signup', {
        method: 'POST',
        json: { email, username, password },
      }),
    verify: (accountId: number, code: string) =>
      request<Session>('/auth/verify', { method: 'POST', json: { account_id: accountId, code } }),
    resend: (accountId: number) =>
      request<{ message: string }>('/auth/resend', { method: 'POST', json: { account_id: accountId } }),
    login: (email: string, password: string) =>
      request<Session>('/auth/login', { method: 'POST', json: { email, password } }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  memories: {
    forDay: (day: string) =>
      request<{ memories: Memory[] }>(`/memories?date=${encodeURIComponent(day)}`).then((r) => r.memories),
    days: () => request<{ days: Record<string, number> }>('/memories/days').then((r) => r.days),
    upload: async (uri: string, capturedOn: string) =>
      request<{ memory: Memory }>('/memories', { method: 'POST', form: await photoFormData(uri, capturedOn) }).then(
        (r) => r.memory,
      ),
    remove: (id: number) => request<void>(`/memories/${id}`, { method: 'DELETE' }),
  },

  assistant: {
    chat: (message: string, today: string, history: ChatTurn[]) =>
      request<ChatReply>('/assistant/chat', { method: 'POST', json: { message, today, history } }),
  },

  places: {
    visit: (latitude: number, longitude: number) =>
      request<{ place: Place | null; is_new: boolean }>('/places/visit', {
        method: 'POST',
        json: { latitude, longitude },
      }),
  },

  forum: {
    posts: () => request<{ posts: ForumPost[] }>('/forum/posts').then((r) => r.posts),
    create: (title: string, content: string) =>
      request<{ post: ForumPost }>('/forum/posts', { method: 'POST', json: { title, content } }).then((r) => r.post),
    post: (id: number) => request<{ post: ForumPost; comments: ForumComment[] }>(`/forum/posts/${id}`),
    comment: (postId: number, content: string) =>
      request<{ comment: ForumComment }>(`/forum/posts/${postId}/comments`, {
        method: 'POST',
        json: { content },
      }).then((r) => r.comment),
  },
};
