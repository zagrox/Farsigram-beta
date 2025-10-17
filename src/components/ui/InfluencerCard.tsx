import React from 'react';
import { useTranslation } from 'react-i18next';
import { ASSETS_URL } from '../../constants';
import { MapPinIcon, CategoryIcon } from '../Icons';

export interface EnrichedInfluencer {
    id: number;
    influencer_avatar: string;
    influencer_name: string;
    influencer_title: string;
    categoryName: string;
    locationName: string;
}

interface InfluencerCardProps {
    influencer: EnrichedInfluencer;
    onSelectInfluencer: (id: number) => void;
}

const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer, onSelectInfluencer }) => {
    const { t } = useTranslation('influencers');

    return (
        <article
            className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col"
            aria-labelledby={`influencer-name-${influencer.id}`}
        >
            <button
                onClick={() => onSelectInfluencer(influencer.id)}
                className="relative block w-full aspect-square bg-neutral-200 dark:bg-neutral-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-neutral-800/50"
                aria-label={`${t('viewProfile')} for ${influencer.influencer_name}`}
            >
                <img
                    src={`${ASSETS_URL}/${influencer.influencer_avatar}`}
                    alt={influencer.influencer_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </button>
            <div className="p-6 flex flex-col flex-grow">
                <h3 id={`influencer-name-${influencer.id}`} className="text-lg font-bold text-neutral-900 dark:text-neutral-100 text-center">{influencer.influencer_name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1 truncate" title={influencer.influencer_title}>
                    {influencer.influencer_title}
                </p>
                
                <div className="text-neutral-600 dark:text-neutral-400 mt-3 text-sm flex-grow space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <CategoryIcon className="w-5 h-5 text-primary" />
                        <span className="truncate" title={influencer.categoryName}>{influencer.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <MapPinIcon className="w-5 h-5 text-primary" />
                        <span className="truncate" title={influencer.locationName}>{influencer.locationName}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4">
                     <button 
                        onClick={() => onSelectInfluencer(influencer.id)}
                        className="w-full text-center font-bold py-2 px-4 rounded-lg transition-colors text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 focus:ring-primary"
                    >
                        <span>{t('viewProfile')}</span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export const InfluencerCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col">
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4 mx-auto"></div>
                <div className="flex-grow space-y-3">
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

export default InfluencerCard;