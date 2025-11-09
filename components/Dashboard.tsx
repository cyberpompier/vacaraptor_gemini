
import React, { useState, useMemo, useEffect } from 'react';
import { Activity, User, Intervention, ActivityType } from '../types';
import { calculateActivityPay, calculateInterventionPay } from '../services/calculationService';
import { InterventionListModal } from './InterventionListModal';
import { supabase } from '../services/supabase';

interface DashboardProps {
  user: User;
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

const StatCard: React.FC<{ title: string; value: string; details: string; onClick?: () => void; isClickable?: boolean; }> = ({ title, value, details, onClick, isClickable }) => (
  <div 
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-transform transform hover:scale-105 ${isClickable ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    >
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    <p className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{details}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, activities, onSelectActivity }) => {
  const [period, setPeriod] = useState('month');
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [overlappingUsers, setOverlappingUsers] = useState<User[]>([]);
  const [isLoadingOverlaps, setIsLoadingOverlaps] = useState(false);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    return activities.filter(act => {
      if (period === 'month') {
        return act.start.getMonth() === now.getMonth() && act.start.getFullYear() === now.getFullYear();
      }
      // Add more periods if needed
      return true;
    });
  }, [activities, period]);

  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let totalHours = 0;
    let interventionCount = 0;
    const monthlyInterventions: (Intervention & { activityType: ActivityType; revenue: number; })[] = [];
    
    filteredActivities.forEach(activity => {
      const result = calculateActivityPay(activity, user);
      totalRevenue += result.totalAmount;
      totalHours += (activity.end.getTime() - activity.start.getTime()) / (1000 * 60 * 60);
      interventionCount += activity.interventions.length;
      activity.interventions.forEach(inter => {
        const revenue = calculateInterventionPay(inter, user);
        monthlyInterventions.push({ ...inter, activityType: activity.type, revenue });
      });
    });

    monthlyInterventions.sort((a, b) => b.start.getTime() - a.start.getTime());

    return {
      revenue: totalRevenue.toFixed(2),
      hours: totalHours.toFixed(1),
      guards: filteredActivities.length,
      interventions: interventionCount,
      monthlyInterventions,
    };
  }, [filteredActivities, user]);
  
  const upcomingActivity = useMemo(() => {
      const now = new Date();
      return activities
        .filter(act => act.start > now)
        .sort((a,b) => a.start.getTime() - b.start.getTime())[0];
  }, [activities]);

  useEffect(() => {
    const fetchOverlappingUsers = async () => {
        if (!upcomingActivity || !user) {
            setOverlappingUsers([]);
            return;
        }

        setIsLoadingOverlaps(true);
        try {
            // 1. Get users from the same station, excluding the current user.
            const { data: stationUsers, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('caserne', user.caserne)
                .neq('id', user.id);

            if (usersError) throw usersError;
            if (!stationUsers || stationUsers.length === 0) {
                setOverlappingUsers([]);
                setIsLoadingOverlaps(false);
                return;
            }

            // 2. For each user, check for overlapping activities.
            const overlapPromises = stationUsers.map(async (stationUser) => {
                const { data: activities, error: activitiesError } = await supabase
                    .from('activities')
                    .select('id')
                    .eq('user_id', stationUser.id)
                    // An activity overlaps if its start is before the upcoming one ends
                    .lt('start', upcomingActivity.end.toISOString())
                    // AND its end is after the upcoming one starts.
                    .gt('end', upcomingActivity.start.toISOString())
                    .limit(1); // We only need to know if at least one exists.

                if (activitiesError) {
                    console.error(`Error fetching activities for user ${stationUser.id}:`, activitiesError);
                    return null;
                }

                return activities && activities.length > 0 ? stationUser : null;
            });

            const results = await Promise.all(overlapPromises);
            const overlapping = results.filter((u): u is User => u !== null);
            
            setOverlappingUsers(overlapping);

        } catch (error) {
            console.error("Error fetching overlapping users:", error);
            setOverlappingUsers([]);
        } finally {
            setIsLoadingOverlaps(false);
        }
    };

    fetchOverlappingUsers();
  }, [upcomingActivity, user]);


  const formatDate = (date: Date) => {
    return date.toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <InterventionListModal 
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        interventions={dashboardStats.monthlyInterventions}
      />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard du mois</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Revenu du mois" value={`€${dashboardStats.revenue}`} details="Calculé sur les gardes" />
        <StatCard title="Heures cumulées" value={`${dashboardStats.hours} h`} details="Toutes activités" />
        <StatCard title="Gardes" value={String(dashboardStats.guards)} details="Ce mois-ci" />
        <StatCard 
            title="Interventions" 
            value={String(dashboardStats.interventions)} 
            details="Dans vos gardes" 
            isClickable={dashboardStats.interventions > 0}
            onClick={dashboardStats.interventions > 0 ? () => setIsInterventionModalOpen(true) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Activités Récentes</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durée</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenu Estimé</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredActivities.slice(0, 5).map(act => {
                            const duration = ((act.end.getTime() - act.start.getTime()) / (1000 * 60 * 60)).toFixed(1);
                            const revenue = calculateActivityPay(act, user).totalAmount.toFixed(2);
                            return (
                                <tr key={act.id} onClick={() => onSelectActivity(act)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{act.type}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{act.start.toLocaleDateString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{duration}h</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-semibold">€{revenue}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">Prochaine Activité</h2>
            {upcomingActivity ? (
                 <div className="space-y-4 flex flex-col h-full">
                    <div>
                        <p className="text-base sm:text-lg font-bold text-brand-red">{upcomingActivity.type}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                            <span className="font-semibold">Début:</span> {formatDate(upcomingActivity.start)}
                        </p>
                         <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Fin:</span> {formatDate(upcomingActivity.end)}
                        </p>
                    </div>

                    <div className="py-2 min-h-[60px]">
                        {isLoadingOverlaps ? (
                            <div className="h-8 flex items-center">
                                <p className="text-xs text-gray-400 animate-pulse">Recherche de collègues...</p>
                            </div>
                        ) : overlappingUsers.length > 0 ? (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Avec vous sur cette garde :</p>
                                <div className="flex items-center">
                                    {overlappingUsers.map((ou, index) => (
                                        <img
                                            key={ou.id}
                                            className={`h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 ${index > 0 ? '-ml-2' : ''}`}
                                            src={ou.avatarUrl}
                                            alt={`${ou.prenom} ${ou.nom}`}
                                            title={`${ou.prenom} ${ou.nom}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex-grow flex items-end">
                        <button 
                            onClick={() => onSelectActivity(upcomingActivity)}
                            className="w-full bg-brand-red text-white py-2 rounded-lg hover:bg-brand-red-dark transition"
                        >
                            Voir les détails
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Aucune activité planifiée.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
