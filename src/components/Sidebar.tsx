import React from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../types';
import { NAVIGATION_ITEMS } from '../constants';
import { ProfileIcon, ChevronLeftIcon, ChevronRightIcon, FarsigramIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isCollapsed, setSidebarCollapsed }) => {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';

  const buttonPositionClass = isCollapsed
    ? 'left-1/2 -translate-x-1/2 -top-3'
    : (isRtl ? 'left-4 -top-3' : 'right-4 -top-3');

  return (
    <aside className={`fixed top-0 h-full bg-white dark:bg-neutral-950 flex flex-col transition-all duration-300 z-10 ${isCollapsed ? 'w-20' : 'w-64'} ${isRtl ? 'right-0' : 'left-0'}`}>
      <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'h-20 justify-center' : 'h-20 px-6'}`}>
        <FarsigramIcon className="h-8 w-8 text-primary" />
        {!isCollapsed && <span className={`${isRtl ? 'mr-3' : 'ml-3'} text-2xl font-bold text-neutral-800 dark:text-neutral-100`}>Farsigram</span>}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(item.id);
            }}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
              currentPage === item.id
                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-6 h-6">{item.icon}</div>
            {!isCollapsed && <span className={`${isRtl ? 'mr-4' : 'ml-4'} font-medium`}>{t(item.label)}</span>}
          </a>
        ))}
      </nav>

      <div className="px-4 py-6 border-t border-neutral-200 dark:border-neutral-800 relative">
        <button 
          onClick={() => setSidebarCollapsed(!isCollapsed)} 
          className={`absolute h-6 w-6 bg-white dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-800 rounded-full flex items-center justify-center text-neutral-500 hover:text-primary transition-colors z-20 ${buttonPositionClass}`}
          aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {isRtl ? 
              (isCollapsed ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />) :
              (isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />)
          }
        </button>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setCurrentPage(Page.Profile);
          }}
          className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
            currentPage === Page.Profile
              ? 'bg-primary/10 text-primary dark:bg-primary/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-6 h-6"><ProfileIcon /></div>
          {!isCollapsed && <span className={`${isRtl ? 'mr-4' : 'ml-4'} font-medium`}>{t('profile')}</span>}
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
