import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, ASSETS_URL } from '../constants';
import SectionHeader from '../components/ui/SectionHeader';
import { SocialIcon } from '../components/Icons';

interface ApiCategory {
  id: number;
  status: string;
  category_parent: string; // This is the name
  category_name: number | null; // This is the parent_id
  category_image: string | null;
  category_color: string | null;
}

interface ParentCategory extends ApiCategory {
  subcategories: ApiCategory[];
}

interface ApiAudience {
  id: number;
  status: string;
  audience_title: string;
  audience_color: string | null;
}

interface CategoriesPageProps {
  onSelectNetwork: (networkUrl: string) => void;
  onSelectAudience: (id: number) => void;
}

const hexToRgba = (hex: string | null, alpha: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    // Return a default color if hex is invalid or null
    const defaultRgb = '204, 204, 204'; // A neutral gray
    return `rgba(${defaultRgb}, ${alpha})`;
  }

  let c: any = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
};


const CategoriesPage: React.FC<CategoriesPageProps> = ({ onSelectNetwork, onSelectAudience }) => {
  const { t } = useTranslation('categories');
  const [structuredCategories, setStructuredCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [audiences, setAudiences] = useState<ApiAudience[]>([]);
  const [loadingAudiences, setLoadingAudiences] = useState<boolean>(true);
  const [errorAudiences, setErrorAudiences] = useState<string | null>(null);

  const [socials, setSocials] = useState<string[]>([]);
  const [loadingSocials, setLoadingSocials] = useState<boolean>(true);
  const [errorSocials, setErrorSocials] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/items/categories`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const publishedCategories: ApiCategory[] = data.data.filter(
          (cat: ApiCategory) => cat.status === 'published'
        );

        const parents: ParentCategory[] = publishedCategories
          .filter((cat) => cat.category_name === null)
          .map((cat) => ({ ...cat, subcategories: [] }));

        const subcategories: ApiCategory[] = publishedCategories.filter(
          (cat) => cat.category_name !== null
        );

        const categoriesMap = new Map<number, ParentCategory>();
        parents.forEach(p => categoriesMap.set(p.id, p));

        subcategories.forEach(sub => {
          const parent = categoriesMap.get(sub.category_name!);
          if (parent) {
            parent.subcategories.push(sub);
          }
        });

        setStructuredCategories(Array.from(categoriesMap.values()));
      } catch (err) {
        setError(t('error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAudiences = async () => {
        setLoadingAudiences(true);
        setErrorAudiences(null);
        try {
          const response = await fetch(`${API_BASE_URL}/items/audiences`);
          if (!response.ok) {
            throw new Error('Network response was not ok for audiences');
          }
          const data = await response.json();
          const publishedAudiences: ApiAudience[] = data.data.filter(
            (aud: ApiAudience) => aud.status === 'published'
          );
          setAudiences(publishedAudiences);
        } catch (err) {
          setErrorAudiences(t('error_audiences'));
          console.error("Failed to fetch audiences:", err);
        } finally {
          setLoadingAudiences(false);
        }
      };
      
    const fetchSocials = async () => {
        setLoadingSocials(true);
        setErrorSocials(null);
        try {
            const response = await fetch(`${API_BASE_URL}/items/socials?fields=social_network&limit=-1`);
            if (!response.ok) {
                throw new Error('Network response was not ok for socials');
            }
            const data = await response.json();
            const allSocialLinks: { social_network: string }[] = data.data;
            const uniqueNetworks = [...new Set(allSocialLinks.map(s => s.social_network).filter(Boolean))];
            setSocials(uniqueNetworks);
        } catch (err) {
            setErrorSocials(t('error_socials'));
            console.error("Failed to fetch socials:", err);
        } finally {
            setLoadingSocials(false);
        }
    };

    fetchCategories();
    fetchAudiences();
    fetchSocials();
  }, [t]);

  const getSocialNetworkName = (url: string): string => {
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

  return (
    <div className="space-y-12">
      {/* Categories Section */}
      <section>
        {loading && <p className="text-center text-neutral-500 dark:text-neutral-400">{t('loading')}</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {structuredCategories.map((parent) => (
              <div 
                key={parent.id} 
                className="bg-white dark:bg-neutral-800/50 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div 
                  className="p-4 flex items-center gap-4"
                  style={{ backgroundColor: hexToRgba(parent.category_color, 0.1) }}
                >
                  {parent.category_image && (
                    <div 
                      className="w-12 h-12 rounded-full flex-shrink-0 bg-white dark:bg-neutral-800 p-1 flex items-center justify-center"
                      style={{ border: `2px solid ${parent.category_color || '#cccccc'}` }}
                    >
                      <img 
                        src={`${ASSETS_URL}/${parent.category_image}`} 
                        alt={parent.category_parent}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                  )}
                  <h3 
                    className="text-xl font-bold"
                    style={{ color: parent.category_color || 'inherit' }}
                  >
                    {parent.category_parent}
                  </h3>
                </div>
                <div className="p-6">
                  {parent.subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parent.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700/50 px-3 py-1 rounded-full cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                        >
                          {sub.category_parent}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 dark:text-neutral-500 italic">{t('noSubcategories')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audiences Section */}
      <section>
          <SectionHeader title={t('audiences_title')} />
          {loadingAudiences ? (
              <div className="flex flex-wrap gap-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-9 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                  ))}
              </div>
          ) : errorAudiences ? (
              <p className="text-center text-red-500">{errorAudiences}</p>
          ) : (
              <div className="flex flex-wrap gap-3">
                  {audiences.map(aud => (
                      <button
                          key={aud.id}
                          onClick={() => onSelectAudience(aud.id)}
                          className="text-md font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700/50 px-5 py-2 rounded-full cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                          style={{ border: `2px solid ${aud.audience_color || 'transparent'}` }}
                      >
                          {aud.audience_title}
                      </button>
                  ))}
              </div>
          )}
      </section>

      {/* Social Networks Section */}
      <section>
          <SectionHeader title={t('socials_title')} />
          {loadingSocials ? (
              <div className="flex flex-wrap gap-4 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                  ))}
              </div>
          ) : errorSocials ? (
              <p className="text-center text-red-500">{errorSocials}</p>
          ) : (
              <div className="flex flex-wrap gap-4">
                  {socials.map(networkUrl => (
                      <button
                          key={networkUrl}
                          onClick={() => onSelectNetwork(networkUrl)}
                          className="flex items-center justify-center w-16 h-16 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg cursor-pointer transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-neutral-600 dark:text-neutral-300"
                          title={getSocialNetworkName(networkUrl)}
                          aria-label={`Browse ${getSocialNetworkName(networkUrl)} profiles`}
                      >
                          <SocialIcon networkUrl={networkUrl} className="w-8 h-8" />
                      </button>
                  ))}
              </div>
          )}
      </section>
    </div>
  );
};

export default CategoriesPage;