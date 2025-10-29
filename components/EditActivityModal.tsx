import React, { useState, useEffect } from 'react';
import { Activity, ActivityType } from '../types';

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onUpdateActivity: (activityId: string, data: Partial<Omit<Activity, 'id' | 'interventions'>>) => Promise<void>;
  onDeleteActivity: (activityId: string) => Promise<void>;
}

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DURATION_MAP: Partial<Record<ActivityType, number>> = {
  [ActivityType.G24]: 24,
  [ActivityType._12J]: 12,
  [ActivityType._12N]: 12,
  [ActivityType.AST24]: 24,
  [ActivityType.ASTJ]: 12,
  [ActivityType.ASTN]: 12,
};

export const EditActivityModal: React.FC<EditActivityModalProps> = ({ isOpen, onClose, activity, onUpdateActivity, onDeleteActivity }) => {
  const [type, setType] = useState<ActivityType>(activity.type);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [notes, setNotes] = useState(activity.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(activity.type);
      setStart(formatDateForInput(activity.start));
      setEnd(formatDateForInput(activity.end));
      setNotes(activity.notes || '');
    }
  }, [isOpen, activity]);

  useEffect(() => {
    if (!start) {
      setEnd('');
      return;
    }

    let startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return;
    }

    const defaultStartTimes: Partial<Record<ActivityType, number>> = {
      [ActivityType.G24]: 8,
      [ActivityType._12J]: 8,
      [ActivityType._12N]: 20,
      [ActivityType.ASTJ]: 8,
      [ActivityType.ASTN]: 20,
      [ActivityType.AST24]: 8,
    };
    
    const targetHour = defaultStartTimes[type];
    
    if (targetHour !== undefined) {
        if (startDate.getHours() !== targetHour || startDate.getMinutes() !== 0) {
            startDate.setHours(targetHour, 0, 0, 0);
            setStart(formatDateForInput(startDate));
            return;
        }
    }

    const durationHours = DURATION_MAP[type];
    if (durationHours) {
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
      setEnd(formatDateForInput(endDate));
    }
    // For types without a fixed duration, we don't auto-clear the end date
    // to preserve user's previous setting or manual input.
  }, [type, start]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end || new Date(start) >= new Date(end)) {
      alert("Veuillez vérifier les dates. La date de début doit être antérieure à la date de fin.");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir enregistrer ces modifications ?")) {
      setIsSaving(true);
      try {
        await onUpdateActivity(activity.id, {
          type,
          start: new Date(start),
          end: new Date(end),
          notes,
        });
        onClose();
      } catch (error) {
        console.error("Failed to update activity:", error);
        alert("La mise à jour a échoué. Veuillez réessayer.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette activité ? Cette action est irréversible.")) {
      setIsDeleting(true);
      try {
        await onDeleteActivity(activity.id);
        // La fermeture de la modale est gérée par le parent via la navigation
      } catch (error) {
        console.error("Failed to delete activity:", error);
        alert("La suppression a échoué. Veuillez réessayer.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier l'activité</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type d'activité</label>
            <select id="edit-type" value={type} onChange={(e) => setType(e.target.value as ActivityType)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white">
              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Début</label>
            <input type="datetime-local" id="edit-start" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white" />
          </div>
          <div>
            <label htmlFor="edit-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fin</label>
            <input type="datetime-local" id="edit-end" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600" disabled={!!DURATION_MAP[type]} />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optionnel)</label>
            <textarea id="edit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400">
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Annuler
              </button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark disabled:bg-gray-400">
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};