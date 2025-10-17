import React from 'react';
import { useTranslation } from 'react-i18next';
import { ASSETS_URL } from '../../constants';
import { MapPinIcon, CategoryIcon, CultureIcon, ArrowRightIcon, TagIcon, SocialIcon } from '../Icons';

export interface EnrichedInfluencer {
    id: number;
    influencer_avatar: string;
    influencer_name: string;
    influencer_title: string;
    categoryName: string;
    locationName: string;
    isHubMember: boolean;
    socials: {
        id: number;
        social_network: string;
        social_account: string;
    }[];
    audiences: {
        id: number;
        name: string;
    }[];
}


interface InfluencerCardProps {
    influencer: EnrichedInfluencer;
    onSelectInfluencer: (id: number) => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <div className="w-5 h-5 text-primary flex-shrink-0">{icon}</div>
        <span className="truncate" title={text}>{text}</span>
    </div>
);

const InfluencerCard: React.FC<InfluencerCardProps> = ({ influencer, onSelectInfluencer }) => {
    const { t } = useTranslation('influencers');

    return (
        <article
            className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col"
            aria-labelledby={`influencer-name-${influencer.id}`}
        >
            <button
                onClick={() => onSelectInfluencer(influencer.id)}
                className="relative block w-full aspect-square bg-neutral-200 dark:bg-neutral-700 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`${t('viewProfile')} for ${influencer.influencer_name}`}
            >
                <img
                    src={`${ASSETS_URL}/${influencer.influencer_avatar}`}
                    alt={influencer.influencer_name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
                
                {influencer.isHubMember && (
                    <div className="absolute top-3 left-3 bg-secondary/80 backdrop-blur-sm text-white p-1.5 rounded-full" title={t('partOfHub')}>
                        <CultureIcon className="w-4 h-4" />
                    </div>
                )}

                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title={t('viewProfile')}>
                    <ArrowRightIcon className="w-5 h-5" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-4 w-full">
                     <h3 id={`influencer-name-${influencer.id}`} className="text-lg font-bold text-white truncate" style={{textShadow: '0 1px 3px rgba(0,0,0,0.7)'}}>
                        {influencer.influencer_name}
                    </h3>
                    <p className="text-sm text-neutral-200 truncate" style={{textShadow: '0 1px 3px rgba(0,0,0,0.7)'}}>
                        {influencer.influencer_title}
                    </p>
                </div>
            </button>
            <div className="p-4 flex flex-col flex-grow">
                <div className="space-y-2">
                    <InfoRow icon={<CategoryIcon />} text={influencer.categoryName} />
                    <InfoRow icon={<MapPinIcon />} text={influencer.locationName} />
                    {influencer.audiences.length > 0 && (
                        <div className="flex items-start gap-2">
                           <div className="w-5 h-5 text-primary flex-shrink-0 pt-0.5"><TagIcon /></div>
                           <div className="flex flex-wrap gap-1.5">
                               {influencer.audiences.slice(0, 3).map(aud => (
                                   <span key={aud.id} className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-full">
                                       {aud.name}
                                   </span>
                               ))}
                           </div>
                       </div>
                   )}
                </div>
               
                <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700/50">
                     <div className="flex items-center justify-center gap-4">
                        {influencer.socials.slice(0, 5).map(social => (
                            <a 
                                key={social.id}
                                href={`${social.social_network}${social.social_account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                                aria-label={social.social_account}
                            >
                                <SocialIcon networkUrl={social.social_network} className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
};

export const InfluencerCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col">
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="space-y-3">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                </div>
                <div className="flex-grow"></div>
                <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700/50">
                    <div className="flex justify-center gap-4">
                        <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                        <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                        <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                        <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfluencerCard;