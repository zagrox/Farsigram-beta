import React from 'react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';
import { SunIcon, MoonIcon, SearchIcon } from './Icons';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const { t, i18n } = useTranslation('common');

  const toggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="flex-shrink-0 h-20 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 lg:px-8">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          placeholder={t('searchInputPlaceholder')}
          className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent rounded-lg py-2 pl-10 pr-4 rtl:pr-10 rtl:pl-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('toggleLanguage')}
        >
          <span className="font-semibold text-sm">{i18n.language === 'en' ? 'FA' : 'EN'}</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          title={t('toggleTheme')}
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