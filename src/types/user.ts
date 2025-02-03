export type UserRole = 'admin' | 'barber' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarberProfile extends User {
  services: Service[];
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  rating: number;
  reviews: Review[];
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  imageUrl?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  createdAt: Date;
}