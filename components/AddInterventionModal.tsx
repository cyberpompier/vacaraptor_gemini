import React, { useState, useEffect } from 'react';
import { Intervention } from '../types';

interface AddInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIntervention: (intervention: Omit<Intervention, 'id'>) => void;
  activityStart: Date;
  activityEnd: Date;
}

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const MOTIF_OPTIONS = ['AVP', 'SAP', 'INC', 'DIV'];

export const AddInterventionModal: React.FC<AddInterventionModalProps> = ({ isOpen, onClose, onAddIntervention, activityStart, activityEnd }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [motif, setMotif] = useState(MOTIF_OPTIONS[0]);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill with activity start time when modal opens
      setStart(formatDateForInput(activityStart));
      setEnd(''); // Will be set by the effect below
      setMotif(MOTIF_OPTIONS[0]); // Default to first option
    }
  }, [isOpen, activityStart]);

  // Automatically set end time to be at least 1 hour after start time
  useEffect(() => {
    if (start) {
      const startDate = new Date(start);
      if (!isNaN(startDate.getTime())) {
        const minEndDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
        // If the calculated end time exceeds the activity boundary, clamp it.
        const newEndDate = minEndDate > activityEnd ? activityEnd : minEndDate;
        setEnd(formatDateForInput(newEndDate));
      }
    }
  }, [start, activityEnd]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!start || !end || !motif) {
      alert("Veuillez remplir tous les champs.");
      return;
    }
    if (startDate >= endDate) {
      alert("La date de début doit être antérieure à la date de fin.");
      return;
    }

    if (startDate < activityStart || endDate > activityEnd) {
      alert("L'intervention doit avoir lieu pendant la durée de l'activité.");
      return;
    }

    onAddIntervention({
      start: startDate,
      end: endDate,
      motif,
    });
    
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajouter une intervention</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="motif" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Motif de l'intervention
            </label>
            <select
              id="motif"
              name="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
              required
            >
              {MOTIF_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="inter-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Début
            </label>
            <input
              type="datetime-local"
              id="inter-start"
              name="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              min={formatDateForInput(activityStart)}
              max={formatDateForInput(activityEnd)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="inter-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fin
            </label>
            <input
              type="datetime-local"
              id="inter-end"
              name="end"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={start || formatDateForInput(activityStart)}
              max={formatDateForInput(activityEnd)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-red focus:border-brand-red sm:text-sm text-gray-900 dark:text-white"
              required
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
              Ajouter l'intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};