import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../constants';

import { EnrichedInfluencer } from '../components/ui/InfluencerCard';
import CompactInfluencerCard, { CompactInfluencerCardSkeleton } from '../components/ui/CompactInfluencerCard';
import CompactCampaignCard, { CompactCampaignCardSkeleton } from '../components/ui/CompactCampaignCard';
import CompactBusinessCard, { CompactBusinessCardSkeleton } from '../components/ui/CompactBusinessCard';
import { SocialIcon, ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';

// --- TYPE DEFINITIONS (mirrored from other pages for consistency) ---
interface Campaign {
  id: number;
  status: string;
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
  influencer_hub: boolean;
  influencer_social: { socials_id: { id: number; social_network: string; social_account: string; } }[];
  influencer_audience: { audiences_id: { id: number; audience_title: string; } }[];
}
interface Business {
  id: number;
  business_logo: string;
  business_name: string;
  business_slogan: string;
}
interface Category {
  id: number;
  category_parent: string;
}
interface Location {
  id: number;
  country: string;
  country_persian: string;
}

// --- PROPS ---
interface NetworkDetailsPageProps {
  networkUrl: string;
  onBack: () => void;
  onSelectInfluencer: (id: number) => void;
  onSelectCampaign: (id: number) => void;
  onSelectBusiness: (id: number) => void;
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
const NetworkDetailsPage: React.FC<NetworkDetailsPageProps> = ({ networkUrl, onBack, onSelectInfluencer, onSelectCampaign, onSelectBusiness }) => {
    const { t, i18n } = useTranslation('categories');

    const [influencers, setInfluencers] = useState<EnrichedInfluencer[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNetworkData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const [influencersRes, categoriesRes, locationsRes, campaignsRes, businessesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/items/influencers?filter[influencer_social][socials_id][social_network][_eq]=${networkUrl}&filter[status][_eq]=published&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*`),
                    fetch(`${API_BASE_URL}/items/categories?fields=id,category_parent&limit=-1`),
                    fetch(`${API_BASE_URL}/items/locations?fields=id,country,country_persian&limit=-1`),
                    fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_social][socials_id][social_network][_eq]=${networkUrl}&filter[status][_eq]=published`),
                    fetch(`${API_BASE_URL}/items/business?filter[business_social][socials_id][social_network][_eq]=${networkUrl}&filter[status][_eq]=published&fields=id,business_logo,business_name,business_slogan`)
                ]);
        
                // Process Influencers
                if (!influencersRes.ok || !categoriesRes.ok || !locationsRes.ok) {
                  throw new Error(t('error_loading_influencers'));
                }
                const influencersData = await influencersRes.json();
                const categoriesData = await categoriesRes.json();
                const locationsData = await locationsRes.json();
                const categoriesMap = new Map<number, string>(categoriesData.data.map((c: Category) => [c.id, c.category_parent]));
                
                const farsigramLocations: Location[] = locationsData.data;
                const detailPromises = farsigramLocations.map(loc =>
                    fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
                );
                const detailsResults = await Promise.all(detailPromises);

                const locationsMap = new Map(farsigramLocations.map((loc, index) => {
                    const detail = detailsResults[index]?.[0];
                    return [loc.id, {
                        persian: loc.country_persian,
                        english: detail?.name?.common || loc.country_persian
                    }];
                }));
        
                const enrichedInfluencers = influencersData.data.map((inf: Influencer): EnrichedInfluencer => {
                    const locationInfo = locationsMap.get(inf.influencer_location);
                    const locationName = i18n.language === 'fa' 
                        ? (locationInfo?.persian || 'N/A') 
                        : (locationInfo?.english || locationInfo?.persian || 'N/A');

                    return {
                      id: inf.id,
                      influencer_name: inf.influencer_name,
                      influencer_title: inf.influencer_title,
                      influencer_avatar: inf.influencer_avatar,
                      categoryName: categoriesMap.get(inf.influencer_category) || 'N/A',
                      locationName: locationName,
                      isHubMember: inf.influencer_hub || false,
                      socials: inf.influencer_social?.map(j => j.socials_id).filter(Boolean) || [],
                      audiences: inf.influencer_audience?.map(j => ({
                        id: j.audiences_id.id,
                        name: j.audiences_id.audience_title,
                      })).filter(a => a.id && a.name) || [],
                    };
                });
                setInfluencers(enrichedInfluencers);

                // Process Campaigns
                if (!campaignsRes.ok) throw new Error(t('error_loading_campaigns'));
                const campaignsData = await campaignsRes.json();
                setCampaigns(campaignsData.data);
                
                // Process Businesses
                if (!businessesRes.ok) throw new Error(t('error_loading_businesses_on_network'));
                const businessesData = await businessesRes.json();
                setBusinesses(businessesData.data);
                
            } catch (err: any) {
                console.error("Failed to fetch network data:", err);
                setError(err.message || 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (networkUrl) {
            fetchNetworkData();
        }
    }, [networkUrl, t, i18n.language]);

    const networkName = getSocialNetworkName(networkUrl);

    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
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
                    {i18n.dir() === 'rtl' ? <ArrowRightIcon className="w-6 h-6" /> : <ArrowLeftIcon className="w-6 h-6" />}
                </button>
                <div className="flex items-center gap-3 bg-white dark:bg-neutral-800/50 p-3 rounded-xl shadow-sm">
                    <SocialIcon networkUrl={networkUrl} className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                        {t('network_details_title', { networkName })}
                    </h1>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Influencers Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('influencers_on_network', { networkName })}</h2>
                    <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => <CompactInfluencerCardSkeleton key={index} />)
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
                         {loading ? (
                            Array.from({ length: 4 }).map((_, index) => <CompactCampaignCardSkeleton key={index} />)
                        ) : campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <CompactCampaignCard key={campaign.id} campaign={campaign} onSelectCampaign={onSelectCampaign} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_campaigns_found')}</p>
                        )}
                    </div>
                </div>

                {/* Businesses Column */}
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-neutral-200">{t('businesses_on_network', { networkName })}</h2>
                    <div className="space-y-3 overflow-y-auto no-scrollbar flex-grow pr-2">
                         {loading ? (
                            Array.from({ length: 4 }).map((_, index) => <CompactBusinessCardSkeleton key={index} />)
                        ) : businesses.length > 0 ? (
                            businesses.map((business) => (
                                <CompactBusinessCard key={business.id} business={business} onSelectBusiness={onSelectBusiness} />
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">{t('no_businesses_found_on_network')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkDetailsPage;