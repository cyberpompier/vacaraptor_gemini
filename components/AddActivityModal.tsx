import React, { useState, useEffect } from 'react';
import { Activity, ActivityType } from '../types';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activity: Omit<Activity, 'id' | 'status' | 'interventions'>) => void;
}

const DURATION_MAP: Partial<Record<ActivityType, number>> = {
  [ActivityType.G24]: 24,
  [ActivityType._12J]: 12,
  [ActivityType._12N]: 12,
  [ActivityType.AST24]: 24,
  // Assuming ASTJ/ASTN are also 12h, can be adjusted
  [ActivityType.ASTJ]: 12, 
  [ActivityType.ASTN]: 12, 
};

// Helper to format a Date object into a string suitable for a datetime-local input
const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AddActivityModal: React.FC<AddActivityModalProps> = ({ isOpen, onClose, onAddActivity }) => {
  const [type, setType] = useState<ActivityType>(ActivityType.G24);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [notes, setNotes] = useState('');

  // Effect to manage form state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      // When the modal opens, pre-fill the start time to now.
      // This will trigger the other useEffect to adjust the time and calculate the end date.
      const now = new Date();
      now.setSeconds(0, 0); // Clean up seconds for the input
      setStart(formatDateForInput(now));
    } else {
      // When the modal closes, reset the form for the next time it's opened.
      setType(ActivityType.G24);
      setStart('');
      setEnd('');
      setNotes('');
    }
  }, [isOpen]);


  useEffect(() => {
    // If there's no start date, we can't do anything.
    if (!start) {
      setEnd('');
      return;
    }

    let startDate = new Date(start);
    // If the date string is invalid, exit.
    if (isNaN(startDate.getTime())) {
        return;
    }

    // Define default start times for certain activity types to improve user experience
    const defaultStartTimes: Partial<Record<ActivityType, number>> = {
        [ActivityType.G24]: 8,  // 8:00 AM
        [ActivityType._12J]: 8,  // 8:00 AM
        [ActivityType._12N]: 20, // 8:00 PM
        [ActivityType.ASTJ]: 8,  // 8:00 AM
        [ActivityType.ASTN]: 20, // 8:00 PM
    };
    
    const targetHour = defaultStartTimes[type];
    
    // Adjust the start time if the user has selected a type with a default start time
    // and the current input time doesn't match.
    if (targetHour !== undefined && (startDate.getHours() !== targetHour || startDate.getMinutes() !== 0)) {
        startDate.setHours(targetHour, 0, 0, 0);
        
        // This updates the input field and re-triggers the effect.
        // The next run will have the correct time, preventing an infinite loop.
        setStart(formatDateForInput(startDate));
        return; // We'll calculate the end time on the next run with the corrected start time.
    }

    // Calculate the end time based on the activity's fixed duration
    const durationHours = DURATION_MAP[type];
    if (durationHours) {
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
      setEnd(formatDateForInput(endDate));
    } else {
      // If the activity type has no fixed duration (e.g., Formation), clear the end time
      // to let the user input it manually.
      setEnd('');
    }
  }, [type, start]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || new Date(start) >= new Date(end)) {
      alert("Veuillez vérifier les dates. La date de début doit être antérieure à la date de fin.");
      return;
    }
    
    onAddActivity({
      type,
      start: new Date(start),
      end: new Date(end),
      notes,
    });
    
    // Close the modal. The form state will be reset by the useEffect that listens to `isOpen`.
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter une nouvelle activité</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type d'activité
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
            >
              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Début
            </label>
            <input
              type="datetime-local"
              id="start"
              name="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fin
            </label>
            <input
              type="datetime-local"
              id="end"
              name="end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              disabled={!!DURATION_MAP[type]}
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (optionnel)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark"
            >
              Ajouter l'activité
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
