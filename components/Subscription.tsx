import React, { useState } from 'react';
import { User, SubscriptionStatus } from '../types';
import { supabase } from '../services/supabase';

// This is a placeholder for your actual Stripe publishable key.
// In a real app, this should be loaded from environment variables.
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51...'; // Replace with your key

interface SubscriptionProps {
  user: User;
}

const StatusPill: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  const statusInfo = {
    [SubscriptionStatus.TRIALING]: { text: "Période d'essai", color: 'bg-blue-100 text-blue-800' },
    [SubscriptionStatus.ACTIVE]: { text: 'Abonnement Actif', color: 'bg-green-100 text-green-800' },
    [SubscriptionStatus.ENDED]: { text: 'Abonnement Terminé', color: 'bg-red-100 text-red-800' },
  };

  const { text, color } = statusInfo[status] || { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };

  return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color}`}>{text}</span>;
};

export const Subscription: React.FC<SubscriptionProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const subscription = user.subscription!;

  const getTrialDaysLeft = () => {
    if (subscription.status !== SubscriptionStatus.TRIALING || !subscription.trialEndsAt) return 0;
    const today = new Date();
    const endDate = subscription.trialEndsAt;
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const handleSubscribeClick = async () => {
    setIsLoading(true);
    setError('');
    try {
        // This is a placeholder for your Edge Function name
        const { data, error } = await supabase.functions.invoke('createStripeCheckoutSession');

        if (error) {
            throw error;
        }

        const sessionId = data.sessionId;

        const stripe = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId });

    } catch (err) {
        console.error("Stripe Checkout Error:", err);
        setError("Impossible d'initier le paiement. Veuillez réessayer.");
        setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Abonnement</h1>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Votre Forfait Actuel</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Gérez votre abonnement et accédez à vos informations.</p>
            </div>
            <StatusPill status={subscription.status} />
          </div>

          <div className="space-y-4">
            {subscription.status === SubscriptionStatus.TRIALING && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-md">
                <h3 className="font-bold text-blue-800 dark:text-blue-200">Période d'essai en cours</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Il vous reste <span className="font-bold">{getTrialDaysLeft()} jours</span> pour profiter de toutes les fonctionnalités. 
                  Abonnez-vous dès maintenant pour ne rien manquer !
                </p>
              </div>
            )}
            {subscription.status === SubscriptionStatus.ENDED && (
                 <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
                    <h3 className="font-bold text-red-800 dark:text-red-200">Votre accès est limité</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Votre période d'essai ou votre abonnement a expiré. Pour continuer à utiliser l'application, veuillez vous abonner.
                    </p>
                </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Passez à l'abonnement complet</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Pour seulement <strong>2€ par mois</strong>, continuez à suivre vos gardes, calculer vos revenus et bien plus encore, sans interruption.
                </p>

                <div className="mt-6">
                    <button
                        onClick={handleSubscribeClick}
                        disabled={isLoading || subscription.status === SubscriptionStatus.ACTIVE}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm bg-brand-red text-white text-base font-medium hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Chargement..." : "S'abonner pour 2€/mois"}
                    </button>
                    {subscription.status === SubscriptionStatus.ACTIVE && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                            Merci ! Votre abonnement est déjà actif.
                        </p>
                    )}
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-bold">Note importante :</p>
                    <p>Pour que le paiement fonctionne, une Cloud Function Firebase nommée `createStripeCheckoutSession` doit être déployée. Elle doit créer une session de paiement Stripe et retourner son ID. La gestion des webhooks Stripe est également nécessaire pour mettre à jour le statut de l'abonnement de l'utilisateur dans Firestore après un paiement réussi.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
