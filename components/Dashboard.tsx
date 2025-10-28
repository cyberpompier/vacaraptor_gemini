
import React, { useState, useMemo } from 'react';
import { Activity, User, Intervention, ActivityType } from '../types';
import { calculateActivityPay, calculateInterventionPay } from '../services/calculationService';
import { InterventionListModal } from './InterventionListModal';

interface DashboardProps {
  user: User;
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

const StatCard: React.FC<{ title: string; value: string; details: string; onClick?: () => void; isClickable?: boolean; }> = ({ title, value, details, onClick, isClickable }) => (
  <div 
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-transform transform hover:scale-105 ${isClickable ? 'cursor-pointer' : ''}`}
    onClick={onClick}
    >
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{details}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, activities, onSelectActivity }) => {
  const [period, setPeriod] = useState('month');
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <InterventionListModal 
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        interventions={dashboardStats.monthlyInterventions}
      />
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard du mois</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenu du mois" value={`€${dashboardStats.revenue}`} details="Calculé sur les gardes validées" />
        <StatCard title="Heures cumulées" value={`${dashboardStats.hours} h`} details="Toutes activités confondues" />
        <StatCard title="Gardes effectuées" value={String(dashboardStats.guards)} details="Ce mois-ci" />
        <StatCard 
            title="Interventions" 
            value={String(dashboardStats.interventions)} 
            details="Dans vos gardes" 
            isClickable={dashboardStats.interventions > 0}
            onClick={dashboardStats.interventions > 0 ? () => setIsInterventionModalOpen(true) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activités Récentes</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durée</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenu Estimé</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredActivities.slice(0, 5).map(act => {
                            const duration = ((act.end.getTime() - act.start.getTime()) / (1000 * 60 * 60)).toFixed(1);
                            const revenue = calculateActivityPay(act, user).totalAmount.toFixed(2);
                            return (
                                <tr key={act.id} onClick={() => onSelectActivity(act)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{act.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{act.start.toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{duration}h</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right font-semibold">€{revenue}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Prochaine Activité</h2>
            {upcomingActivity ? (
                 <div className="space-y-4 flex flex-col h-full">
                    <div>
                        <p className="text-lg font-bold text-brand-red">{upcomingActivity.type}</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-2">
                            <span className="font-semibold">Début:</span> {formatDate(upcomingActivity.start)}
                        </p>
                         <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Fin:</span> {formatDate(upcomingActivity.end)}
                        </p>
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
