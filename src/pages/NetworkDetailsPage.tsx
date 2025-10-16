import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import { SocialIcon, ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';

// --- TYPE DEFINITIONS (mirrored from other pages for consistency) ---
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
interface NetworkDetailsPageProps {
  networkUrl: string;
  onBack: () => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
}

// --- HELPER FUNCTION ---
const getSocialNetworkName = (url: string): string => {
    if (!url) return '';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) return 'X (Twitter)';
    if (lowerUrl.includes('instagram.com')) return 'Instagram';
    if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) return 'Telegram';
    if (lowerUrl.includes('youtube.com')) return 'YouTube';
    if (lowerUrl.includes('tiktok.com')) return 'TikTok';
    if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) return 'WhatsApp';
    if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowerUrl.includes('facebook.com')) return 'Facebook';
    return 'Social Link';
};

// --- MAIN COMPONENT ---
const NetworkDetailsPage: React.FC<NetworkDetailsPageProps> = ({ networkUrl, onBack, onSelectInfluencer, onSelectCampaign }) => {
    const { t, i18n } = useTranslation('categories');

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loadingInfluencers, setLoadingInfluencers] = useState<boolean>(true);
    const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(true);
    const [errorInfluencers, setErrorInfluencers] = useState<string | null>(null);
    const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);

    useEffect(() => {
        const fetchNetworkData = async () => {
            setLoadingInfluencers(true);
            setLoadingCampaigns(true);
            setErrorInfluencers(null);
            setErrorCampaigns(null);
            
            // Fetch Influencers
            try {
                const [influencersRes, categoriesRes, locationsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[influencer_social][socials_id][social_network][_eq]=${networkUrl}&filter[status][_eq]=published`),
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
                  influencer_title: inf.influencer_title,
                  influencer_avatar: inf.influencer_avatar,
                  categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                  locationName: locationsMap.get(inf.influencer_location) || 'N/A',
                }));
        
                setInfluencers(enrichedInfluencers);
            } catch (err) {
                console.error("Failed to fetch influencers for network:", err);
                setErrorInfluencers(t('error_loading_influencers'));
            } finally {
                setLoadingInfluencers(false);
            }
            
            // Fetch Campaigns
            try {
                const campaignsRes = await fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_social][socials_id][social_network][_eq]=${networkUrl}&filter[status][_eq]=published`);
                if (!campaignsRes.ok) throw new Error('Network response was not ok');
                const campaignsData = await campaignsRes.json();
                setCampaigns(campaignsData.data);
            } catch (err) {
                console.error("Failed to fetch campaigns for network:", err);
                setErrorCampaigns(t('error_loading_campaigns'));
            } finally {
                setLoadingCampaigns(false);
            }
        };

        if (networkUrl) {
            fetchNetworkData();
        }
    }, [networkUrl, t]);

    const networkName = getSocialNetworkName(networkUrl);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
                    aria-label={t('back_to_categories')}
                >
                    {i18n.dir() === 'rtl' ? <ArrowRightIcon className="w-6 h-6" /> : <ArrowLeftIcon className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-800/50 p-3 rounded-xl shadow-sm">
                    <SocialIcon networkUrl={networkUrl} className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {t('network_details_title', { networkName })}
                    </h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Influencers Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_on_network', { networkName })}</h2>
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
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_influencers_found')}</p>
                        )}
                    </div>
                </div>
                
                {/* Campaigns Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('campaigns_on_network', { networkName })}</h2>
                    <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                         {loadingCampaigns ? (
                            Array.from({ length: 4 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)
                        ) : errorCampaigns ? (
                            <p className="text-center text-red-500 py-8">{errorCampaigns}</p>
                        ) : campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkDetailsPage;