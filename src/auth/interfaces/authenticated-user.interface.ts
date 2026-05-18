export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  plan: 'FREE' | 'GOLD' | 'PREMIUM';
  age: number | null;
  bio: string | null;
  interests: string[];
  location: string | null;
  photos: string[];
}
