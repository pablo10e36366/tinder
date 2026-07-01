import type { PublicUser } from '../../domain/entities/public-user';

interface PublicUserRecord {
  id: number;
  email: string;
  profile?: {
    displayName: string;
    age: number | null;
    bio: string | null;
    location: string | null;
  } | null;
  interests?: Array<{ interest: string }>;
  photos?: Array<{ url: string }>;
  subscriptions?: Array<{
    plan: {
      code: 'FREE' | 'GOLD' | 'PREMIUM';
    };
  }>;
}

export function normalizePublicUser(user: PublicUserRecord): PublicUser {
  return {
    id: user.id,
    name: user.profile?.displayName ?? user.email,
    email: user.email,
    plan: user.subscriptions?.[0]?.plan.code ?? 'FREE',
    age: user.profile?.age ?? null,
    bio: user.profile?.bio ?? null,
    interests: Array.isArray(user.interests)
      ? user.interests.map((interest) => interest.interest)
      : [],
    location: user.profile?.location ?? null,
    photos: Array.isArray(user.photos)
      ? user.photos.map((photo) => photo.url)
      : [],
  };
}
