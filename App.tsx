import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ActivityDetail } from './components/ActivityDetail';
import { Planning } from './components/Planning';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Subscription as SubscriptionPage } from './components/Subscription';
import { Paywall } from './components/Paywall';
import { Login } from './components/Login';
import { supabase } from './services/supabase';
import { Activity, User, ActivityStatus, Intervention, Grade, UserSettings, SubscriptionStatus } from './types';
import { DEFAULT_ACTIVITY_COEFFICIENTS, DEFAULT_TIME_SLOTS } from './constants';
import { BottomNav } from './components/BottomNav';
import { Session } from '@supabase/supabase-js';

type View = 'dashboard' | 'calendar' | 'profile' | 'settings' | 'subscription';

// Helper function to reliably convert various types to a Date object
const ensureDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    // Already a Date object
    if (date instanceof Date) return date;
    // Handle ISO strings or numbers (milliseconds from epoch)
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    // Return undefined if conversion fails
    return undefined;
};


const App: React.FC = () => {
  console.log("App component rendering");
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state change listener");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session);
      setSession(session);
      // App is not loading anymore once we have the session
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
       // Also stop loading when auth state changes
       setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile and activities when session changes
  useEffect(() => {
    console.log("Session changed:", session);
    if (!session) {
      setUser(null);
      setActivities([]);
      return;
    }

    const fetchUserAndActivities = async () => {
        // We might already be loading, but let's be sure
        setIsLoading(true);

        const supabaseUser = session.user;

        // 1. Fetch user profile
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116: 0 rows returned
            console.error('Error fetching user:', userError);
            setIsLoading(false);
            return;
        }

        if (userData) {
            // User exists, format and set user data
             const formattedUser: User = {
                ...userData,
                subscription: {
                    ...userData.subscription,
                    trialEndsAt: ensureDate(userData.subscription?.trialEndsAt),
                    endsAt: ensureDate(userData.subscription?.endsAt),
                }
            };
            setUser(formattedUser);
        } else {
            // User does not exist, create a new profile
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14);
            const newUser: User = {
                id: supabaseUser.id,
                nom: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'Utilisateur',
                prenom: supabaseUser.user_metadata?.full_name?.split(' ')[0] || 'Nouveau',
                email: supabaseUser.email || '',
                avatarUrl: supabaseUser.user_metadata?.avatar_url || `https://picsum.photos/seed/${supabaseUser.id}/200`,
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

            const { error: insertError } = await supabase.from('users').insert(newUser);

            if (insertError) {
                console.error('Error creating user:', insertError);
            } else {
                setUser(newUser);
            }
        }
        
        // 2. Fetch user's activities
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', supabaseUser.id)
            .order('start', { ascending: true });

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
        } else if (activitiesData) {
            const userActivities = activitiesData.map((activity: any) => ({
                ...activity,
                start: new Date(activity.start),
                end: new Date(activity.end),
                interventions: (activity.interventions || []).map((inter: any) => ({
                    ...inter,
                    start: new Date(inter.start),
                    end: new Date(inter.end),
                })),
            }));
            setActivities(userActivities);
        }

        setIsLoading(false);
    };

    fetchUserAndActivities();

    // 3. Set up real-time subscription for activities
    const channel = supabase
      .channel(`public:activities:user_id=eq.${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          console.log('Change received!', payload)
          fetchUserAndActivities();
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [session]);

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
    if (!user) return;

    const { id, ...dataToUpdate } = updatedUser;

    // Supabase expects ISO strings for timestamps
    const dataForSupabase = {
        ...dataToUpdate,
        subscription: {
            ...dataToUpdate.subscription,
            trialEndsAt: dataToUpdate.subscription?.trialEndsAt ? dataToUpdate.subscription.trialEndsAt.toISOString() : null,
            endsAt: dataToUpdate.subscription?.endsAt ? dataToUpdate.subscription.endsAt.toISOString() : null,
        }
    };

    const { error } = await supabase
      .from('users')
      .update(dataForSupabase)
      .eq('id', id);

    if (error) {
      console.error("Error updating user:", error);
    } else {
      setUser(updatedUser); // Update local state
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        // Session change will trigger useEffect to clear user and activities
        setActiveView('dashboard');
    }
  }

  const handleAddActivity = async (newActivityData: Omit<Activity, 'id' | 'status' | 'interventions'>) => {
    if (!user) return;
    
    const activityToSave = {
        ...newActivityData,
        user_id: user.id, // Add user_id foreign key
        start: newActivityData.start.toISOString(),
        end: newActivityData.end.toISOString(),
        status: ActivityStatus.Saisie,
        interventions: [],
    };
    
    const { error } = await supabase.from('activities').insert(activityToSave);

    if (error) {
        console.error('Error adding activity:', error);
    } else {
        setCurrentCalendarDate(newActivityData.start);
    }
  };

  const handleAddIntervention = async (activityId: string, interventionData: Omit<Intervention, 'id'>) => {
     if (!user) return;

    // 1. Fetch the current activity to get the existing interventions
    const { data: activity, error: fetchError } = await supabase
        .from('activities')
        .select('interventions')
        .eq('id', activityId)
        .single();

    if (fetchError || !activity) {
        console.error('Error fetching activity before adding intervention:', fetchError);
        return;
    }

    // 2. Prepare the new intervention
    const newIntervention = {
        ...interventionData,
        id: `inter-${Date.now()}`,
        start: interventionData.start.toISOString(),
        end: interventionData.end.toISOString(),
    };

    // 3. Append the new intervention to the existing array
    const updatedInterventions = [...(activity.interventions || []), newIntervention];

    // 4. Update the activity with the new interventions array
    const { error: updateError } = await supabase
        .from('activities')
        .update({ interventions: updatedInterventions })
        .eq('id', activityId);

    if (updateError) {
        console.error('Error adding intervention:', updateError);
    }
    // No local state update needed as the real-time subscription will trigger a refresh
  };

  const handleUpdateActivity = async (activityId: string, updatedData: Partial<Omit<Activity, 'id' | 'interventions' | 'user_id'>>) => {
    if (!user) throw new Error("Utilisateur non connecté.");
    
    const dataToSave: { [key: string]: any } = { ...updatedData };
    if (updatedData.start) {
      dataToSave.start = updatedData.start.toISOString();
    }
    if (updatedData.end) {
      dataToSave.end = updatedData.end.toISOString();
    }

    const { error } = await supabase
        .from('activities')
        .update(dataToSave)
        .eq('id', activityId);
    
    if (error) {
      console.error("Error updating activity:", error);
      throw new Error("La mise à jour de l'activité a échoué.");
    }
    // Real-time subscription will handle the update
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!user) throw new Error("Utilisateur non connecté.");
    
    const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);
    
    if (error) {
      console.error("Error deleting activity:", error);
      throw new Error("La suppression de l'activité a échoué.");
    } else {
        setSelectedActivity(null);
        // Real-time subscription will handle the UI update
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
