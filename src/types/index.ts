export type UserRole = 'user' | 'consultant' | 'dermatologist' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  skinType: string;
  primaryConcern: string;
  skinHealthScore: number;
  progressPercentage: number;
  lastAssessment: string;
  joinedAt: string;
  status: 'Active' | 'Pending' | 'Inactive';
  age?: number;
  avatarUrl?: string;
  lifestyleScore?: number;
  sleepQuality?: string;
  hydrationLevel?: string;
}

export type RequestStatus = 
  | 'Pending' 
  | 'Forwarded to Dermatologist' 
  | 'Accepted by Dermatologist' 
  | 'Approved' 
  | 'Denied';

export interface ConsultationRequest {
  id: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  dermatologistId: string;
  dermatologistName: string;
  concern: string;
  preferredDate: string;
  preferredTime: string;
  requestedOn: string;
  status: RequestStatus;
  notes?: string;
  dermatologistNotes?: string;
}

export interface Dermatologist {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  specialties: string[];
  photoUrl: string;
  availableToday: boolean;
  bio?: string;
  qualifications?: string;
  clinicLocation?: string;
  fee?: string;
  email?: string;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  category: string;
  size: string;
  imageUrl: string;
  keyIngredients: string[];
  compatibilityScore: number;
  compatibilityLabel: string;
  benefits: string[];
  matchBadge: string;
  typeFilter: 'Cleanser' | 'Treatment' | 'Moisturizer' | 'Sun Protection' | 'Night Care';
  price: string;
  buyUrl?: string;
}

export interface SkinAssessmentData {
  overallScore: number;
  skinType: string;
  hydration: number;
  texture: number;
  evenTone: number;
  elasticity: number;
  oilBalance: number;
  concerns: {
    id: string;
    name: string;
    intensity: number;
    severity: 'Mild' | 'Moderate' | 'High';
  }[];
  priorities: {
    rank: number;
    name: string;
    severity: 'Mild' | 'Moderate' | 'High';
  }[];
  assessmentNotes: string;
  photoUrl?: string;
  confidence: number;
}
