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

export interface PublicAvailabilityResponse {
  from: string;
  to: string;
  occupiedDates: string[];
}

export interface PublicFrequentClientRegistrationRequest {
  parentName: string;
  childName: string;
  phone: string;
  email?: string;
  consentAccepted: boolean;
}

export interface PublicFrequentClientRegistrationResponse {
  status: "ACTIVE";
  message: string;
  phoneVerificationRequired: boolean;
}
