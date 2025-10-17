import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../constants';
import { CompactRelatedCard, CompactRelatedCardSkeleton } from './CompactRelatedCard';
import SectionHeader from './SectionHeader';
import { EnrichedInfluencer } from './InfluencerCard';

// --- TYPE DEFINITIONS ---
interface RelatedInfluencersProps {
  currentInfluencerId: number;
  locationId: number;
  categoryId: number;
  gender: "male" | "female" | "trans";
  onSelectInfluencer: (id: number) => void;
}

// Raw API types
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
interface ApiItem {
  id: number;
  name: string;
}
interface LocationApiItem {
    id: number;
    persianName: string;
    englishName: string;
}

// --- MAIN COMPONENT ---
const RelatedInfluencers: React.FC<RelatedInfluencersProps> = ({ currentInfluencerId, locationId, categoryId, gender, onSelectInfluencer }) => {
  const { t, i18n } = useTranslation('influencers');
  const [related, setRelated] = useState<EnrichedInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For enriching data
  const [categories, setCategories] = useState<ApiItem[]>([]);
  const [locations, setLocations] = useState<LocationApiItem[]>([]);
  
  useEffect(() => {
    const fetchEnrichmentData = async () => {
        try {
            const [categoriesRes, locationsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/items/categories?fields=id,category_parent&limit=-1`),
                fetch(`${API_BASE_URL}/items/locations?fields=id,country_persian,country&limit=-1`),
            ]);
            if (!categoriesRes.ok || !locationsRes.ok) throw new Error('Failed to fetch enrichment data');
            
            const categoriesData = await categoriesRes.json();
            const locationsData = await locationsRes.json();

            setCategories(categoriesData.data.map((c: { id: number; category_parent: string }) => ({ id: c.id, name: c.category_parent })));
            
            const farsigramLocations: {id: number, country_persian: string, country: string}[] = locationsData.data;
            const detailPromises = farsigramLocations.map(loc =>
                fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null)
            );
            const detailsResults = await Promise.all(detailPromises);

            const combinedLocations = farsigramLocations.map((loc, index) => {
                const detail = detailsResults[index]?.[0];
                return {
                    id: loc.id,
                    persianName: loc.country_persian,
                    englishName: detail?.name?.common || loc.country_persian
                };
            });
            setLocations(combinedLocations);

        } catch (err) {
            console.error(err);
            setError(t('error'));
        }
    };
    fetchEnrichmentData();
  }, [t]);

  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const locationsMap = useMemo(() => new Map(locations.map(l => [l.id, {persian: l.persianName, english: l.englishName}])), [locations]);


  useEffect(() => {
    if (!currentInfluencerId || categoriesMap.size === 0 || locationsMap.size === 0) {
      setLoading(false);
      return;
    }

    const fetchRelatedWithCascade = async () => {
      setLoading(true);
      setError(null);
      
      let finalRelated: EnrichedInfluencer[] = [];
      const fetchedIds = new Set<number>([currentInfluencerId]);
      const MAX_RESULTS = 6;

      const enrichAndAdd = (influencers: Influencer[]) => {
        const enriched = influencers
          .filter(inf => !fetchedIds.has(inf.id))
          .map((inf): EnrichedInfluencer => {
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

        for (const newInf of enriched) {
            if (finalRelated.length < MAX_RESULTS) {
                finalRelated.push(newInf);
                fetchedIds.add(newInf.id);
            }
        }
      };
      
      const fetchByFilter = async (filter: string) => {
        if (finalRelated.length >= MAX_RESULTS) return;
        const excludeIds = `&filter[id][_nin]=${Array.from(fetchedIds).join(',')}`;
        const query = `${API_BASE_URL}/items/influencers?status=published&limit=${MAX_RESULTS}${filter}${excludeIds}&fields=*,influencer_social.socials_id.*,influencer_audience.audiences_id.*`;
        try {
            const res = await fetch(query);
            if (res.ok) {
                const data = await res.json();
                enrichAndAdd(data.data);
            }
        } catch (err) {
            console.warn(`Failed to fetch with filter: ${filter}`, err);
        }
      };

      // --- Cascade Fetching Logic ---
      // 1. Same Category & Location
      if (categoryId && locationId) {
        await fetchByFilter(`&filter[_and][0][influencer_category][_eq]=${categoryId}&filter[_and][1][influencer_location][_eq]=${locationId}`);
      }
      // 2. Same Category
      if (categoryId) {
        await fetchByFilter(`&filter[influencer_category][_eq]=${categoryId}`);
      }
      // 3. Same Location
      if (locationId) {
        await fetchByFilter(`&filter[influencer_location][_eq]=${locationId}`);
      }
      // 4. Same Gender
      if (gender) {
        await fetchByFilter(`&filter[influencer_gender][_eq]=${gender}`);
      }
      // 5. Fallback: Latest influencers
      await fetchByFilter(`&sort=-date_created`);

      setRelated(finalRelated);
      setLoading(false);
    };

    fetchRelatedWithCascade();

  }, [currentInfluencerId, locationId, categoryId, gender, t, i18n.language, categoriesMap, locationsMap]);

  if (loading) {
    return (
      <section>
        <SectionHeader title={t('related_influencers')} />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, index) => <CompactRelatedCardSkeleton key={index} />)}
        </div>
      </section>
    );
  }

  if (error || related.length === 0) {
    return null; // Don't show the section if there's an error or no related influencers
  }

  return (
    <section>
      <SectionHeader title={t('related_influencers')} />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-6">
        {related.map(influencer => (
          <CompactRelatedCard
            key={influencer.id}
            imageUrl={influencer.influencer_avatar}
            title={influencer.influencer_name}
            onClick={() => onSelectInfluencer(influencer.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedInfluencers;