import React from 'react';
import { useTranslation } from 'react-i18next';
import { ASSETS_URL } from '../../constants';
import { CategoryIcon, ArrowRightIcon, TagIcon, MapPinIcon } from '../Icons';

interface Business {
    id: number;
    business_logo: string;
    business_color: string | null;
    business_name: string;
    business_slogan: string;
    business_tags: string[] | null;
}

interface BusinessCardProps {
    business: Business;
    onSelectBusiness: (id: number) => void;
    locationName: string;
    categoryName: string;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onSelectBusiness, locationName, categoryName }) => {
    const { t } = useTranslation('business');
    const themeColor = business.business_color || '#0D9488'; // primary fallback

    return (
        <article
            className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col"
            aria-labelledby={`business-title-${business.id}`}
        >
            <button
                onClick={() => onSelectBusiness(business.id)}
                className="relative block w-full aspect-video bg-neutral-200 dark:bg-neutral-700 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`${t('viewDetails')} for ${business.business_name}`}
            >
                <img
                    src={`${ASSETS_URL}/${business.business_logo}`}
                    alt={business.business_name}
                    className="w-full h-full object-contain p-8 transition-transform duration-300 group-hover:scale-105" // object-contain for logos
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>

                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title={t('viewDetails')}>
                    <ArrowRightIcon className="w-5 h-5" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-4 w-full">
                     <h3 id={`business-title-${business.id}`} className="text-lg font-bold text-white truncate" style={{textShadow: '0 1px 3px rgba(0,0,0,0.7)'}}>
                        {business.business_name}
                    </h3>
                    <p className="text-sm text-neutral-200 truncate italic" style={{textShadow: '0 1px 3px rgba(0,0,0,0.7)'}}>
                        {business.business_slogan}
                    </p>
                </div>
            </button>
            <div className="p-4 flex flex-col flex-grow">
                <div className="space-y-2 flex-grow">
                    {/* Category Row */}
                    {categoryName && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="w-5 h-5 flex-shrink-0" style={{ color: themeColor }}><CategoryIcon /></div>
                            <span className="truncate" title={categoryName}>{categoryName}</span>
                        </div>
                    )}

                    {/* Location Row */}
                    {locationName && (
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="w-5 h-5 flex-shrink-0 text-primary"><MapPinIcon /></div>
                            <span className="truncate" title={locationName}>{locationName}</span>
                        </div>
                    )}

                    {/* Tags Row */}
                    {business.business_tags && business.business_tags.length > 0 && (
                        <div className="flex items-start gap-2 pt-1">
                           <div className="w-5 h-5 text-primary flex-shrink-0 pt-0.5"><TagIcon /></div>
                           <div className="flex flex-wrap gap-1.5">
                               {business.business_tags.slice(0, 3).map(tag => (
                                   <span key={tag} className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-full">
                                       {tag}
                                   </span>
                               ))}
                           </div>
                       </div>
                   )}
                </div>
            </div>
        </article>
    );
};

export const BusinessCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden animate-pulse flex flex-col">
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="space-y-3">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;