import React from 'react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';
import { SunIcon, MoonIcon, SearchIcon } from './Icons';
import Input from './ui/Input';

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
      <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder={t('searchInputPlaceholder')}
          icon={<SearchIcon className="h-5 w-5 text-neutral-400" />}
          isRtl={i18n.dir() === 'rtl'}
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
