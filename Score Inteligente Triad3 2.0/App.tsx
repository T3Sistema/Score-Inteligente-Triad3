
import React, { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import QuestionnairePage from './pages/QuestionnairePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LogsPage from './pages/LogsPage'; // Adicionado
import Header from './components/Header';
import Footer from './components/Footer';
import { useApp } from './hooks/useApp';
import { UserRole } from './types';

// O PageWrapper foi movido para fora para evitar que seja recriado a cada renderização,
// o que causava o unmount/remount de toda a árvore de componentes.
const PageWrapper: React.FC<{ children: React.ReactNode; route: string }> = ({ children, route }) => {
  if (route === '#login' || route === '') {
      return <>{children}</>;
  }
  return (
    <div className="bg-dark-background min-h-screen text-dark-text font-sans transition-colors duration-300 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, loading, fetchAdminQuestionnaireData } = useApp();
  const [route, setRoute] = useState(window.location.hash || '#login');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#login');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  useEffect(() => {
    // Se houver um usuário logado, busca os dados mais recentes do
    // questionário (categorias e perguntas) para garantir que o dashboard e
    // outras páginas tenham as informações necessárias.
    if (currentUser) {
      fetchAdminQuestionnaireData();
    }
  }, [currentUser, fetchAdminQuestionnaireData]);
  
  const renderContent = () => {
    if (loading) {
       return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
    }

    // Redirect to dashboard if logged in and trying to access login
    if (currentUser && route === '#login') {
      window.location.hash = '#dashboard';
      return null;
    }
    
    // Redirect to login if not logged in and trying to access protected routes
    if (!currentUser && (route !== '#login' && route !=='')) {
      window.location.hash = '#login';
      return <LoginPage />;
    }
    
    switch (route) {
      case '#admin':
        return currentUser?.role === UserRole.ADMIN ? <AdminPage /> : <DashboardPage />;
      case '#logs':
        return currentUser?.role === UserRole.ADMIN ? <LogsPage /> : <DashboardPage />;
      case '#questionnaire':
        return <QuestionnairePage />;
      case '#dashboard':
        return <DashboardPage />;
      case '#profile':
        return <ProfilePage />;
      case '#login':
      case '':
      default:
        return <LoginPage />;
    }
  };

  return (
    <PageWrapper route={route}>
      {renderContent()}
    </PageWrapper>
  );
};

export default App;
