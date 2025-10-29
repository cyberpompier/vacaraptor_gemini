
import React from 'react';
import { User } from '../types';
import { CreditCardIcon } from './icons/CreditCardIcon';

interface PaywallProps {
  user: User;
  setActiveView: (view: 'subscription') => void;
}

export const Paywall: React.FC<PaywallProps> = ({ user, setActiveView }) => {
  const trialEndsAt = user.subscription?.trialEndsAt;
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const title = daysLeft > 0 ? "Fin de la période d'essai" : "Abonnement requis";
  const message = daysLeft > 0 
    ? `Votre période d'essai se termine le ${trialEndsAt?.toLocaleDateString('fr-FR')}. Abonnez-vous pour continuer à utiliser toutes les fonctionnalités sans interruption.`
    : "Votre période d'essai est terminée ou votre abonnement a expiré. Pour continuer, veuillez vous abonner.";

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center h-full">
      <div className="max-w-xl mx-auto text-center bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-red text-white mb-6">
          <CreditCardIcon className="h-8 w-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          {message}
        </p>
        <div className="mt-8">
          <button
            onClick={() => setActiveView('subscription')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent rounded-lg shadow-sm bg-brand-red text-white text-base font-medium hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition"
          >
            Gérer mon abonnement
          </button>
        </div>
      </div>
    </div>
  );
};