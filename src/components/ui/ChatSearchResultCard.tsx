import React from 'react';
import { ASSETS_URL } from '../../constants';
import { CampaignIcon, InfluencersIcon, BusinessIcon } from '../Icons';

export type SearchResultItem = {
  id: number;
  type: 'influencer' | 'campaign' | 'business';
  name: string;
  image: string;
  slogan?: string;
};

interface ChatSearchResultCardProps {
  item: SearchResultItem;
  onClick: (item: SearchResultItem) => void;
}

const renderIcon = (type: SearchResultItem['type']) => {
  const iconClass = "w-4 h-4 text-primary dark:text-primary-light";
  switch (type) {
    case 'influencer': return <InfluencersIcon className={iconClass} />;
    case 'campaign': return <CampaignIcon className={iconClass} />;
    case 'business': return <BusinessIcon className={iconClass} />;
    default: return null;
  }
};

const ChatSearchResultCard: React.FC<ChatSearchResultCardProps> = ({ item, onClick }) => {
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full max-w-sm text-left p-3 my-2 rounded-lg flex items-center gap-4 transition-colors bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
      aria-label={`View details for ${item.name}`}
    >
      <img
        src={`${ASSETS_URL}/${item.image}`}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-neutral-200 dark:bg-neutral-700"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex-grow overflow-hidden">
        <div className="flex items-center gap-1.5">
          {renderIcon(item.type)}
          <h4 className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{item.name}</h4>
        </div>
        {item.slogan && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1" title={item.slogan}>
            {item.slogan}
          </p>
        )}
      </div>
    </button>
  );
};

export default ChatSearchResultCard;
