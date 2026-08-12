import React, { useState, useEffect } from 'react';
import { getCurrentUser, setCurrentUser, subscribe } from './services/db';
import { UserProfile } from './types';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UserSidebar } from './components/UserSidebar';
import { ConsultantSidebar } from './components/ConsultantSidebar';
import { DermatologistSidebar } from './components/DermatologistSidebar';

// Views
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { UserDashboard } from './views/UserDashboard';
import { ProfileView } from './views/ProfileView';
import { AssessmentView } from './views/AssessmentView';
import { RoutinePlannerView } from './views/RoutinePlannerView';
import { DermatologistsView } from './views/DermatologistsView';
import { AppointmentsView } from './views/AppointmentsView';
import { ProductRecommendationsView } from './views/ProductRecommendationsView';
import { IngredientAnalyzerView } from './views/IngredientAnalyzerView';
import { ScoreView } from './views/ScoreView';
import { ProgressView } from './views/ProgressView';
import { ConsultantDashboardView } from './views/ConsultantDashboardView';
import { DermatologistDashboardView } from './views/DermatologistDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';

export default function App() {
  const [currentUser, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [currentView, setCurrentView] = useState<string>('landing');
  const [consultantTab, setConsultantTab] = useState<'dashboard' | 'clients' | 'requests' | 'routine'>('dashboard');
  const [dermatologistTab, setDermatologistTab] = useState<'dashboard' | 'patients' | 'requests' | 'appointments' | 'availability' | 'profile'>('dashboard');

  useEffect(() => {
    const sync = () => {
      setUser(getCurrentUser());
    };
    return subscribe(sync);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setCurrentView('landing');
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else if (loggedInUser.role === 'consultant') {
      setCurrentView('consultant-dashboard');
      setConsultantTab('dashboard');
    } else if (loggedInUser.role === 'dermatologist') {
      setCurrentView('dermatologist-dashboard');
      setDermatologistTab('dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  // 1. Landing View
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar onNavigate={setCurrentView} currentUser={currentUser} />
        <main className="flex-1">
          <LandingView onNavigate={setCurrentView} />
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Auth Views
  if (currentView === 'login') {
    return <LoginView onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'signup') {
    return <SignupView onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Admin Dashboard Section
  if (currentView === 'admin-dashboard' || currentUser?.role === 'admin') {
    return (
      <AdminDashboardView
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  // 3. Dermatologist Portal Section (Requirements 7 & 8)
  if (currentView === 'dermatologist-dashboard' || currentUser?.role === 'dermatologist') {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <DermatologistSidebar
          currentTab={dermatologistTab}
          onSelectTab={setDermatologistTab}
          onLogout={handleLogout}
          doctorName={currentUser?.name}
        />
        <main className="flex-1 overflow-y-auto min-h-screen">
          <DermatologistDashboardView
            currentTab={dermatologistTab}
            onSelectTab={setDermatologistTab}
            currentUser={currentUser}
          />
        </main>
      </div>
    );
  }

  // 4. Consultant Portal Section (Requirements 1 & 2)
  if (currentView === 'consultant-dashboard' || currentUser?.role === 'consultant') {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <ConsultantSidebar
          currentTab={consultantTab}
          onSelectTab={setConsultantTab}
          onLogout={handleLogout}
          userName={currentUser?.name}
        />
        <main className="flex-1 overflow-y-auto min-h-screen">
          <ConsultantDashboardView
            currentTab={consultantTab}
            onSelectTab={setConsultantTab}
            currentUser={currentUser}
          />
        </main>
      </div>
    );
  }

  // 4. Standard User Member Portal Views
  const renderUserView = () => {
    switch (currentView) {
      case 'dashboard':
        return <UserDashboard user={currentUser} onNavigate={setCurrentView} />;
      case 'profile':
        return <ProfileView user={currentUser} onNavigate={setCurrentView} />;
      case 'assessment':
        return <AssessmentView onNavigate={setCurrentView} />;
      case 'routine':
        return <RoutinePlannerView onNavigate={setCurrentView} />;
      case 'dermatologists':
        return <DermatologistsView currentUser={currentUser} onNavigate={setCurrentView} />;
      case 'appointments':
        return <AppointmentsView currentUser={currentUser} onNavigate={setCurrentView} />;
      case 'products':
        return <ProductRecommendationsView onNavigate={setCurrentView} />;
      case 'ingredients':
        return <IngredientAnalyzerView onNavigate={setCurrentView} />;
      case 'score':
        return <ScoreView onNavigate={setCurrentView} />;
      case 'progress':
        return <ProgressView onNavigate={setCurrentView} />;
      case 'settings':
        return <ProfileView user={currentUser} onNavigate={setCurrentView} />;
      default:
        return <UserDashboard user={currentUser} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      <UserSidebar
        activeView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {renderUserView()}
      </main>
    </div>
  );
}
