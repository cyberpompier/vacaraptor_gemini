import React, { useState, useEffect } from 'react';
import { User, UserSettings, SubActivityType } from '../types';
import { SUB_ACTIVITY_LABELS } from '../constants';

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings!);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSettings(user.settings!);
    setIsDirty(false);
  }, [user]);

  useEffect(() => {
    setIsDirty(JSON.stringify(settings) !== JSON.stringify(user.settings));
  }, [settings, user.settings]);

  const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
    const newTimeSlots = [...settings.timeSlots.gardeCS];
    newTimeSlots[index] = { ...newTimeSlots[index], [field]: value };
    setSettings(prev => ({ ...prev, timeSlots: { ...prev.timeSlots, gardeCS: newTimeSlots } }));
  };

  const handleCoefficientChange = (type: SubActivityType, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setSettings(prev => ({
        ...prev,
        activityCoefficients: { ...prev.activityCoefficients, [type]: numericValue / 100 },
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...user, settings };
    onUpdateUser(updatedUser);
    setIsDirty(false);
  };

  const handleCancel = () => {
    setSettings(user.settings!);
    setIsDirty(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Paramètres</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Time Slots Settings */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Plages Horaires</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Définissez les plages horaires où la rémunération est calculée en tant que "Garde au Centre de Secours".
              En dehors de ces plages, le taux "Astreinte au Centre de Secours" sera appliqué.
            </p>
            <div className="space-y-4">
              {settings.timeSlots.gardeCS.map((slot, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Plage {index + 1}</span>
                  <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs text-gray-500">Début</label>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                          className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-white"
                        />
                     </div>
                     <div>
                        <label className="block text-xs text-gray-500">Fin</label>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                          className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-white"
                        />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Coefficients Settings */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Taux des Activités (Coefficients)</h2>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Ajustez le coefficient de rémunération pour chaque type de sous-activité. 100% correspond au taux horaire de base de votre grade.
            </p>
            <div className="space-y-4">
              {Object.keys(SUB_ACTIVITY_LABELS).map((key) => {
                const subActivityKey = key as SubActivityType;
                const value = settings.activityCoefficients[subActivityKey];
                // Should not happen with the App.tsx merge logic, but it's a safe guard
                if (value === undefined) return null;

                return (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">{SUB_ACTIVITY_LABELS[subActivityKey]}</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={Math.round(value * 100)}
                        onChange={(e) => handleCoefficientChange(subActivityKey, e.target.value)}
                        className="block w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-900 dark:text-white"
                        min="0"
                        max="500" // Increased max for special cases
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
             {isDirty && (
               <button type="button" onClick={handleCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  Annuler
              </button>
             )}
              <button type="submit" disabled={!isDirty} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-red hover:bg-brand-red-dark disabled:bg-gray-400 disabled:cursor-not-allowed">
                  Enregistrer les modifications
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};