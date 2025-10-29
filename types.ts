export enum Grade {
  Sapeur = "Sapeur",
  Caporal = "Caporal / Caporal-chef",
  Sergent = "Sergent / Sergent-chef / Adjudant / Adjudant-chef",
  Lieutenant = "Lieutenant / Capitaine / Commandant / Colonel",
}

export enum ActivityType {
  G24 = "Garde 24h (G24)",
  _12J = "Garde 12h Jour (12J)",
  _12N = "Garde 12h Nuit (12N)",
  GardeLibre = "Garde libre",
  Formation = "Formation",
  AST24 = "Astreinte 24h (AST24)",
  ASTJ = "Astreinte Jour (ASTJ)",
  ASTN = "Astreinte Nuit (ASTN)",
}

export enum ActivityStatus {
  Saisie = "Saisie",
  Validee = "Validée",
  Facturee = "Facturée",
}

export enum SubActivityType {
  GardeCS = "GardeCS",
  AstreinteCS = "AstreinteCS",
  AstreinteDomicile = "Astreinte Domicile",
  Intervention = "Intervention",
  Formation = "Formation",
  InterventionNuit = "InterventionNuit",
  InterventionDimancheFerie = "InterventionDimancheFerie",
}

export enum SubscriptionStatus {
  TRIALING = "trialing",
  ACTIVE = "active",
  ENDED = "ended", // Covers canceled, expired, etc. for simplicity
}

export interface Subscription {
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  endsAt?: Date; // Current period end
}

export interface TimeSlot {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface UserSettings {
  timeSlots: {
    gardeCS: TimeSlot[];
  };
  activityCoefficients: Record<SubActivityType, number>;
}

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatarUrl: string;
  grade: Grade;
  caserne: string;
  telephone?: string;
  settings?: UserSettings;
  subscription?: Subscription;
}

export interface Intervention {
  id: string;
  start: Date;
  end: Date;
  motif: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  start: Date;
  end: Date;
  interventions: Intervention[];
  status: ActivityStatus;
  notes?: string;
}

export interface CalculationLine {
  description: string;
  subActivityType: SubActivityType;
  durationHours: number;
  rate: number;
  coefficient: number;
  bonus: number;
  total: number;
  start: Date;
  end: Date;
}

export interface CalculationResult {
  lines: CalculationLine[];
  totalAmount: number;
}