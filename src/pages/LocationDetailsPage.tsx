import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';

// --- TYPE DEFINITIONS ---
interface Campaign {
  id: number;
  status: string;
  campaign_image: string;
  campaign_color: string | null;
  campaign_goal: string;
  campaign_title: string;
  campaign_slogan: string;
  campaign_overview: string;
}
interface Influencer {
  id: number;
  influencer_name: string;
  influencer_category: number;
  influencer_location: number;
  influencer_avatar: string;
}
interface Category {
  id: number;
  category_parent: string;
}

interface LocationDetails {
    id: number;
    countryCode: string; // e.g., "TR"
    persianName: string;
    flagUrl: string;
    commonName: string;
}

// --- PROPS ---
interface LocationDetailsPageProps {
  locationId: number;
  onBack: () => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}


// --- MAIN COMPONENT ---
const LocationDetailsPage: React.FC<LocationDetailsPageProps> = ({ locationId, onBack, onSelectInfluencer, onSelectCampaign }) => {
    const { t, i18n } = useTranslation('explore');

    const [location, setLocation] = useState<LocationDetails | null>(null);
    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchLocationData = async () => {
            if (!locationId) return;

            setLoading(true);
            setError(null);
            
            try {
                // 1. Fetch Location Details
                const locationRes = await fetch(`${API_BASE_URL}/items/locations/${locationId}`);
                if (!locationRes.ok) throw new Error('Location not found');
                const locationData = await locationRes.json();
                const farsigramLocation = locationData.data;

                const restCountriesRes = await fetch(`https://restcountries.com/v3.1/alpha/${farsigramLocation.country}`);
                if (!restCountriesRes.ok) throw new Error('Country details not found');
                const restCountriesData = await restCountriesRes.json();
                const countryDetail = restCountriesData[0];

                setLocation({
                    id: farsigramLocation.id,
                    countryCode: farsigramLocation.country,
                    persianName: farsigramLocation.country_persian,
                    commonName: countryDetail.name.common,
                    flagUrl: countryDetail.flags.svg,
                });

                // 2. Fetch Influencers and Campaigns in parallel
                const [influencersPromise, campaignsPromise] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[influencer_location][_eq]=${locationId}&filter[status][_eq]=published`),
                    fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_location][locations_id][_eq]=${locationId}&filter[status][_eq]=published`),
                ]);
                
                // 3. Process Influencers
                if (!influencersPromise.ok) throw new Error('Failed to fetch influencers');
                const influencersData = await influencersPromise.json();

                // Enrich influencers (could be moved to a shared hook)
                const [categoriesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/categories`),
                ]);
                if (!categoriesRes.ok) throw new Error('Failed to fetch categories for enrichment');
                const categoriesData = await categoriesRes.json();
                const categoriesMap = new Map<number, string>(categoriesData.data.map((c: Category) => [c.id, c.category_parent]));

                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => ({
                  id: inf.id,
                  influencer_name: inf.influencer_name,
                  influencer_avatar: inf.influencer_avatar,
                  categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: farsigramLocation.country_persian,
                }));
                setInfluencers(enrichedInfluencers);

                // 4. Process Campaigns
                if (!campaignsPromise.ok) throw new Error('Failed to fetch campaigns');
                const campaignsData = await campaignsPromise.json();
                setCampaigns(campaignsData.data);

            } catch (err) {
                console.error("Failed to fetch location data:", err);
                setError(t('errorLoadingLocations'));
            } finally {
                setLoading(false);
            }
        };

        fetchLocationData();
    }, [locationId, t]);

    if (loading) {
        return (
             <div className="space-y-8 animate-pulse">
                <div className="h-16 w-3/4 md:w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 space-y-3">
                         <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                         {Array.from({ length: 5 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />)}
                    </div>
                     <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 space-y-3">
                         <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
                         {Array.from({ length: 4 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)}
                    </div>
                </div>
            </div>
        )
    }

    if (error || !location) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-semibold">{error || "Location not found."}</p>
                <button onClick={onBack} className="mt-4 font-semibold text-primary hover:text-primary-dark">{t('back_to_explore')}</button>
            </div>
        );
    }
    
    const locationName = i18n.language === 'fa' ? location.persianName : location.commonName;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label={t('back_to_explore')}
                >
                    {i18n.dir() === 'rtl' ? <ArrowRightIcon className="w-6 h-6" /> : <ArrowLeftIcon className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-800/50 p-3 rounded-xl shadow-sm">
                    <img src={location.flagUrl} alt={`Flag of ${location.commonName}`} className="w-12 h-auto rounded-md border border-neutral-200 dark:border-neutral-700" />
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {t('location_details_title', { locationName })}
                    </h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Influencers Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_in_location', { locationName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {influencers.length > 0 ? (
                            influencers.map((influencer) => (
                                <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_influencers_found_in_location')}</p>
                        )}
                     </div>
                </div>
                
                {/* Campaigns Column */}
                 <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns_in_location', { locationName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found_in_location')}</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default LocationDetailsPage;