import { useState, useEffect } from 'react';
import type { Page } from '@/types';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { useSettings } from '@/hooks/useSettings';
import { I18nProvider } from '@/lib/i18n';
import { Sidebar, BottomNav, MobileHeader } from '@/components/Navigation';
import { Dashboard } from '@/pages/Dashboard';
import { CoffeeModule } from '@/pages/CoffeeModule';
import { RiceModule } from '@/pages/RiceModule';
import { LivestockModule } from '@/pages/LivestockModule';
import { MyFarmPage } from '@/pages/MyFarmPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { LoginPage } from '@/pages/LoginPage';
import { EconomicsPage } from '@/pages/EconomicsPage';
import { CarbonPage } from '@/pages/CarbonPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { DocsPage } from '@/pages/DocsPage';
import { UserProfile } from '@/components/UserProfile';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sparkles, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const { data, update, isOnline, resetData, exportData, importData, updateConfig } = useAppData();
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleNavigate = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-grove-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-grove-300 mb-4" />
        <p className="text-sm text-grove-200">Cargando AgroSinergia 360...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const farmName = data.farmConfig.farmName || 'Mi Finca';
  const showFloatingButton = page !== 'assistant';

  return (
    <I18nProvider lang={settings.language}>
      <div className="min-h-screen bg-[#f8f7f4] dark:bg-earth-900 transition-colors duration-300">
        <Sidebar current={page} onNavigate={handleNavigate} farmName={farmName} user={user} />

        <div className="md:pl-64">
          <MobileHeader current={page} farmName={farmName} user={user} onNavigate={handleNavigate} />

          <main className="px-4 py-5 sm:px-6 lg:px-8 pb-24 md:pb-8 max-w-5xl mx-auto">
            {page === 'dashboard' && <Dashboard data={data} onNavigate={handleNavigate} isOnline={isOnline} />}

            {page === 'coffee' && data.farmConfig.modules.coffee && (
              <CoffeeModule data={data} update={update} />
            )}

            {page === 'rice' && data.farmConfig.modules.rice && (
              <RiceModule data={data} update={update} />
            )}

            {page === 'livestock' && data.farmConfig.modules.livestock && (
              <LivestockModule data={data} update={update} />
            )}

            {page === 'economics' && (
              <EconomicsPage data={data} update={update} />
            )}

            {page === 'carbon' && (
              <CarbonPage data={data} update={update} />
            )}

            {page === 'myfarm' && (
              <MyFarmPage
                data={data}
                update={update}
                updateConfig={updateConfig}
                isOnline={isOnline}
                cloudSynced={false}
                onReset={resetData}
                onExport={exportData}
                onImport={importData}
              />
            )}

            {page === 'assistant' && <AssistantPage data={data} />}

            {page === 'docs' && <DocsPage />}

            {page === 'settings' && (
              <SettingsPage user={user} onNavigate={handleNavigate} />
            )}

            {/* Fallback for disabled modules */
              ((page === 'coffee' && !data.farmConfig.modules.coffee) ||
               (page === 'rice' && !data.farmConfig.modules.rice) ||
               (page === 'livestock' && !data.farmConfig.modules.livestock)) && (
                <div className="text-center py-20">
                  <p className="text-sm text-earth-500 dark:text-earth-300">Este módulo está desactivado. Actívalo desde Mi Finca.</p>
                  <button onClick={() => handleNavigate('myfarm')} className="btn-primary mt-4">
                    Ir a Mi Finca
                  </button>
                </div>
              )
            }
          </main>
        </div>

        <BottomNav current={page} onNavigate={handleNavigate} />

        {/* Floating assistant button */}
        {showFloatingButton && (
          <button
            onClick={() => handleNavigate('assistant')}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grove-600 text-white shadow-xl hover:bg-grove-700 hover:scale-105 transition-all animate-scale-in dark:bg-grove-500 dark:hover:bg-grove-400"
            aria-label="Asistente IA"
          >
            <Sparkles className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute h-full w-full rounded-full bg-harvest-400 animate-ping opacity-75" />
              <span className="h-3 w-3 rounded-full bg-harvest-500" />
            </span>
          </button>
        )}
      </div>
    </I18nProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
