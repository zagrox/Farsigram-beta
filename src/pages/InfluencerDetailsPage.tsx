import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GiftIcon, UsersIcon, MapPinIcon, CategoryIcon, SocialIcon } from '../components/Icons';
import { API_BASE_URL, ASSETS_URL } from '../constants';
import Button from '../components/ui/Button';
import RelatedInfluencers from '../components/ui/RelatedInfluencers';

// --- TYPE DEFINITIONS ---
interface SocialProfile {
  id: number;
  social_network: string;
  social_account: string;
}

interface InfluencerSocialJunction {
  socials_id: SocialProfile;
}

interface Influencer {
  id: number;
  influencer_name: string;
  influencer_title: string;
  influencer_bio: string;
  influencer_category: number;
  influencer_location: number;
  influencer_gender: "male" | "female" | "trans";
  influencer_birthdate: string;
  influencer_hub: boolean;
  influencer_avatar: string;
  influencer_audience: number[];
  influencer_social: InfluencerSocialJunction[];
}

interface RelatedItem {
  id: number;
  name: string;
}

interface LocationRelatedItem extends RelatedItem {
    flagUrl?: string;
    englishName?: string;
}

interface RelatedData {
    category: RelatedItem | null;
    location: LocationRelatedItem | null;
    audience: RelatedItem[];
    socials: SocialProfile[];
}

interface InfluencerDetailsPageProps {
  influencerId: number;
  onBack: () => void;
  onSelectAudience: (id: number) => void;
  onSelectLocation: (id: number) => void;
  onSelectCategory: (id: number) => void;
  onSelectInfluencer: (id: number) => void;
}

// --- HELPER COMPONENTS ---
const InfoBlock: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="flex-shrink-0 w-5 h-5 text-primary">{icon}</div>
            <h4 className="font-semibold text-neutral-600 dark:text-neutral-400 text-sm uppercase tracking-wider">{label}</h4>
        </div>
        <div className="text-right">{children}</div>
    </div>
);

const InfluencerDetailsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-neutral-200 dark:bg-neutral-700 rounded-xl">
            <div className="w-40 h-40 rounded-full bg-neutral-300 dark:bg-neutral-600"></div>
            <div className="flex-1 space-y-4">
                <div className="h-10 bg-neutral-300 dark:bg-neutral-600 rounded w-1/2"></div>
                <div className="h-6 bg-neutral-300 dark:bg-neutral-600 rounded w-1/3"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
            ))}
        </div>
        <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
    </div>
);

// --- MAIN COMPONENT ---
const InfluencerDetailsPage: React.FC<InfluencerDetailsPageProps> = ({ influencerId, onBack, onSelectAudience, onSelectLocation, onSelectCategory, onSelectInfluencer }) => {
  const { t, i18n } = useTranslation('influencers');
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to top when influencerId changes
    window.scrollTo(0, 0);
    
    const fetchInfluencerDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const influencerRes = await fetch(`${API_BASE_URL}/items/influencers/${influencerId}?fields=*,influencer_social.socials_id.*`);
        if (!influencerRes.ok) throw new Error('Influencer not found');
        const influencerData = await influencerRes.json();
        const inf: Influencer | null = influencerData?.data;
        if (!inf) {
            throw new Error('Influencer data is missing in API response');
        }
        setInfluencer(inf);
        
        const socials: SocialProfile[] = inf.influencer_social?.map(item => item.socials_id).filter(Boolean) || [];

        const fetchSingleItem = async (endpoint: string, id: number, nameKey: string): Promise<RelatedItem | null> => {
            if (!id) return null;
            try {
                const res = await fetch(`${API_BASE_URL}/items/${endpoint}/${id}?fields=id,${nameKey}`);
                if (!res.ok) return null;
                const data = await res.json();
                const item = data?.data;
                if (item) {
                    return { id: item.id, name: item[nameKey] || `ID: ${item.id}` };
                }
                return null;
            } catch (err) {
                console.error(`Failed to fetch single item from ${endpoint}:`, err);
                return null;
            }
        };

        const fetchMultipleItems = async (endpoint: string, ids: number[], nameKey: string): Promise<RelatedItem[]> => {
            if (!ids || ids.length === 0) return [];
            try {
                const res = await fetch(`${API_BASE_URL}/items/${endpoint}?fields=id,${nameKey}&filter[id][_in]=${ids.join(',')}`);
                if (!res.ok) return [];
                const data = await res.json();
                const items = data?.data;
                if (Array.isArray(items)) {
                    return items.map((item: any) => ({ id: item.id, name: item[nameKey] || `ID: ${item.id}` }));
                }
                return [];
            } catch (err) {
                console.error(`Failed to fetch multiple items from ${endpoint}:`, err);
                return [];
            }
        };

        const fetchLocationDetails = async (locationId: number): Promise<LocationRelatedItem | null> => {
            if (!locationId) return null;
            try {
                const locRes = await fetch(`${API_BASE_URL}/items/locations/${locationId}?fields=id,country,country_persian`);
                if (!locRes.ok) return null;
                const locData = await locRes.json();
                const locationItem = locData?.data;
                if (!locationItem) return null;

                const details: LocationRelatedItem = {
                    id: locationItem.id,
                    name: locationItem.country_persian, // Persian name
                };

                if (locationItem.country) {
                    try {
                        const countryRes = await fetch(`https://restcountries.com/v3.1/alpha/${locationItem.country}`);
                        if (countryRes.ok) {
                            const countryData = await countryRes.json();
                            const countryDetail = countryData[0];
                            details.englishName = countryDetail?.name?.common;
                            details.flagUrl = countryDetail?.flags?.svg;
                        }
                    } catch (e) {
                        console.warn(`Could not fetch details for country code ${locationItem.country}:`, e);
                    }
                }
                
                if (details.name === 'جهانی') {
                    details.englishName = 'Global';
                }
                
                return details;
            } catch (err) {
                console.error(`Failed to fetch location details:`, err);
                return null;
            }
        };

        const [category, location, audience] = await Promise.all([
            fetchSingleItem('categories', inf.influencer_category, 'category_parent'),
            fetchLocationDetails(inf.influencer_location),
            fetchMultipleItems('audiences', inf.influencer_audience, 'audience_title'),
        ]);
        
        setRelatedData({ category, location, audience, socials });
      } catch (err) {
        console.error("Failed to fetch influencer details:", err);
        setError(t('error_details'));
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencerDetails();
  }, [influencerId, t]);

  const calculateAge = (birthdate: string) => {
      if (!birthdate) return 'N/A';
      const birthDate = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  };

  if (loading) {
    return <InfluencerDetailsSkeleton />;
  }

  if (error || !influencer) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 font-semibold">{error || t('error_details')}</p>
        <Button onClick={onBack}>{t('backToInfluencers')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <img 
                src={`${ASSETS_URL}/${influencer.influencer_avatar}`}
                alt={influencer.influencer_name}
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-white dark:border-neutral-800 shadow-lg"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="text-center md:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold">{influencer.influencer_name}</h1>
                {influencer.influencer_title && (
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-1">{influencer.influencer_title}</p>
                )}
                {influencer.influencer_hub && (
                    <span className="mt-2 inline-block bg-secondary/20 text-secondary-dark font-bold text-xs px-3 py-1 rounded-full">
                        {t('partOfHub')}
                    </span>
                )}
            </div>
        </div>
      </section>

      {/* Info Grid Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoBlock icon={<CategoryIcon />} label={t('category')}>
            {relatedData?.category ? (
                <button 
                    onClick={() => onSelectCategory(relatedData.category!.id)}
                    className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                    {relatedData.category.name}
                </button>
            ) : (
                <p className="font-bold text-neutral-800 dark:text-neutral-200">N/A</p>
            )}
        </InfoBlock>
        <InfoBlock icon={<GiftIcon />} label={t('age')}>
            <p className="font-bold text-neutral-800 dark:text-neutral-200">{calculateAge(influencer.influencer_birthdate)}</p>
        </InfoBlock>
         <InfoBlock icon={<UsersIcon />} label={t('gender')}>
            <p className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">{t(influencer.influencer_gender)}</p>
        </InfoBlock>
        <InfoBlock icon={<MapPinIcon />} label={t('location')}>
            {relatedData?.location ? (
                 <button 
                    onClick={() => onSelectLocation(relatedData.location!.id)}
                    className="font-bold text-neutral-800 dark:text-neutral-200 hover:text-primary dark:hover:text-primary-light transition-colors flex items-center gap-3"
                >
                    {relatedData.location.flagUrl && (
                        <img 
                            src={relatedData.location.flagUrl} 
                            alt=""
                            className="w-8 h-auto rounded-sm border border-neutral-200 dark:border-neutral-700"
                        />
                    )}
                    <span>
                      {i18n.language === 'fa' 
                          ? relatedData.location.name 
                          : relatedData.location.englishName || relatedData.location.name}
                    </span>
                </button>
            ) : (
                <p className="font-bold text-neutral-800 dark:text-neutral-200">N/A</p>
            )}
        </InfoBlock>
      </section>
      
      {/* Main Content Section */}
      <section className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md">
        {relatedData?.audience && relatedData.audience.length > 0 && (
            <div>
                <h3 className="text-lg font-bold mb-3 text-neutral-800 dark:text-neutral-200">{t('audience')}</h3>
                <div className="flex flex-wrap gap-3">
                    {relatedData.audience.map(aud => (
                        <button 
                            key={aud.id} 
                            onClick={() => onSelectAudience(aud.id)}
                            className="text-sm font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 transition-colors"
                        >
                            {aud.name}
                        </button>
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

        {influencer.influencer_bio && (
            <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-bold mb-3 text-neutral-800 dark:text-neutral-200">{t('bio')}</h3>
                <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                    <p>{influencer.influencer_bio}</p>
                </div>
            </div>
        )}
      </section>

      {/* Related Influencers Section */}
      <div className="max-w-5xl mx-auto">
        <RelatedInfluencers
          currentInfluencerId={influencer.id}
          locationId={influencer.influencer_location}
          categoryId={influencer.influencer_category}
          gender={influencer.influencer_gender}
          onSelectInfluencer={onSelectInfluencer}
        />
      </div>
    </div>
  );
};

export default InfluencerDetailsPage;