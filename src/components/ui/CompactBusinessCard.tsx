import React from 'react';
import { ASSETS_URL } from '../../constants';

interface Business {
    id: number;
    business_logo: string;
    business_name: string;
    business_slogan: string;
}

interface CompactBusinessCardProps {
    business: Business;
    onSelectBusiness: (id: number) => void;
}

const CompactBusinessCard: React.FC<CompactBusinessCardProps> = ({ business, onSelectBusiness }) => {
    return (
        <button
            onClick={() => onSelectBusiness(business.id)}
            className="w-full text-left p-3 rounded-lg flex items-center gap-4 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
            aria-label={`View details for ${business.business_name}`}
        >
            <div className="w-14 h-14 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center p-1 flex-shrink-0 border border-neutral-200 dark:border-neutral-600">
                <img
                    src={`${ASSETS_URL}/${business.business_logo}`}
                    alt={business.business_name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
            <div className="flex-grow overflow-hidden">
                <h3 className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{business.business_name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1" title={business.business_slogan}>
                    {business.business_slogan}
                </p>
            </div>
        </button>
    );
};

export const CompactBusinessCardSkeleton: React.FC = () => {
    return (
        <div className="p-3 rounded-lg flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex-shrink-0"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            </div>
        </div>
    );
};

export default CompactBusinessCard;