import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActivityDetail } from './components/ActivityDetail';
import { Planning } from './components/Planning';
import { Profile } from './components/Profile';
import { MOCK_USER, MOCK_ACTIVITIES } from './constants';
import { Activity, User, ActivityStatus, Intervention } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'profile'>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  // The calendar's currently displayed date is now managed here.
  // It defaults to the current date for a better user experience.
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleBack = () => {
    setSelectedActivity(null);
  };

  const handleSetActiveView = (view: 'dashboard' | 'calendar' | 'profile') => {
    setSelectedActivity(null); // Clear selected activity when changing main views
    setActiveView(view);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Here you would typically also make an API call to save the user data
  };

  const handleAddActivity = (newActivityData: Omit<Activity, 'id' | 'status' | 'interventions'>) => {
    const newActivity: Activity = {
        ...newActivityData,
        id: `activity-${Date.now()}`,
        status: ActivityStatus.Saisie,
        interventions: [],
    };
    setActivities(prevActivities => [...prevActivities, newActivity].sort((a,b) => a.start.getTime() - b.start.getTime()));
    // Automatically navigate the calendar to the month of the newly added activity
    setCurrentCalendarDate(newActivity.start);
  };

  const handleAddIntervention = (activityId: string, interventionData: Omit<Intervention, 'id'>) => {
    const newIntervention = {
        ...interventionData,
        id: `inter-${Date.now()}`
    };

    let updatedSelectedActivity: Activity | null = null;

    const updatedActivities = activities.map(act => {
        if (act.id === activityId) {
            const updatedActivity = {
                ...act,
                interventions: [...act.interventions, newIntervention].sort((a, b) => a.start.getTime() - b.start.getTime())
            };
            updatedSelectedActivity = updatedActivity;
            return updatedActivity;
        }
        return act;
    });

    setActivities(updatedActivities);

    if (updatedSelectedActivity) {
        setSelectedActivity(updatedSelectedActivity);
    }
  };


  const renderContent = () => {
    if (selectedActivity) {
      return <ActivityDetail 
                activity={selectedActivity} 
                user={user} 
                onBack={handleBack} 
                onAddIntervention={handleAddIntervention}
             />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user} activities={activities} onSelectActivity={handleSelectActivity} />;
      case 'calendar':
        return <Planning 
                    activities={activities} 
                    onSelectActivity={handleSelectActivity} 
                    onAddActivity={handleAddActivity}
                    currentDate={currentCalendarDate}
                    setCurrentDate={setCurrentCalendarDate}
                />;
      case 'profile':
        return <Profile user={user} onUpdateUser={handleUpdateUser} />;
      default:
        return <Dashboard user={user} activities={activities} onSelectActivity={handleSelectActivity} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-brand-dark">
      <Header user={user} activeView={activeView} setActiveView={handleSetActiveView} />
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
