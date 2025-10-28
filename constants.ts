import { Grade, SubActivityType, ActivityType, ActivityStatus, Intervention, Activity, User } from './types';

export const GRADE_RATES: Record<Grade, number> = {
  [Grade.Sapeur]: 8.61,
  [Grade.Caporal]: 9.24,
  [Grade.Sergent]: 10.43,
  [Grade.Lieutenant]: 12.96,
};

export const ACTIVITY_COEFFICIENTS: Record<SubActivityType, number> = {
  [SubActivityType.GardeCS]: 0.65,
  [SubActivityType.AstreinteCS]: 0.35,
  [SubActivityType.AstreinteDomicile]: 0.08,
  [SubActivityType.Intervention]: 1.0,
  [SubActivityType.Formation]: 1.0, // Assuming 100% for formation
};

export const NIGHT_BONUS = 2.0; // 200%
export const SUNDAY_HOLIDAY_BONUS = 1.5; // 150%

export const MOCK_USER: User = {
    id: 'user-1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@sdis.fr',
    avatarUrl: 'https://picsum.photos/seed/user1/200',
    grade: Grade.Sergent,
    caserne: 'CS-Principal',
    telephone: '06 12 34 56 78',
};

// Example from the prompt
const interventionExample: Intervention = {
    id: 'inter-1',
    start: new Date('2023-10-26T09:30:00'),
    end: new Date('2023-10-26T10:30:00'),
    motif: 'Feu de poubelle',
};

export const MOCK_ACTIVITIES: Activity[] = [
    {
        id: 'activity-1',
        type: ActivityType._12J,
        start: new Date('2023-10-26T08:00:00'),
        end: new Date('2023-10-26T20:00:00'),
        interventions: [interventionExample],
        status: ActivityStatus.Saisie,
        notes: 'Garde de jour standard avec une intervention le matin.'
    },
    {
        id: 'activity-2',
        type: ActivityType.G24,
        start: new Date('2023-10-28T08:00:00'), // A Saturday
        end: new Date('2023-10-29T08:00:00'), // A Sunday
        interventions: [
            { id: 'inter-2', start: new Date('2023-10-28T23:00:00'), end: new Date('2023-10-29T00:30:00'), motif: 'Accident de la route' }
        ],
        status: ActivityStatus.Validee,
        notes: 'Garde de 24h avec intervention nocturne à cheval sur un dimanche.'
    },
    {
        id: 'activity-3',
        type: ActivityType.ASTN,
        start: new Date('2023-11-01T20:00:00'),
        end: new Date('2023-11-02T08:00:00'),
        interventions: [],
        status: ActivityStatus.Facturee,
        notes: 'Astreinte de nuit calme.'
    },
    {
        id: 'activity-4',
        type: ActivityType.Formation,
        start: new Date('2023-11-05T09:00:00'),
        // FIX: Corrected a typo from `new date` to `new Date`.
        end: new Date('2023-11-05T17:00:00'),
        interventions: [],
        status: ActivityStatus.Validee,
    }
];