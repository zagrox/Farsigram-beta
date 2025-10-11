import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Theme, Page } from '../types';
import { SunIcon, MoonIcon, SearchIcon } from './Icons';
import Input from './ui/Input';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentPage: Page;
}

const pageInfo: Record<Page, { ns: string; titleKey: string }> = {
  [Page.Home]: { ns: 'home', titleKey: 'title' },
  [Page.Campaigns]: { ns: 'campaigns', titleKey: 'title' },
  [Page.CulturalHub]: { ns: 'culturalhub', titleKey: 'title' },
  [Page.Explore]: { ns: 'explore', titleKey: 'title' },
  [Page.Categories]: { ns: 'categories', titleKey: 'title' },
  [Page.Marketplace]: { ns: 'marketplace', titleKey: 'title' },
  [Page.Messages]: { ns: 'messages', titleKey: 'title' },
  [Page.Notifications]: { ns: 'notifications', titleKey: 'title' },
  [Page.Profile]: { ns: 'profile', titleKey: 'title' },
};


const Header: React.FC<HeaderProps> = ({ theme, setTheme, currentPage }) => {
  const { ns, titleKey } = pageInfo[currentPage];
  const { t, i18n } = useTranslation([ns, 'common']);
  
  const pageTitle = t(`${ns}:${titleKey}`);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsSearchExpanded(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="flex-shrink-0 h-20 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('common:toggleLanguage')}
        >
          <span className="font-semibold text-sm">{i18n.language === 'en' ? 'FA' : 'EN'}</span>
        </button>
        <div ref={searchContainerRef}>
          {isSearchExpanded ? (
            <div className="w-64">
               <Input
                type="text"
                placeholder={t('common:searchInputPlaceholder')}
                icon={<SearchIcon className="h-5 w-5 text-neutral-400" />}
                isRtl={i18n.dir() === 'rtl'}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsSearchExpanded(true)}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
              aria-label={t('common:search')}
            >
              <SearchIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('common:toggleTheme')}
        >
          {theme === Theme.Light ? (
            <MoonIcon className="h-6 w-6" />
          ) : (
            <SunIcon className="h-6 w-6" />
          )}
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full cursor-pointer">
          <img
            src="https://picsum.photos/100"
            alt="User Avatar"
            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-neutral-800"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;