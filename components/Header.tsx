
import React from 'react';
import { User } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserIcon } from './icons/UserIcon';

interface HeaderProps {
  user: User;
  activeView: string;
  setActiveView: (view: 'dashboard' | 'calendar' | 'profile') => void;
}

const FirefighterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 4a1 1 0 011.8-.6l4 8a1 1 0 01-1.6 1.2l-4-8A1 1 0 017 4z" clipRule="evenodd" />
        <path d="M10.5 11a.5.5 0 00-1 0v3.5a.5.5 0 001 0V11z" />
        <path d="M10 3.5a.5.5 0 01.5.5v4a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5z" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ user, activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon },
    { id: 'profile', label: 'Profil', icon: UserIcon },
  ];

  return (
    <header className="bg-brand-dark shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
                <FirefighterIcon />
                <span className="text-white text-xl font-bold">PompierVacations</span>
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`${
                      activeView === item.id
                        ? 'bg-brand-red text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out flex items-center gap-2`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
          <div className="flex items-center">
             <div className="text-right mr-4 hidden sm:block">
                 <p className="text-sm font-medium text-white">{`${user.prenom} ${user.nom}`}</p>
                 <p className="text-xs text-gray-400">{user.grade}</p>
             </div>
             <img className="h-10 w-10 rounded-full ring-2 ring-white" src={user.avatarUrl} alt="Avatar" />
          </div>
        </div>
      </div>
       {/* Mobile Nav */}
      <nav className="md:hidden bg-gray-800">
        <div className="flex justify-around items-center px-2 pt-2 pb-3 space-x-1 sm:px-3">
             {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`${
                      activeView === item.id
                        ? 'bg-brand-red text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } flex-1 flex flex-col items-center px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out`}
                  >
                    <item.icon className="h-5 w-5 mb-1" />
                    <span>{item.label}</span>
                  </button>
                ))}
        </div>
      </nav>
    </header>
  );
};
