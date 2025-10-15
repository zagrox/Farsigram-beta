import React from 'react';
import { ASSETS_URL } from '../../constants';
import { LightBulbIcon } from '../Icons';

interface Campaign {
    id: number;
    campaign_image: string;
    campaign_color: string | null;
    campaign_goal: string;
    campaign_title: string;
}

interface CompactCampaignCardProps {
    campaign: Campaign;
    onSelectCampaign: (id: number) => void;
}

const CompactCampaignCard: React.FC<CompactCampaignCardProps> = ({ campaign, onSelectCampaign }) => {
    const themeColor = campaign.campaign_color || '#64748b'; // neutral-500 fallback

    return (
        <button
            onClick={() => onSelectCampaign(campaign.id)}
            className="w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={`View details for ${campaign.campaign_title}`}
        >
            <img
                src={`${ASSETS_URL}/${campaign.campaign_image}?width=120&height=120&fit=cover`}
                alt={campaign.campaign_title}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-neutral-200 dark:bg-neutral-700"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex-grow overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: themeColor }}>
                    <LightBulbIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{campaign.campaign_goal}</span>
                </div>
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">{campaign.campaign_title}</h3>
            </div>
        </button>
    );
};

export const CompactCampaignCardSkeleton: React.FC = () => {
    return (
        <div className="p-3 rounded-lg flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
            <div className="flex-grow space-y-2">
                <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            </div>
        </div>
    );
};

export default CompactCampaignCard;