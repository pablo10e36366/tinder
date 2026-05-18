import type { PublicUser } from '../../users/domain/entities/public-user';

export function normalizePublicUser<T extends PublicUser>(user: T): T {
  return {
    ...user,
    interests: Array.isArray(user.interests) ? user.interests : [],
    photos: Array.isArray(user.photos) ? user.photos : [],
  };
}
