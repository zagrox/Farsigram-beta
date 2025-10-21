import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LightBulbIcon, UsersIcon, MapPinIcon, TagIcon, SocialIcon } from '../components/Icons';
import { API_BASE_URL, ASSETS_URL } from '../constants';

// --- TYPE DEFINITIONS ---

interface SocialProfile {
  id: number;
  social_network: string;
  social_account: string;
}

interface CampaignSocialJunction {
  socials_id: SocialProfile;
}

interface CampaignAudienceJunction {
  audiences_id: { id: number };
}

interface CampaignLocationJunction {
  locations_id: { id: number };
}

interface CampaignCategoryJunction {
  categories_id: { id: number };
}

interface Campaign {
  id: number;
  campaign_image: string;
  campaign_color: string | null;
  campaign_goal: string;
  campaign_title: string;
  campaign_slogan: string;
  campaign_overview: string;
  campaign_tags: string[] | null;
  campaign_audience: CampaignAudienceJunction[];
  campaign_location: CampaignLocationJunction[];
  campaign_type: CampaignCategoryJunction[];
  campaign_social: CampaignSocialJunction[];
  date_created: string;
  date_updated: string;
}

interface RelatedItem {
    id: number;
    name: string;
}

interface RelatedData {
    audience: RelatedItem[];
    locations: RelatedItem[];
    types: RelatedItem[];
    socials: SocialProfile[];
}

interface CampaignDetailsPageProps {
  campaignId: number;
  onBack: () => void;
  onSelectAudience: (id: number) => void;
  onSelectLocation: (id: number) => void;
  onSelectCategory: (id: number) => void;
}

// --- HELPER FUNCTIONS & COMPONENTS ---

const InfoBlock: React.FC<{ icon: React.ReactNode; label: string; color: string; children: React.ReactNode }> = ({ icon, label, color, children }) => (
    <div className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 w-6 h-6" style={{ color: color }}>{icon}</div>
            <h4 className="font-semibold text-neutral-600 dark:text-neutral-400 text-sm uppercase tracking-wider">{label}</h4>
        </div>
        <div className="flex-grow">{children}</div>
    </div>
);

const CampaignDetailsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-8">
        <div className="aspect-video lg:aspect-[2.4/1] bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="h-28 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
            ))}
        </div>

        <div className="bg-neutral-200 dark:bg-neutral-700 p-8 rounded-xl space-y-6">
            <div className="h-8 bg-neutral-300 dark:bg-neutral-600 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
                <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-5/6"></div>
            </div>
            <div className="h-12 bg-neutral-300 dark:bg-neutral-600 rounded-lg mt-8"></div>
        </div>
    </div>
);


// --- MAIN COMPONENT ---

const CampaignDetailsPage: React.FC<CampaignDetailsPageProps> = ({ campaignId, onBack, onSelectAudience, onSelectLocation, onSelectCategory }) => {
  const { t, i18n } = useTranslation('campaigns');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const fields = '*,campaign_social.socials_id.*,campaign_audience.audiences_id.id,campaign_location.locations_id.id,campaign_type.categories_id.id';
        const campaignRes = await fetch(`${API_BASE_URL}/items/campaigns/${campaignId}?fields=${fields}`);
        if (!campaignRes.ok) throw new Error('Campaign not found');
        
        const campaignData = await campaignRes.json();
        const camp: Campaign = campaignData.data;
        setCampaign(camp);

        const socials: SocialProfile[] = camp.campaign_social?.map(item => item.socials_id).filter(Boolean) || [];
        
        const audienceIds = camp.campaign_audience?.map(item => item.audiences_id.id).filter(Boolean) || [];
        const locationIds = camp.campaign_location?.map(item => item.locations_id.id).filter(Boolean) || [];
        const typeIds = camp.campaign_type?.map(item => item.categories_id.id).filter(Boolean) || [];

        const fetchRelated = async (endpoint: string, ids: number[], nameKey: string): Promise<RelatedItem[]> => {
            if (!ids || ids.length === 0) return [];
            try {
                const res = await fetch(`${API_BASE_URL}/items/${endpoint}?fields=id,${nameKey}&filter[id][_in]=${ids.join(',')}`);
                if (!res.ok) {
                    console.warn(`API request for ${endpoint} failed with status ${res.status}`);
                    return [];
                }
                const data = await res.json();
                if (data && Array.isArray(data.data)) {
                    return data.data.map((item: any) => ({ id: item.id, name: item[nameKey] || `ID: ${item.id}` }));
                }
                return [];
            } catch (error) {
                console.error(`Failed to fetch or parse related data for ${endpoint}:`, error);
                return [];
            }
        };
        
        const fetchLocationDetails = async (ids: number[]): Promise<RelatedItem[]> => {
            if (!ids || ids.length === 0) return [];
            try {
                const locRes = await fetch(`${API_BASE_URL}/items/locations?fields=id,country,country_persian&filter[id][_in]=${ids.join(',')}`);
                if (!locRes.ok) return [];
                const locData = await locRes.json();
                const farsigramLocations: {id: number, country_persian: string, country: string}[] = locData.data;

                const detailPromises = farsigramLocations.map(loc =>
                    fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
                );
                const detailsResults = await Promise.all(detailPromises);

                return farsigramLocations.map((loc, index) => {
                    const detail = detailsResults[index]?.[0];
                    let englishName = detail?.name?.common || loc.country_persian;
                    if (loc.country_persian === 'جهانی') {
                        englishName = 'Global';
                    }
                    return {
                        id: loc.id,
                        name: i18n.language === 'fa' ? loc.country_persian : englishName,
                    };
                });
            } catch (error) {
                console.error(`Failed to fetch location details:`, error);
                return [];
            }
        };

        const [audience, locations, types] = await Promise.all([
            fetchRelated('audiences', audienceIds, 'audience_title'),
            fetchLocationDetails(locationIds),
            fetchRelated('categories', typeIds, 'category_parent'),
        ]);
        
        setRelatedData({ audience, locations, types, socials });

      } catch (err) {
        console.error("Failed to fetch campaign details:", err);
        setError(t('error_details'));
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [campaignId, t, i18n]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  };

  if (loading) {
    return <CampaignDetailsSkeleton />;
  }

  if (error || !campaign) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 font-semibold">{error || t('error_details')}</p>
        <button onClick={onBack} className="mt-4 font-semibold text-primary hover:text-primary-dark">{t('backToCampaigns')}</button>
      </div>
    );
  }

  const themeColor = campaign.campaign_color || '#64748b';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative aspect-video lg:aspect-[2.4/1] rounded-xl overflow-hidden shadow-lg bg-neutral-200 dark:bg-neutral-700">
        <img 
            src={`${ASSETS_URL}/${campaign.campaign_image}`}
            alt={campaign.campaign_title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
          <h1 className="text-3xl lg:text-5xl font-bold" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{campaign.campaign_title}</h1>
          <p className="text-lg lg:text-xl font-medium italic mt-2" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>{campaign.campaign_slogan}</p>
        </div>
      </section>

      {/* Info Grid Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoBlock icon={<LightBulbIcon />} label={t('goal')} color={themeColor}>
            <p className="font-bold text-neutral-800 dark:text-neutral-200 text-lg">{campaign.campaign_goal}</p>
        </InfoBlock>
        
        {relatedData?.audience && relatedData.audience.length > 0 && (
             <InfoBlock icon={<UsersIcon />} label={t('audience')} color={themeColor}>
                <div className="flex flex-wrap gap-2">
                    {relatedData.audience.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => onSelectAudience(item.id)}
                            className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors"
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </InfoBlock>
        )}

        {relatedData?.locations && relatedData.locations.length > 0 && (
             <InfoBlock icon={<MapPinIcon />} label={t('location')} color={themeColor}>
                <div className="flex flex-wrap gap-2">
                    {relatedData.locations.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => onSelectLocation(item.id)}
                            className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors"
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </InfoBlock>
        )}

        {relatedData?.types && relatedData.types.length > 0 && (
             <InfoBlock icon={<TagIcon />} label={t('type')} color={themeColor}>
                <div className="flex flex-wrap gap-2">
                    {relatedData.types.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => onSelectCategory(item.id)}
                            className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors"
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </InfoBlock>
        )}
      </section>
      
      {/* Main Content Section */}
      <section>
         <article className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">{t('overview')}</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                <p>{campaign.campaign_overview}</p>
            </div>

            {campaign.campaign_tags && campaign.campaign_tags.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3 text-neutral-800 dark:text-neutral-200">{t('tags')}</h3>
                    <div className="flex flex-wrap gap-3">
                        {campaign.campaign_tags.map(tag => (
                            <span key={tag} className="text-sm font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            )}

            {relatedData?.socials && relatedData.socials.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3 text-neutral-800 dark:text-neutral-200">{t('social_profiles')}</h3>
                    <div className="flex flex-wrap gap-4">
                        {relatedData.socials.map(social => (
                            <a 
                                key={social.id} 
                                href={`${social.social_network}${social.social_account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                            >
                                <SocialIcon networkUrl={social.social_network} className="w-5 h-5" />
                                <span className="font-medium text-sm">{social.social_account}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8 text-center">
                <button
                    className="w-full sm:w-auto text-center font-bold py-3 px-8 rounded-lg text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 text-lg"
                    style={{
                        backgroundColor: themeColor,
                        '--tw-ring-color': themeColor
                    } as React.CSSProperties}
                >
                    {t('join_campaign')}
                </button>
            </div>

            <div className="mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-4 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row justify-between gap-2 text-center sm:text-left">
                <span><strong>{t('created_on')}:</strong> {formatDate(campaign.date_created)}</span>
                <span><strong>{t('last_updated')}:</strong> {formatDate(campaign.date_updated)}</span>
            </div>
        </article>
      </section>
    </div>
  );
};

export default CampaignDetailsPage;
