
import { Activity, User, Intervention, SubActivityType, CalculationResult, CalculationLine } from '../types';
import { GRADE_RATES, ACTIVITY_COEFFICIENTS, NIGHT_BONUS, SUNDAY_HOLIDAY_BONUS } from '../constants';

const isNight = (date: Date): boolean => {
  const hour = date.getHours();
  return hour >= 22 || hour < 7;
};

const isSundayOrHoliday = (date: Date): boolean => {
  // Simplified: only checks for Sunday. A real implementation would need a list of public holidays.
  return date.getDay() === 0;
};

const getSubActivityTypeForShift = (date: Date, activity: Activity): SubActivityType => {
  const isAstreinteType = activity.type.startsWith('Astreinte');
  if (isAstreinteType) return SubActivityType.AstreinteDomicile;
  if (activity.type === "Formation") return SubActivityType.Formation;

  const hour = date.getHours();
  if ((hour >= 8 && hour < 12) || (hour >= 14 && hour < 18)) {
    return SubActivityType.GardeCS;
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

  let currentTime = new Date(activity.start);
  const endTime = new Date(activity.end);

  while (currentTime < endTime) {
    const nextTime = new Date(currentTime.getTime() + 60 * 1000); // Process minute by minute

    const intervention = findIntervention(currentTime, activity.interventions);
    let subActivityType: SubActivityType;
    let coefficient: number;
    let bonus = 1.0;
    let description: string;
    
    if (intervention) {
      subActivityType = SubActivityType.Intervention;
      coefficient = ACTIVITY_COEFFICIENTS[SubActivityType.Intervention];
      description = `Intervention (${intervention.motif})`;
      const isNightTime = isNight(currentTime);
      const isSundayTime = isSundayOrHoliday(currentTime);
      if (isNightTime && isSundayTime) {
          bonus = Math.max(NIGHT_BONUS, SUNDAY_HOLIDAY_BONUS);
      } else if (isNightTime) {
          bonus = NIGHT_BONUS;
      } else if (isSundayTime) {
          bonus = SUNDAY_HOLIDAY_BONUS;
      }
    } else {
      subActivityType = getSubActivityTypeForShift(currentTime, activity);
      coefficient = ACTIVITY_COEFFICIENTS[subActivityType];
      description = subActivityType;
    }
    
    const durationMinutes = 1;
    const durationHours = durationMinutes / 60;
    const minutePay = durationHours * baseRate * coefficient * bonus;

    totalAmount += minutePay;

    const lastLine = lines[lines.length - 1];
    if (
      lastLine &&
      lastLine.subActivityType === subActivityType &&
      lastLine.bonus === bonus &&
      lastLine.coefficient === coefficient
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
    let totalAmount = 0;
    let currentTime = new Date(intervention.start);
    const endTime = new Date(intervention.end);

    while (currentTime < endTime) {
        const nextTime = new Date(currentTime.getTime() + 60 * 1000); // Process minute by minute

        const coefficient = ACTIVITY_COEFFICIENTS[SubActivityType.Intervention];
        let bonus = 1.0;

        const isNightTime = isNight(currentTime);
        const isSundayTime = isSundayOrHoliday(currentTime);

        if (isNightTime && isSundayTime) {
            bonus = Math.max(NIGHT_BONUS, SUNDAY_HOLIDAY_BONUS);
        } else if (isNightTime) {
            bonus = NIGHT_BONUS;
        } else if (isSundayTime) {
            bonus = SUNDAY_HOLIDAY_BONUS;
        }

        const durationMinutes = 1;
        const durationHours = durationMinutes / 60;
        const minutePay = durationHours * baseRate * coefficient * bonus;

        totalAmount += minutePay;
        currentTime = nextTime;
    }
    return totalAmount;
};
