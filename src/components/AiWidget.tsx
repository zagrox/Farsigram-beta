import React from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../types';
import { MessageIcon, CultureIcon } from './Icons';

interface AiWidgetProps {
  onNavigate: (page: Page) => void;
}

const AiWidget: React.FC<AiWidgetProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';

  const positionClass = isRtl ? 'left-8' : 'right-8';

  return (
    <button
      onClick={() => onNavigate(Page.Chat)}
      className={`fixed bottom-8 ${positionClass} z-20 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-lg flex items-center justify-center text-white transition-transform duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/50 group`}
      aria-label={t('ai_assistant')}
    >
      <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-25 animate-ping group-hover:animate-none"></span>
      <div className="relative">
        <MessageIcon className="w-8 h-8" />
        <CultureIcon className="absolute -top-1 -right-1 w-4 h-4 text-secondary-light transform transition-transform duration-500 group-hover:rotate-180" />
      </div>
    </button>
  );
};

export default AiWidget;
