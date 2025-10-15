import React, { useState, useEffect } from 'react';
import { Page, Theme } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailsPage from './pages/CampaignDetailsPage';
import CulturalHubPage from './pages/CulturalHubPage';
import ExplorePage from './pages/ExplorePage';
import CategoriesPage from './pages/CategoriesPage';
import NetworkDetailsPage from './pages/NetworkDetailsPage';
import AudienceDetailsPage from './pages/AudienceDetailsPage'; // Import new page
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import InfluencersPage from './pages/InfluencersPage';
import InfluencerDetailsPage from './pages/InfluencerDetailsPage';
import i18n from './i18n';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme === 'dark' ? Theme.Dark : Theme.Light;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? Theme.Dark
      : Theme.Light;
  });
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [language, setLanguage] = useState(i18n.language);
  const [viewingCampaignId, setViewingCampaignId] = useState<number | null>(null);
  const [viewingInfluencerId, setViewingInfluencerId] = useState<number | null>(null);
  const [viewingNetwork, setViewingNetwork] = useState<string | null>(null);
  const [viewingAudienceId, setViewingAudienceId] = useState<number | null>(null); // State for audience details page

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.Dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update theme if user hasn't made a manual choice
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? Theme.Dark : Theme.Light);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = i18n.dir(lng);
      setLanguage(lng); // Force re-render on language change
    };

    i18n.on('languageChanged', handleLanguageChange);
    handleLanguageChange(i18n.language); // Set initial direction

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  // Reset item views when navigating away from their respective pages
  useEffect(() => {
    if (currentPage !== Page.Campaigns) {
      setViewingCampaignId(null);
    }
    if (currentPage !== Page.Influencers) {
      setViewingInfluencerId(null);
    }
    if (currentPage !== Page.Categories) {
      setViewingNetwork(null);
      setViewingAudienceId(null);
    }
  }, [currentPage]);

  const setThemeAndStore = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme === Theme.Dark ? 'dark' : 'light');
  };

  const setSystemTheme = () => {
    localStorage.removeItem('theme');
    const systemIsDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setTheme(systemIsDark ? Theme.Dark : Theme.Light);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Home:
        return <HomePage setCurrentPage={setCurrentPage} />;
      case Page.Campaigns:
        return viewingCampaignId ? (
          <CampaignDetailsPage 
            campaignId={viewingCampaignId}
            onBack={() => setViewingCampaignId(null)}
          />
        ) : (
          <CampaignsPage onSelectCampaign={(id) => setViewingCampaignId(id)} />
        );
      case Page.Influencers:
        return viewingInfluencerId ? (
          <InfluencerDetailsPage
            influencerId={viewingInfluencerId}
            onBack={() => setViewingInfluencerId(null)}
          />
        ) : (
          <InfluencersPage onSelectInfluencer={(id) => setViewingInfluencerId(id)} />
        );
      case Page.CulturalHub:
        return <CulturalHubPage />;
      case Page.Explore:
        return <ExplorePage />;
      case Page.Categories:
        if (viewingNetwork) {
          return <NetworkDetailsPage
            networkUrl={viewingNetwork}
            onBack={() => setViewingNetwork(null)}
            onSelectInfluencer={(id) => {
              setViewingInfluencerId(id);
              setCurrentPage(Page.Influencers);
            }}
            onSelectCampaign={(id) => {
              setViewingCampaignId(id);
              setCurrentPage(Page.Campaigns);
            }}
          />
        }
        if (viewingAudienceId) {
            return <AudienceDetailsPage
                audienceId={viewingAudienceId}
                onBack={() => setViewingAudienceId(null)}
                onSelectInfluencer={(id) => {
                    setViewingInfluencerId(id);
                    setCurrentPage(Page.Influencers);
                }}
                onSelectCampaign={(id) => {
                    setViewingCampaignId(id);
                    setCurrentPage(Page.Campaigns);
                }}
            />;
        }
        return <CategoriesPage 
            onSelectNetwork={(url) => setViewingNetwork(url)}
            onSelectAudience={(id) => setViewingAudienceId(id)}
        />;
      case Page.Marketplace:
        return <MarketplacePage />;
      case Page.Profile:
        return <ProfilePage setTheme={setThemeAndStore} setSystemTheme={setSystemTheme} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  const contentPositionClass = i18n.dir() === 'rtl'
    ? (isSidebarCollapsed ? 'right-20 left-0' : 'right-64 left-0')
    : (isSidebarCollapsed ? 'left-20 right-0' : 'left-64 right-0');

  return (
    <div className="relative min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-sans">
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <div className={`absolute top-0 bottom-0 flex flex-col transition-all duration-300 ${contentPositionClass}`}>
        <Header 
          theme={theme}
          setTheme={setThemeAndStore}
          currentPage={currentPage}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;