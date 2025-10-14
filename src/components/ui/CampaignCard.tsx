import React from 'react';
import { useTranslation } from 'react-i18next';
import { ASSETS_URL } from '../../constants';
import { LightBulbIcon } from '../Icons';

interface Campaign {
    id: number;
    campaign_image: string;
    campaign_color: string | null;
    campaign_title: string;
    campaign_slogan: string;
    campaign_overview: string;
    campaign_goal: string;
}

interface CampaignCardProps {
    campaign: Campaign;
    onSelectCampaign: (id: number) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelectCampaign }) => {
    const { t } = useTranslation('campaigns');
    const themeColor = campaign.campaign_color || '#64748b'; // neutral-500 fallback

    const truncateText = (text: string, maxLength: number) => {
        if (!text || text.length <= maxLength) return text;
        const lastSpace = text.lastIndexOf(' ', maxLength);
        return text.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
    };

    return (
        <article
            className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col"
            aria-labelledby={`campaign-title-${campaign.id}`}
        >
            <div className="relative aspect-video bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <img
                    src={`${ASSETS_URL}/${campaign.campaign_image}`}
                    alt={campaign.campaign_title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 p-4">
                     <p className="text-white font-semibold italic" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{campaign.campaign_slogan}</p>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-sm font-medium mb-3" style={{ color: themeColor }}>
                    <LightBulbIcon className="w-5 h-5" />
                    <span className="truncate" title={campaign.campaign_goal}>{campaign.campaign_goal}</span>
                </div>

                <h3 id={`campaign-title-${campaign.id}`} className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{campaign.campaign_title}</h3>
                
                <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm flex-grow">
                    {truncateText(campaign.campaign_overview, 90)}
                </p>

                <div className="mt-auto pt-4">
                     <button 
                        onClick={() => onSelectCampaign(campaign.id)}
                        className="w-full text-center font-bold py-2 px-4 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 text-white"
                        style={{ 
                            backgroundColor: themeColor, 
                            '--tw-ring-color': themeColor 
                        } as React.CSSProperties}
                    >
                        <span>{t('viewDetails')}</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export const CampaignCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col">
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                <div className="flex-grow space-y-2 mt-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                </div>
                <div className="mt-auto pt-4">
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-full"></div>
                </div>
            </div>
        </div>
    );
};

export default CampaignCard;