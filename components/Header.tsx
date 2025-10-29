import React, { useState } from 'react';
import { User } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserIcon } from './icons/UserIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
  user: User;
  activeView: string;
  setActiveView: (view: 'dashboard' | 'calendar' | 'profile' | 'settings') => void;
}

const MenuIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ user, activeView, setActiveView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'calendar', label: 'Planning', icon: CalendarIcon },
    { id: 'profile', label: 'Profil', icon: UserIcon },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const handleNavClick = (view: 'dashboard' | 'calendar' | 'profile' | 'settings') => {
    setActiveView(view);
    setIsMenuOpen(false);
  }

  return (
    <>
      <header className="bg-brand-dark shadow-lg flex-shrink-0 relative z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                  <img src="/vacaraptor-logo.png" alt="VACARAPTOR Logo" className="h-10 w-auto" />
                  <span className="text-white text-xl font-bold">VACARAPTOR</span>
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
               <div className="ml-3 md:hidden">
                 <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  aria-controls="mobile-menu" 
                  aria-expanded={isMenuOpen}
                 >
                   <span className="sr-only">Ouvrir le menu principal</span>
                   {isMenuOpen ? <XIcon /> : <MenuIcon />}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ease-in-out"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed top-0 right-0 h-full w-72 bg-brand-dark shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-white text-lg font-bold">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <span className="sr-only">Fermer le menu</span>
              <XIcon />
            </button>
          </div>
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as any)}
                className={`flex items-center p-3 rounded-lg w-full text-left transition duration-150 ease-in-out ${
                  activeView === item.id
                    ? 'bg-brand-red text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="text-base font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};