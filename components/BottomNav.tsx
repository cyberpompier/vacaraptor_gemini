import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserIcon } from './icons/UserIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface BottomNavProps {
  activeView: string;
  setActiveView: (view: 'dashboard' | 'calendar' | 'profile' | 'settings') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon },
    { id: 'profile', label: 'Profil', icon: UserIcon },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
      <div className="flex justify-around items-center px-2 pt-2 pb-3 space-x-1 sm:px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={`flex-1 flex flex-col items-center px-3 py-1 rounded-md text-xs font-medium transition duration-150 ease-in-out ${
              activeView === item.id
                ? 'text-brand-red dark:text-white'
                : 'text-gray-500 dark:text-gray-300 hover:text-brand-red dark:hover:text-white'
            }`}
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};