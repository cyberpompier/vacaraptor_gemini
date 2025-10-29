import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActivityDetail } from './components/ActivityDetail';
import { Planning } from './components/Planning';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Subscription as SubscriptionPage } from './components/Subscription';
import { Paywall } from './components/Paywall';
import { Login } from './components/Login';
import { auth, db } from './services/firebase';
import { Activity, User, ActivityStatus, Intervention, Grade, UserSettings, SubscriptionStatus } from './types';
import { DEFAULT_ACTIVITY_COEFFICIENTS, DEFAULT_TIME_SLOTS } from './constants';
import { BottomNav } from './components/BottomNav';

type View = 'dashboard' | 'calendar' | 'profile' | 'settings' | 'subscription';

// Helper function to reliably convert various types to a Date object
const ensureDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    // Already a Date object
    if (date instanceof Date) return date;
    // Handle Firestore Timestamps, which have a toDate method
    if (typeof date.toDate === 'function') {
        return date.toDate();
    }
    // Handle ISO strings or numbers (milliseconds from epoch)
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    // Return undefined if conversion fails
    return undefined;
};


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

  useEffect(() => {
    let activitiesUnsubscribe: () => void | undefined;

    const authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = db.collection('users').doc(firebaseUser.uid);
        const docSnap = await userRef.get();

        if (docSnap.exists) {
          let userData = docSnap.data() as User;
          let needsDBUpdate = false;
          
          // Initialize settings if they don't exist
          const mergedSettings: UserSettings = {
            timeSlots: userData.settings?.timeSlots || DEFAULT_TIME_SLOTS,
            activityCoefficients: {
              ...DEFAULT_ACTIVITY_COEFFICIENTS,
              ...(userData.settings?.activityCoefficients || {}),
            },
          };
          userData.settings = mergedSettings;
          
          // Initialize subscription for existing users (migration)
          if (!userData.subscription) {
              const trialEndDate = new Date();
              trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
              userData.subscription = {
                  status: SubscriptionStatus.TRIALING,
                  trialEndsAt: trialEndDate,
              };
              needsDBUpdate = true;
          }

          // Ensure subscription dates are proper Date objects
          if (userData.subscription) {
            userData.subscription.trialEndsAt = ensureDate(userData.subscription.trialEndsAt);
            userData.subscription.endsAt = ensureDate(userData.subscription.endsAt);
          }
          
          if (needsDBUpdate) {
             const dataToUpdate: any = { subscription: userData.subscription };
             if (dataToUpdate.subscription.trialEndsAt) {
                 dataToUpdate.subscription.trialEndsAt = firebase.firestore.Timestamp.fromDate(dataToUpdate.subscription.trialEndsAt);
             }
             await userRef.update(dataToUpdate);
          }

          setUser(userData);
        } else {
          // Create new user
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 14);
          const newUser: User = {
            id: firebaseUser.uid,
            nom: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Utilisateur',
            prenom: firebaseUser.displayName?.split(' ')[0] || 'Nouveau',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200`,
            grade: Grade.Sapeur,
            caserne: 'CS-Principal',
            settings: {
              timeSlots: DEFAULT_TIME_SLOTS,
              activityCoefficients: DEFAULT_ACTIVITY_COEFFICIENTS,
            },
            subscription: {
              status: SubscriptionStatus.TRIALING,
              trialEndsAt: trialEndDate,
            }
          };
          // Convert date to Timestamp for Firestore
          const newUserForFirestore = {
              ...newUser,
              subscription: {
                  ...newUser.subscription,
                  trialEndsAt: firebase.firestore.Timestamp.fromDate(trialEndDate),
              }
          }
          await userRef.set(newUserForFirestore);
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
        if (activitiesUnsubscribe) activitiesUnsubscribe();
        setUser(null);
        setActivities([]);
      }
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (activitiesUnsubscribe) activitiesUnsubscribe();
    };
  }, []);

  useEffect(() => {
      if (user && user.subscription) {
          const { status, trialEndsAt, endsAt } = user.subscription;
          const now = new Date();
          if (status === SubscriptionStatus.ACTIVE && (!endsAt || endsAt > now)) {
              setIsSubscriptionActive(true);
          } else if (status === SubscriptionStatus.TRIALING && trialEndsAt && trialEndsAt > now) {
              setIsSubscriptionActive(true);
          } else {
              setIsSubscriptionActive(false);
          }
      } else if (!user) {
          setIsSubscriptionActive(true); // Don't show paywall on login screen
      } else {
          setIsSubscriptionActive(false); // No user or subscription info
      }
  }, [user]);
  
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

  const handleSetActiveView = (view: View) => {
    setSelectedActivity(null);
    setActiveView(view);
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    if (user) {
        const { id, ...dataToUpdateAny } = updatedUser;
        const dataToUpdate = dataToUpdateAny as any;

        // Convert Dates back to Timestamps before sending to Firestore
        if (dataToUpdate.subscription?.trialEndsAt) {
            dataToUpdate.subscription.trialEndsAt = firebase.firestore.Timestamp.fromDate(dataToUpdate.subscription.trialEndsAt);
        }
        if (dataToUpdate.subscription?.endsAt) {
            dataToUpdate.subscription.endsAt = firebase.firestore.Timestamp.fromDate(dataToUpdate.subscription.endsAt);
        }

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
    const restricted = !isSubscriptionActive && activeView !== 'subscription' && activeView !== 'profile';

    if (restricted) {
      return <Paywall setActiveView={handleSetActiveView} user={user!} />;
    }

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
        return <Profile user={user!} onUpdateUser={handleUpdateUser} onLogout={handleLogout} setActiveView={handleSetActiveView} />;
      case 'settings':
        return <Settings user={user!} onUpdateUser={handleUpdateUser} />;
      case 'subscription':
        return <SubscriptionPage user={user!} />;
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
