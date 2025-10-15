import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '../components/Icons';

interface ProfilePageProps {
  setTheme: (theme: Theme) => void;
  setSystemTheme: () => void;
}

type Tab = 'general' | 'account' | 'messages' | 'notifications';
type ThemePreference = 'light' | 'dark' | 'system';

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
    }`}
  >
    {children}
  </button>
);

const ThemeOption: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={isActive}
    className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-sm font-medium ${
      isActive
        ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20'
        : 'bg-neutral-100 dark:bg-neutral-800 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300'
    }`}
  >
    <div className="w-6 h-6">{icon}</div>
    <span>{label}</span>
  </button>
);

const GeneralSettings: React.FC<ProfilePageProps> = ({ setTheme, setSystemTheme }) => {
  const { t } = useTranslation('profile');
  const [activePreference, setActivePreference] = useState<ThemePreference>(() => (localStorage.getItem('theme') as ThemePreference) || 'system');

  const handlePreferenceChange = (preference: ThemePreference) => {
    setActivePreference(preference);
    if (preference === 'system') {
      setSystemTheme();
    } else {
      setTheme(preference === 'dark' ? Theme.Dark : Theme.Light);
    }
  };

  return (
    <div className="mt-6">
      <div className="p-6 bg-white dark:bg-neutral-800/50 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">{t('display_mode')}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-4">{t('display_mode_desc')}</p>
        <div className="flex items-center gap-4">
          <ThemeOption 
            label={t('light')} 
            icon={<SunIcon />} 
            isActive={activePreference === 'light'} 
            onClick={() => handlePreferenceChange('light')} 
          />
          <ThemeOption 
            label={t('dark')} 
            icon={<MoonIcon />} 
            isActive={activePreference === 'dark'} 
            onClick={() => handlePreferenceChange('dark')} 
          />
          <ThemeOption 
            label={t('system')} 
            icon={<ComputerDesktopIcon />} 
            isActive={activePreference === 'system'} 
            onClick={() => handlePreferenceChange('system')} 
          />
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  const { t } = useTranslation(['profile', 'messages', 'notifications']);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings {...props} />;
      case 'account':
        return (
            <div className="mt-6 bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
                <h2 className="text-2xl font-semibold">{t('profile:comingSoonTitle')}</h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('profile:comingSoonDescription')}</p>
            </div>
        );
      case 'messages':
        return (
            <div className="mt-6 bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
                <h2 className="text-2xl font-semibold">{t('messages:comingSoonTitle')}</h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('messages:comingSoonDescription')}</p>
            </div>
        );
      case 'notifications':
        return (
            <div className="mt-6 bg-white dark:bg-neutral-800/50 p-8 rounded-xl shadow-md text-center">
                <h2 className="text-2xl font-semibold">{t('notifications:comingSoonTitle')}</h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">{t('notifications:comingSoonDescription')}</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 p-1 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-lg">
        <TabButton isActive={activeTab === 'general'} onClick={() => setActiveTab('general')}>
          {t('profile:general')}
        </TabButton>
        <TabButton isActive={activeTab === 'account'} onClick={() => setActiveTab('account')}>
          {t('profile:account')}
        </TabButton>
        <TabButton isActive={activeTab === 'messages'} onClick={() => setActiveTab('messages')}>
          {t('profile:messages')}
        </TabButton>
        <TabButton isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')}>
          {t('profile:notifications')}
        </TabButton>
      </div>
      {renderContent()}
    </div>
  );
};

export default ProfilePage;
