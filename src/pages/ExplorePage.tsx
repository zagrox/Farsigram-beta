import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';

// --- TYPE DEFINITIONS ---
interface Campaign {
  id: number;
  campaign_image: string;
  campaign_color: string | null;
  campaign_goal: string;
  campaign_title: string;
}
interface Influencer {
  id: number;
  influencer_name: string;
  influencer_title: string;
  influencer_category: number;
  influencer_location: number;
  influencer_avatar: string;
}
interface Category {
  id: number;
  category_parent: string;
}
interface Location {
  id: number;
  country_persian: string;
}

// --- PROPS ---
interface ExplorePageProps {
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectInfluencer, onSelectCampaign }) => {
    const { t } = useTranslation('explore');

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loadingInfluencers, setLoadingInfluencers] = useState<boolean>(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
    const [errorInfluencers, setErrorInfluencers] = useState<string | null>(null);
    const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestInfluencers = async () => {
            setLoadingInfluencers(true);
            setErrorInfluencers(null);
            try {
                const [influencersRes, categoriesRes, locationsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[status][_eq]=published&limit=10&sort=-date_created`),
                    fetch(`${API_BASE_URL}/items/categories`),
                    fetch(`${API_BASE_URL}/items/locations`),
                ]);
        
                if (!influencersRes.ok || !categoriesRes.ok || !locationsRes.ok) {
                  throw new Error('Network response was not ok');
                }
        
                const influencersData = await influencersRes.json();
                const categoriesData = await categoriesRes.json();
                const locationsData = await locationsRes.json();
        
                const categoriesMap = new Map<number, string>(categoriesData.data.map((c: Category) => [c.id, c.category_parent]));
                const locationsMap = new Map<number, string>(locationsData.data.map((l: Location) => [l.id, l.country_persian]));
        
                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => ({
                  id: inf.id,
                  influencer_name: inf.influencer_name,
                  influencer_title: inf.influencer_title,
                  influencer_avatar: inf.influencer_avatar,
                  categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: locationsMap.get(inf.influencer_location) || 'N/A',
                }));
        
                setInfluencers(enrichedInfluencers);
            } catch (err) {
                console.error("Failed to fetch recent influencers:", err);
                setErrorInfluencers(t('error_loading_influencers'));
            } finally {
                setLoadingInfluencers(false);
            }
        };

        const fetchLatestCampaigns = async () => {
            setLoadingCampaigns(true);
            setErrorCampaigns(null);
            try {
                const response = await fetch(`${API_BASE_URL}/items/campaigns?filter[status][_eq]=published&sort=-date_created&limit=10`);
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCampaigns(data.data);
            } catch (err) {
                console.error("Failed to fetch recent campaigns:", err);
                setErrorCampaigns(t('error_loading_campaigns'));
            } finally {
                setLoadingCampaigns(false);
            }
        };

        fetchLatestInfluencers();
        fetchLatestCampaigns();
    }, [t]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Influencers Column */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('recent_influencers')}</h2>
                <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                    {loadingInfluencers ? (
                        Array.from({ length: 5 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />)
                    ) : errorInfluencers ? (
                        <p className="text-center text-red-500 py-8">{errorInfluencers}</p>
                    ) : influencers.length > 0 ? (
                        influencers.map((influencer) => (
                            <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                        ))
                    ) : (
                        <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_recent_influencers')}</p>
                    )}
                </div>
            </div>
            
            {/* Campaigns Column */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('recent_campaigns')}</h2>
                <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                     {loadingCampaigns ? (
                        Array.from({ length: 5 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)
                    ) : errorCampaigns ? (
                        <p className="text-center text-red-500 py-8">{errorCampaigns}</p>
                    ) : campaigns.length > 0 ? (
                        campaigns.map((campaign) => (
                            <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                        ))
                    ) : (
                        <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_recent_campaigns')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplorePage;