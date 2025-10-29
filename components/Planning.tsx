import React, { useState } from 'react';
import { Activity, ActivityType } from '../types';
import { AddActivityModal } from './AddActivityModal';

interface PlanningProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onAddActivity: (activity: Omit<Activity, 'id' | 'status' | 'interventions'>) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

// Helper functions for calendar generation
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => (new Date(year, month, 1).getDay() + 6) % 7; // 0=Monday

const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  [ActivityType.G24]: 'bg-red-500 text-white',
  [ActivityType._12J]: 'bg-orange-500 text-white',
  [ActivityType._12N]: 'bg-indigo-500 text-white',
  [ActivityType.GardeLibre]: 'bg-purple-500 text-white',
  [ActivityType.Formation]: 'bg-blue-500 text-white',
  [ActivityType.AST24]: 'bg-yellow-500 text-black',
  [ActivityType.ASTJ]: 'bg-yellow-400 text-black',
  [ActivityType.ASTN]: 'bg-yellow-600 text-white',
};

export const Planning: React.FC<PlanningProps> = ({ activities, onSelectActivity, onAddActivity, currentDate, setCurrentDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getActivitiesForDay = (day: number) => {
    return activities.filter(act => {
      const actDate = act.start;
      return actDate.getFullYear() === year && actDate.getMonth() === month && actDate.getDate() === day;
    }).sort((a,b) => a.start.getTime() - b.start.getTime());
  };
  
  const today = new Date();
  const isToday = (day: number) => {
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AddActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddActivity={onAddActivity} />
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
                 <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Mois précédent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                 </button>
                 <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Mois suivant">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                 </button>
            </div>
             <button onClick={goToToday} className="hidden sm:block px-3 py-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                Aujourd'hui
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-brand-red text-white text-sm font-medium rounded-md hover:bg-brand-red-dark transition whitespace-nowrap">
            Ajouter une activité
          </button>
        </div>
        
        <div className="grid grid-cols-7">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">{day}</div>
            ))}
        </div>

        <div className="grid grid-cols-7 grid-rows-5">
          {blanks.map(b => <div key={`blank-${b}`} className="border-r border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 min-h-[120px]"></div>)}
          {days.map((day, index) => {
            const dayActivities = getActivitiesForDay(day);
            const dayOfWeek = (firstDay + index) % 7;
            return (
              <div key={day} className={`relative p-1 sm:p-2 border-t border-r border-gray-200 dark:border-gray-700 min-h-[120px] ${dayOfWeek === 6 ? 'border-r-0' : ''}`}>
                <span className={`flex items-center justify-center h-6 w-6 text-sm font-medium rounded-full ${isToday(day) ? 'bg-brand-red text-white' : 'text-gray-900 dark:text-white'}`}>
                    {day}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-24">
                    {dayActivities.map(act => (
                        <div 
                            key={act.id}
                            onClick={() => onSelectActivity(act)}
                            className={`p-1 rounded text-[10px] sm:text-xs truncate cursor-pointer hover:opacity-80 transition ${ACTIVITY_TYPE_COLORS[act.type]}`}
                            title={`${act.type} - ${act.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                        >
                            <span className="font-semibold">{act.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> <span className="hidden sm:inline">{act.type.split('(')[0]}</span>
                        </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};