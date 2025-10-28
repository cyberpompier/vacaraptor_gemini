import React, { useMemo, useState } from 'react';
// FIX: Imported ActivityStatus to use enum member for comparison instead of a magic string.
import { Activity, User, CalculationLine, ActivityStatus, Intervention, SubActivityType } from '../types';
import { calculateActivityPay } from '../services/calculationService';
import { AddInterventionModal } from './AddInterventionModal';

interface ActivityDetailProps {
  activity: Activity;
  user: User;
  onBack: () => void;
  onAddIntervention: (activityId: string, interventionData: Omit<Intervention, 'id'>) => void;
}

const InfoPill: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex flex-col bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ${className}`}>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
);

const CalculationRow: React.FC<{ line: CalculationLine }> = ({ line }) => (
    <tr className={`border-b border-gray-200 dark:border-gray-700 ${line.subActivityType === SubActivityType.Intervention ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
        <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
            {line.description}
            <div className="text-xs text-gray-500">{line.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {line.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </td>
        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 text-center">{(line.durationHours).toFixed(2)}h</td>
        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 text-center">€{line.rate.toFixed(2)}</td>
        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 text-center">{line.coefficient * 100}%</td>
        <td className="p-3 text-sm text-gray-700 dark:text-gray-300 text-center">{line.bonus > 1 ? `x${line.bonus.toFixed(1)}` : '-'}</td>
        <td className="p-3 text-sm font-semibold text-gray-900 dark:text-white text-right">€{line.total.toFixed(2)}</td>
    </tr>
);

export const ActivityDetail: React.FC<ActivityDetailProps> = ({ activity, user, onBack, onAddIntervention }) => {
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const calculationResult = useMemo(() => calculateActivityPay(activity, user), [activity, user]);
  const totalDuration = (activity.end.getTime() - activity.start.getTime()) / (1000 * 60 * 60);

  const handleAddIntervention = (interventionData: Omit<Intervention, 'id'>) => {
    onAddIntervention(activity.id, interventionData);
    setIsInterventionModalOpen(false);
  };
  
  const canAddIntervention = new Date() >= activity.start;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AddInterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onAddIntervention={handleAddIntervention}
        activityStart={activity.start}
        activityEnd={activity.end}
      />
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 text-brand-red dark:text-white hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Retour
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{activity.type}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{activity.start.toLocaleString([], { dateStyle: 'long' })}</p>
                </div>
                 <div className="flex items-center gap-4">
                    {canAddIntervention && (
                      <button 
                          onClick={() => setIsInterventionModalOpen(true)}
                          className="px-4 py-2 border border-brand-red text-brand-red dark:border-white dark:text-white text-sm font-medium rounded-md hover:bg-brand-red/10 dark:hover:bg-white/10 transition whitespace-nowrap"
                      >
                          Intervention
                      </button>
                    )}
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${activity.status === ActivityStatus.Facturee ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{activity.status}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoPill label="Début" value={activity.start.toLocaleTimeString([], {timeStyle: 'short'})} />
                <InfoPill label="Fin" value={activity.end.toLocaleTimeString([], {timeStyle: 'short'})} />
                <InfoPill label="Durée totale" value={`${totalDuration.toFixed(2)}h`} />
                <InfoPill label="Interventions" value={String(activity.interventions.length)} />
            </div>
            {activity.notes && <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 italic">Notes: {activity.notes}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Détail du calcul</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-3 text-xs font-medium text-left text-gray-500 dark:text-gray-300 uppercase">Description</th>
                            <th className="p-3 text-xs font-medium text-center text-gray-500 dark:text-gray-300 uppercase">Durée</th>
                            <th className="p-3 text-xs font-medium text-center text-gray-500 dark:text-gray-300 uppercase">Taux/h</th>
                            <th className="p-3 text-xs font-medium text-center text-gray-500 dark:text-gray-300 uppercase">Coeff.</th>
                            <th className="p-3 text-xs font-medium text-center text-gray-500 dark:text-gray-300 uppercase">Bonus</th>
                            <th className="p-3 text-xs font-medium text-right text-gray-500 dark:text-gray-300 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calculationResult.lines.map((line, index) => <CalculationRow key={index} line={line} />)}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                            <td colSpan={5} className="p-4 text-right text-gray-800 dark:text-white">Total de la vacation</td>
                            <td className="p-4 text-right text-lg text-brand-red">€{calculationResult.totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};