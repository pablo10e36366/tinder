import { SubscriptionStatus } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  email: true,
  profile: {
    select: {
      displayName: true,
      age: true,
      bio: true,
      location: true,
    },
  },
  interests: {
    select: {
      interest: true,
    },
    orderBy: {
      interest: 'asc',
    },
  },
  photos: {
    select: {
      url: true,
      sortOrder: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  },
  subscriptions: {
    where: {
      status: SubscriptionStatus.ACTIVE,
    },
    take: 1,
    orderBy: {
      startedAt: 'desc',
    },
    select: {
      plan: {
        select: {
          code: true,
        },
      },
    },
  },
} as const;
