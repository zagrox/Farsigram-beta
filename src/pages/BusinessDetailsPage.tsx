import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryIcon, UsersIcon, MapPinIcon, SocialIcon, GlobeAltIcon, PhoneIcon, GiftIcon } from '../components/Icons';
import { API_BASE_URL, ASSETS_URL } from '../constants';

// --- TYPE DEFINITIONS ---

interface SocialProfile {
  id: number;
  social_network: string;
  social_account: string;
}

interface Business {
  id: number;
  business_logo: string;
  business_color: string | null;
  business_name: string;
  business_slogan: string;
  business_summary: string;
  business_tags: string[] | null;
  business_category: number;
  business_location: number;
  business_audience: number[];
  business_social: number[];
  business_website?: string;
  business_whatsapp?: string;
  business_phone?: string;
  business_zipcode?: string;
  business_age: string;
  date_created: string;
  date_updated: string;
}

interface RelatedItem {
    id: number;
    name: string;
}

interface RelatedData {
    audience: RelatedItem[];
    location: RelatedItem | null;
    category: RelatedItem | null;
    socials: SocialProfile[];
}

interface BusinessDetailsPageProps {
  businessId: number;
  onBack: () => void;
  onSelectAudience: (id: number) => void;
  onSelectLocation: (id: number) => void;
  onSelectCategory: (id: number) => void;
}

// --- HELPER COMPONENTS ---

const InfoBlock: React.FC<{ icon: React.ReactNode; label: string; color: string; children: React.ReactNode }> = ({ icon, label, color, children }) => (
    <div className="bg-white dark:bg-neutral-800/50 p-4 rounded-xl shadow-md flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 w-6 h-6" style={{ color: color }}>{icon}</div>
            <h4 className="font-semibold text-neutral-600 dark:text-neutral-400 text-sm uppercase tracking-wider">{label}</h4>
        </div>
        <div className="flex-grow flex items-center justify-end">{children}</div>
    </div>
);

const BusinessDetailsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-8">
        <div className="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-xl"></div>
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
            </div>
        </div>
    </div>
);


// --- MAIN COMPONENT ---

const BusinessDetailsPage: React.FC<BusinessDetailsPageProps> = ({ businessId, onBack, onSelectAudience, onSelectLocation, onSelectCategory }) => {
  const { t, i18n } = useTranslation('business');
  const [business, setBusiness] = useState<Business | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const businessRes = await fetch(`${API_BASE_URL}/items/business/${businessId}`);
        if (!businessRes.ok) throw new Error('Business not found');
        
        const businessData = await businessRes.json();
        const biz: Business | null = businessData?.data;
        if (!biz) {
          throw new Error('Business data could not be loaded from the API.');
        }
        setBusiness(biz);

        const fetchMultiple = async (endpoint: string, ids: number[], nameKey: string): Promise<RelatedItem[]> => {
            if (!ids || ids.length === 0) return [];
            const res = await fetch(`${API_BASE_URL}/items/${endpoint}?fields=id,${nameKey}&filter[id][_in]=${ids.join(',')}`);
            if (!res.ok) return [];
            const data = await res.json();
            if (data && Array.isArray(data?.data)) {
              return data.data.map((item: any) => ({ id: item.id, name: item[nameKey] }));
            }
            return [];
        };
        
        const fetchSingle = async (endpoint: string, id: number, nameKey: string): Promise<RelatedItem | null> => {
            if (!id) return null;
            const res = await fetch(`${API_BASE_URL}/items/${endpoint}/${id}?fields=id,${nameKey}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.data) {
                return { id: data.data.id, name: data.data[nameKey] };
            }
            return null;
        };

        const fetchLocationDetails = async (id: number): Promise<RelatedItem | null> => {
            if (!id) return null;
            try {
                const locRes = await fetch(`${API_BASE_URL}/items/locations/${id}?fields=id,country,country_persian`);
                if (!locRes.ok) return null;
                const locData = await locRes.json();
                const detail = locData?.data;
                if (!detail) return null;
                
                let englishName = detail.country_persian; // fallback
                if (detail.country) {
                    try {
                        const restCountriesRes = await fetch(`https://restcountries.com/v3.1/alpha/${detail.country}`);
                        if (restCountriesRes.ok) {
                            const restData = await restCountriesRes.json();
                            const countryDetail = restData[0];
                            if (countryDetail && countryDetail.name) {
                                englishName = countryDetail.name.common;
                            }
                        }
                    } catch (e) {
                        console.warn(`Could not fetch country details for ${detail.country}`);
                    }
                }
                 if (detail.country_persian === 'جهانی') {
                    englishName = 'Global';
                }

                return { id: detail.id, name: i18n.language === 'fa' ? detail.country_persian : englishName };
            } catch (e) {
                return null;
            }
        };

        const fetchSocials = async (ids: number[]): Promise<SocialProfile[]> => {
            if (!ids || ids.length === 0) return [];
            try {
                const res = await fetch(`${API_BASE_URL}/items/socials?fields=*&filter[id][_in]=${ids.join(',')}`);
                if (!res.ok) return [];
                const data = await res.json();
                return data?.data || [];
            } catch (e) {
                return [];
            }
        };

        const fetchAudienceIdsFromJunction = async (junctionIds: number[]): Promise<number[]> => {
            if (!junctionIds || junctionIds.length === 0) return [];
            try {
                const junctionRes = await fetch(`${API_BASE_URL}/items/business_audiences?fields=audiences_id&filter[id][_in]=${junctionIds.join(',')}`);
                if (!junctionRes.ok) return [];
                const junctionData = await junctionRes.json();
                return junctionData?.data
                    ?.map((item: { audiences_id: number }) => item.audiences_id)
                    .filter((id: number | null): id is number => id !== null) || [];
            } catch (error) {
                console.error(`Failed to fetch audience IDs from junction table:`, error);
                return [];
            }
        };
        
        const audienceItemIds = await fetchAudienceIdsFromJunction(biz.business_audience);

        const [audience, location, category, socials] = await Promise.all([
            fetchMultiple('audiences', audienceItemIds, 'audience_title'),
            fetchLocationDetails(biz.business_location),
            fetchSingle('categories', biz.business_category, 'category_parent'),
            fetchSocials(biz.business_social),
        ]);
        
        setRelatedData({ audience, location, category, socials });

      } catch (err) {
        console.error("Failed to fetch business details:", err);
        setError(t('error_details'));
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessId, t, i18n.language]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  };
  
  if (loading) return <BusinessDetailsSkeleton />;
  if (error || !business) {
    return (
      <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400 font-semibold">{error || t('error_details')}</p>
        <button onClick={onBack} className="mt-4 font-semibold text-primary hover:text-primary-dark">{t('backToBusinesses')}</button>
      </div>
    );
  }

  const themeColor = business.business_color || '#64748b';
  const contactButtonClasses = "inline-flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 py-3 px-4 rounded-xl transition-all duration-200 font-semibold text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary-light hover:-translate-y-0.5 hover:shadow-lg";


  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-xl shadow-lg bg-white dark:bg-neutral-800/50 p-6 md:p-8" style={{ backgroundColor: themeColor + "20" }}>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center p-4 shadow-md">
                      <img 
                          src={`${ASSETS_URL}/${business.business_logo}`}
                          alt={business.business_name}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer-when-downgrade"
                      />
                  </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                      <h1 className="text-3xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100">{business.business_name}</h1>
                      <p className="text-lg lg:text-xl font-medium italic mt-2 text-neutral-600 dark:text-neutral-400">{business.business_slogan}</p>
                  </div>
                  {relatedData?.socials && relatedData.socials.length > 0 && (
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          {relatedData.socials.map(social => (
                              <a 
                                  key={social.id} 
                                  href={`${social.social_network}${social.social_account}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-light transition-transform hover:scale-110"
                                  aria-label={social.social_account}
                              >
                                  <SocialIcon networkUrl={social.social_network} className="w-6 h-6" />
                              </a>
                          ))}
                      </div>
                  )}
              </div>
              <div className="flex flex-col items-stretch justify-center gap-3 self-center md:self-center w-full max-w-xs md:w-auto md:max-w-none">
                  {business.business_website && <a href={`https://${business.business_website}`} target="_blank" rel="noopener noreferrer" className={contactButtonClasses}><GlobeAltIcon className="w-5 h-5"/><span>{t('website')}</span></a>}
                  {business.business_whatsapp && <a href={`https://wa.me/${business.business_whatsapp.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className={contactButtonClasses}><SocialIcon networkUrl="whatsapp.com" className="w-5 h-5"/><span>{t('whatsapp')}</span></a>}
                  {business.business_phone && <a href={`tel:${business.business_phone}`} className={contactButtonClasses}><PhoneIcon className="w-5 h-5"/><span>{t('phone')}</span></a>}
              </div>
          </div>
      </section>

      {/* Info Grid Section */}
       <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedData?.category && (
            <InfoBlock icon={<CategoryIcon />} label={t('category')} color={themeColor}>
                <button 
                    onClick={() => onSelectCategory(relatedData.category!.id)}
                    className="text-md font-bold text-neutral-800 dark:text-neutral-200 hover:text-primary dark:hover:text-primary-light transition-colors"
                >
                    {relatedData.category.name}
                </button>
            </InfoBlock>
        )}
        {business.business_age && (
            <InfoBlock icon={<GiftIcon />} label={t('established')} color={themeColor}>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">{formatDate(business.business_age)}</p>
            </InfoBlock>
        )}
        {relatedData?.location && (
             <InfoBlock icon={<MapPinIcon />} label={t('location')} color={themeColor}>
                 <div className="text-right">
                    <button 
                        onClick={() => onSelectLocation(relatedData.location!.id)}
                        className="text-md font-bold text-neutral-800 dark:text-neutral-200 hover:text-primary dark:hover:text-primary-light transition-colors"
                    >
                        {relatedData.location.name}
                    </button>
                    {business.business_zipcode && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{business.business_zipcode}</p>
                    )}
                 </div>
             </InfoBlock>
        )}
        {relatedData?.audience && relatedData.audience.length > 0 && (
             <InfoBlock icon={<UsersIcon />} label={t('audience')} color={themeColor}>
                <div className="flex flex-wrap gap-2 justify-end">
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
       </section>
      
      {/* Main Content Section */}
      <section>
         <article className="bg-white dark:bg-neutral-800/50 p-6 md:p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">{t('summary')}</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                <p>{business.business_summary}</p>
            </div>

            {business.business_tags && business.business_tags.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3 text-neutral-800 dark:text-neutral-200">{t('tags')}</h3>
                    <div className="flex flex-wrap gap-3">
                        {business.business_tags.map(tag => (
                            <span key={tag} className="text-sm font-medium bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-8 border-t border-neutral-200 dark:border-neutral-700 pt-4 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row justify-between gap-2 text-center sm:text-left">
                <span><strong>{t('created_on')}:</strong> {formatDate(business.date_created)}</span>
                <span><strong>{t('last_updated')}:</strong> {formatDate(business.date_updated)}</span>
            </div>
        </article>
      </section>
    </div>
  );
};

export default BusinessDetailsPage;