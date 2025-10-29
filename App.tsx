import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActivityDetail } from './components/ActivityDetail';
import { Planning } from './components/Planning';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { auth, db } from './services/firebase';
import { Activity, User, ActivityStatus, Intervention, Grade, UserSettings } from './types';
import { DEFAULT_ACTIVITY_COEFFICIENTS, DEFAULT_TIME_SLOTS } from './constants';
import { BottomNav } from './components/BottomNav';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'profile' | 'settings'>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    let activitiesUnsubscribe: () => void | undefined;

    const authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = db.collection('users').doc(firebaseUser.uid);
        const docSnap = await userRef.get();

        if (docSnap.exists) {
          let userData = docSnap.data() as User;
          
          // Ensure settings are present and complete by merging with defaults.
          // This allows adding new settings options for existing users without overwriting their choices.
          // FIX: Use optional chaining to safely access settings properties that may not exist on older user documents.
          const mergedSettings: UserSettings = {
            timeSlots: userData.settings?.timeSlots || DEFAULT_TIME_SLOTS,
            activityCoefficients: {
              ...DEFAULT_ACTIVITY_COEFFICIENTS,
              ...(userData.settings?.activityCoefficients || {}),
            },
          };
          userData.settings = mergedSettings;
          
          setUser(userData);
        } else {
          const newUser: User = {
            id: firebaseUser.uid,
            nom: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Utilisateur',
            prenom: firebaseUser.displayName?.split(' ')[0] || 'Nouveau',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200`,
            grade: Grade.Sapeur,
            caserne: 'CS-Principal',
            settings: { // Add default settings for new user
              timeSlots: DEFAULT_TIME_SLOTS,
              activityCoefficients: DEFAULT_ACTIVITY_COEFFICIENTS,
            }
          };
          await userRef.set(newUser);
          setUser(newUser);
        }
        
        // Fetch user's activities in real-time
        activitiesUnsubscribe = db.collection('users').doc(firebaseUser.uid).collection('activities').orderBy('start', 'asc')
          .onSnapshot(snapshot => {
            const userActivities = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                start: data.start.toDate(),
                end: data.end.toDate(),
                interventions: data.interventions.map((inter: any) => ({
                  ...inter,
                  start: inter.start.toDate(),
                  end: inter.end.toDate(),
                }))
              } as Activity;
            });
            setActivities(userActivities);
          });

      } else {
        if (activitiesUnsubscribe) {
          activitiesUnsubscribe();
        }
        setUser(null);
        setActivities([]);
      }
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (activitiesUnsubscribe) {
        activitiesUnsubscribe();
      }
    };
  }, []);
  
  // Effect to update selectedActivity when activities list changes
  useEffect(() => {
      if(selectedActivity) {
          const updatedActivity = activities.find(a => a.id === selectedActivity.id);
          setSelectedActivity(updatedActivity || null);
      }
  }, [activities, selectedActivity]);

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleBack = () => {
    setSelectedActivity(null);
  };

  const handleSetActiveView = (view: 'dashboard' | 'calendar' | 'profile' | 'settings') => {
    setSelectedActivity(null);
    setActiveView(view);
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    if (user) {
        const { id, ...dataToUpdate } = updatedUser;
        const userRef = db.collection('users').doc(id);
        await userRef.update(dataToUpdate);
        setUser(updatedUser); // Update local state immediately for a responsive UI
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  }

  const handleAddActivity = async (newActivityData: Omit<Activity, 'id' | 'status' | 'interventions'>) => {
    if (!user) return;
    
    const activityToSave = {
        ...newActivityData,
        start: firebase.firestore.Timestamp.fromDate(newActivityData.start),
        end: firebase.firestore.Timestamp.fromDate(newActivityData.end),
        status: ActivityStatus.Saisie,
        interventions: [],
    };
    
    await db.collection('users').doc(user.id).collection('activities').add(activityToSave);
    setCurrentCalendarDate(newActivityData.start);
  };

  const handleAddIntervention = async (activityId: string, interventionData: Omit<Intervention, 'id'>) => {
    if (!user) return;

    const newIntervention = {
        ...interventionData,
        id: `inter-${Date.now()}`,
        start: firebase.firestore.Timestamp.fromDate(interventionData.start),
        end: firebase.firestore.Timestamp.fromDate(interventionData.end),
    };

    const activityRef = db.collection('users').doc(user.id).collection('activities').doc(activityId);
    
    await activityRef.update({
        interventions: firebase.firestore.FieldValue.arrayUnion(newIntervention)
    });
  };

  const handleUpdateActivity = async (activityId: string, updatedData: Partial<Omit<Activity, 'id' | 'interventions'>>) => {
    if (!user) throw new Error("Utilisateur non connecté.");
    
    const dataToSave: { [key: string]: any } = { ...updatedData };
    if (updatedData.start) {
      dataToSave.start = firebase.firestore.Timestamp.fromDate(updatedData.start);
    }
    if (updatedData.end) {
      dataToSave.end = firebase.firestore.Timestamp.fromDate(updatedData.end);
    }

    const activityRef = db.collection('users').doc(user.id).collection('activities').doc(activityId);
    
    try {
      await activityRef.update(dataToSave);
    } catch (error) {
      console.error("Error updating activity:", error);
      throw new Error("La mise à jour de l'activité a échoué.");
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!user) throw new Error("Utilisateur non connecté.");
    
    const activityRef = db.collection('users').doc(user.id).collection('activities').doc(activityId);
    
    try {
      await activityRef.delete();
      setSelectedActivity(null);
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw new Error("La suppression de l'activité a échoué.");
    }
  };


  const renderContent = () => {
    if (selectedActivity) {
      return <ActivityDetail 
                activity={selectedActivity} 
                user={user!} 
                onBack={handleBack} 
                onAddIntervention={handleAddIntervention}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
             />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={user!} activities={activities} onSelectActivity={handleSelectActivity} />;
      case 'calendar':
        return <Planning 
                    activities={activities} 
                    onSelectActivity={handleSelectActivity} 
                    onAddActivity={handleAddActivity}
                    currentDate={currentCalendarDate}
                    setCurrentDate={setCurrentCalendarDate}
                />;
      case 'profile':
        return <Profile user={user!} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      case 'settings':
        return <Settings user={user!} onUpdateUser={handleUpdateUser} />;
      default:
        return <Dashboard user={user!} activities={activities} onSelectActivity={handleSelectActivity} />;
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-brand-dark"><div className="text-white">Chargement...</div></div>;
  }

  if (!user) {
    return <Login />;
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-brand-dark">
        <Header user={user} activeView={activeView} setActiveView={handleSetActiveView} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {renderContent()}
        </main>
        <BottomNav activeView={activeView} setActiveView={handleSetActiveView} />
    </div>
  );
};

export default App;
