import React from 'react';
import { ASSETS_URL } from '../../constants';
import { EnrichedInfluencer } from './InfluencerCard';

interface CompactInfluencerCardProps {
    influencer: EnrichedInfluencer;
    onSelectInfluencer: (id: number) => void;
}

const CompactInfluencerCard: React.FC<CompactInfluencerCardProps> = ({ influencer, onSelectInfluencer }) => {
    return (
        <button
            onClick={() => onSelectInfluencer(influencer.id)}
            className="w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={`View profile for ${influencer.influencer_name}`}
        >
            <img
                src={`${ASSETS_URL}/${influencer.influencer_avatar}`}
                alt={influencer.influencer_name}
                className="w-14 h-14 object-cover rounded-full flex-shrink-0 border-2 border-white dark:border-neutral-700"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex-grow overflow-hidden">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{influencer.influencer_name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1" title={influencer.influencer_title}>
                    {influencer.influencer_title}
                </p>
            </div>
        </button>
    );
};

export const CompactInfluencerCardSkeleton: React.FC = () => {
    return (
        <div className="p-3 rounded-lg flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            </div>
        </div>
    );
};

export default CompactInfluencerCard;