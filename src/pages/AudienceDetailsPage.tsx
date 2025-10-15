import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import { UsersIcon, ArrowLeftIcon } from '../components/Icons';

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
interface Location {
  id: number;
  country_persian: string;
}
interface Audience {
    id: number;
    audience_title: string;
    audience_color: string | null;
}

// --- PROPS ---
interface AudienceDetailsPageProps {
  audienceId: number;
  onBack: () => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}

// --- MAIN COMPONENT ---
const AudienceDetailsPage: React.FC<AudienceDetailsPageProps> = ({ audienceId, onBack, onSelectInfluencer, onSelectCampaign }) => {
    const { t } = useTranslation('categories');

    const [audience, setAudience] = useState<Audience | null>(null);
    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchAudienceData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch Audience details first
                const audienceRes = await fetch(`${API_BASE_URL}/items/audiences/${audienceId}`);
                if (!audienceRes.ok) throw new Error('Could not fetch audience details');
                const audienceData = await audienceRes.json();
                setAudience(audienceData.data);

                // Fetch Influencers targeting this audience
                const [influencersRes, categoriesRes, locationsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[influencer_audience][audiences_id][_eq]=${audienceId}&filter[status][_eq]=published`),
                    fetch(`${API_BASE_URL}/items/categories`),
                    fetch(`${API_BASE_URL}/items/locations`),
                ]);
                if (!influencersRes.ok || !categoriesRes.ok || !locationsRes.ok) {
                  throw new Error('Network response was not ok for influencer enrichment');
                }
                const influencersData = await influencersRes.json();
                const categoriesData = await categoriesRes.json();
                const locationsData = await locationsRes.json();
                const categoriesMap = new Map<number, string>(categoriesData.data.map((c: Category) => [c.id, c.category_parent]));
                const locationsMap = new Map<number, string>(locationsData.data.map((l: Location) => [l.id, l.country_persian]));
                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => ({
                  id: inf.id,
                  influencer_name: inf.influencer_name,
                  influencer_avatar: inf.influencer_avatar,
                  categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: locationsMap.get(inf.influencer_location) || 'N/A',
                }));
                setInfluencers(enrichedInfluencers);

                // Fetch Campaigns targeting this audience
                const campaignsRes = await fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_audience][audiences_id][_eq]=${audienceId}&filter[status][_eq]=published`);
                if (!campaignsRes.ok) throw new Error('Network response was not ok for campaigns');
                const campaignsData = await campaignsRes.json();
                setCampaigns(campaignsData.data);

            } catch (err) {
                console.error("Failed to fetch audience data:", err);
                setError(t('error_loading_influencers_for_audience'));
            } finally {
                setLoading(false);
            }
        };

        if (audienceId) {
            fetchAudienceData();
        }
    }, [audienceId, t]);

    const audienceName = audience?.audience_title || '';
    const themeColor = audience?.audience_color || '#0D9488'; // Primary color fallback

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-16 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
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

     if (error || !audience) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-semibold">{error || "Audience not found."}</p>
                <button onClick={onBack} className="mt-4 font-semibold text-primary hover:text-primary-dark">{t('back_to_categories')}</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label={t('back_to_categories')}
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-800/50 p-3 rounded-xl shadow-sm">
                    <UsersIcon className="w-8 h-8" style={{ color: themeColor }}/>
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {t('audience_details_title', { audienceName })}
                    </h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Influencers Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_for_audience', { audienceName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {influencers.length > 0 ? (
                            influencers.map((influencer) => (
                                <CompactInfluencerCard key={influencer.id} influencer={influencer} onSelectInfluencer={onSelectInfluencer} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_influencers_found_for_audience')}</p>
                        )}
                     </div>
                </div>
                
                {/* Campaigns Column */}
                 <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                     <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns_for_audience', { audienceName })}</h2>
                     <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found_for_audience')}</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AudienceDetailsPage;