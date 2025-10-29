
import { Activity, User, Intervention, SubActivityType, CalculationResult, CalculationLine, UserSettings } from '../types';
import { GRADE_RATES, DEFAULT_ACTIVITY_COEFFICIENTS, DEFAULT_TIME_SLOTS, SUB_ACTIVITY_LABELS } from '../constants';

const isNight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 22 || hour < 7;
};

const isSundayOrHoliday = (date: Date): boolean => {
  // Simplified: only checks for Sunday. A real implementation would need a list of public holidays.
  return date.getDay() === 0;
};

// Helper to convert "HH:mm" string to total minutes from midnight
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const getSubActivityTypeForShift = (date: Date, activity: Activity, settings?: UserSettings): SubActivityType => {
  const isAstreinteType = activity.type.startsWith('Astreinte');
  if (isAstreinteType) return SubActivityType.AstreinteDomicile;
  if (activity.type === "Formation") return SubActivityType.Formation;

  // Use user settings if available, otherwise fall back to defaults
  const timeSlots = settings?.timeSlots?.gardeCS || DEFAULT_TIME_SLOTS.gardeCS;

  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  for (const slot of timeSlots) {
      const startMinutes = timeToMinutes(slot.start);
      const endMinutes = timeToMinutes(slot.end);
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          return SubActivityType.GardeCS;
      }
  }

  return SubActivityType.AstreinteCS;
};

const findIntervention = (date: Date, interventions: Intervention[]): Intervention | undefined => {
  return interventions.find(inter => date >= inter.start && date < inter.end);
};

export const calculateActivityPay = (activity: Activity, user: User): CalculationResult => {
  const baseRate = GRADE_RATES[user.grade];
  const lines: CalculationLine[] = [];
  let totalAmount = 0;
  
  // Use user's custom coefficients or fall back to defaults
  const activityCoefficients = user.settings?.activityCoefficients || DEFAULT_ACTIVITY_COEFFICIENTS;

  let currentTime = new Date(activity.start);
  const endTime = new Date(activity.end);

  while (currentTime < endTime) {
    const nextTime = new Date(currentTime.getTime() + 60 * 1000); // Process minute by minute

    const intervention = findIntervention(currentTime, activity.interventions);
    let subActivityType: SubActivityType;
    let coefficient: number;
    const bonus = 1.0; // Bonus is now handled by specific coefficients
    let description: string;
    
    if (intervention) {
      const isNightTime = isNight(currentTime);
      const isSundayTime = isSundayOrHoliday(currentTime);

      if (isNightTime) {
        subActivityType = SubActivityType.InterventionNuit;
      } else if (isSundayTime) {
        subActivityType = SubActivityType.InterventionDimancheFerie;
      } else {
        subActivityType = SubActivityType.Intervention;
      }
      
      description = `${SUB_ACTIVITY_LABELS[subActivityType]} (${intervention.motif})`;

    } else {
      subActivityType = getSubActivityTypeForShift(currentTime, activity, user.settings);
      description = SUB_ACTIVITY_LABELS[subActivityType];
    }

    coefficient = activityCoefficients[subActivityType];
    
    const durationMinutes = 1;
    const durationHours = durationMinutes / 60;
    const minutePay = durationHours * baseRate * coefficient * bonus;

    totalAmount += minutePay;

    const lastLine = lines[lines.length - 1];
    if (
      lastLine &&
      lastLine.subActivityType === subActivityType &&
      lastLine.bonus === bonus &&
      lastLine.coefficient === coefficient &&
      // Group interventions by their parent ID to avoid merging different interventions
      (!intervention || (lastLine.description.includes(intervention.motif)))
    ) {
      lastLine.durationHours += durationHours;
      lastLine.total += minutePay;
      lastLine.end = nextTime;
    } else {
      lines.push({
        description,
        subActivityType,
        durationHours,
        rate: baseRate,
        coefficient,
        bonus,
        total: minutePay,
        start: currentTime,
        end: nextTime,
      });
    }

    currentTime = nextTime;
  }

  return {
    lines,
    totalAmount,
  };
};

export const calculateInterventionPay = (intervention: Intervention, user: User): number => {
    const baseRate = GRADE_RATES[user.grade];
    const activityCoefficients = user.settings?.activityCoefficients || DEFAULT_ACTIVITY_COEFFICIENTS;
    let totalAmount = 0;
    let currentTime = new Date(intervention.start);
    const endTime = new Date(intervention.end);

    while (currentTime < endTime) {
        const nextTime = new Date(currentTime.getTime() + 60 * 1000); // Process minute by minute
        
        let subActivityType: SubActivityType;
        if (isNight(currentTime)) {
          subActivityType = SubActivityType.InterventionNuit;
        } else if (isSundayOrHoliday(currentTime)) {
          subActivityType = SubActivityType.InterventionDimancheFerie;
        } else {
          subActivityType = SubActivityType.Intervention;
        }
        const coefficient = activityCoefficients[subActivityType];

        const durationMinutes = 1;
        const durationHours = durationMinutes / 60;
        const minutePay = durationHours * baseRate * coefficient;

        totalAmount += minutePay;
        currentTime = nextTime;
    }
    return totalAmount;
};