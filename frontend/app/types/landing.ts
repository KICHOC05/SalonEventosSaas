// app/types/landing.ts

export interface Package {
  id: string;
  publicId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  maxGuests: number;
  features: string[];
  isActive: boolean;
}

export interface StatsResponse {
  totalEvents: number;
  happyChildren: number;
  yearsExperience: number;
  averageRating: number;
}

// ✅ Renombrar para evitar conflicto
export interface PublicAvailabilityResponse {
  availableDates: string[];
  month: string;
  year: number;
}