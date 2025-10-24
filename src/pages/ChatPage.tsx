import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, FunctionDeclaration, Type, Content, LiveServerMessage, Modality, Blob } from '@google/genai';
import { API_BASE_URL } from '../constants';
import { i18n as i18nInstance } from 'i18next';
import { getSocialNetworkName } from '../utils/socialUtils';
import { PaperAirplaneIcon, MicrophoneIcon, StopIcon } from '../components/Icons';
import Markdown from 'react-markdown';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import { Page } from '../types';
import ChatSearchResultCard, { SearchResultItem } from '../components/ui/ChatSearchResultCard';


// --- TYPE DEFINITIONS ---
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closing' | 'closed' | 'error';
interface FilterItem {
  id: number;
  name: string;
  persianName?: string;
}
interface ChatPageProps {
  history: Content[];
  setHistory: React.Dispatch<React.SetStateAction<Content[]>>;
  searchResults: Record<number, SearchResultItem[]>;
  setSearchResults: React.Dispatch<React.SetStateAction<Record<number, SearchResultItem[]>>>;
  onNavigate: (page: Page, id: number, type: 'influencer' | 'campaign' | 'business') => void;
}


// --- FUNCTION DECLARATIONS FOR GEMINI (Reused from LivePage) ---
const searchFarsigramTool: FunctionDeclaration = {
  name: 'searchFarsigram',
  description: 'Searches for influencers, campaigns, or businesses on the Farsigram platform. Can filter by category, location, and target audience. It returns a summary of the findings and a list of results.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      entityType: {
        type: Type.STRING,
        description: 'The type of entity to search for. Must be one of "influencer", "campaign", or "business".',
      },
      searchTerm: {
        type: Type.STRING,
        description: 'The name, topic, or keyword to search for. e.g., "fashion", "tech campaign", "Sara Mohamadi"',
      },
      category: {
        type: Type.STRING,
        description: 'The specific category to filter by, e.g., "Art", "Technology", "صنایع دستی".',
      },
      location: {
        type: Type.STRING,
        description: 'The location to filter by, e.g., "Iran", "Global", "ایران".',
      },
      audience: {
        type: Type.STRING,
        description: 'The target audience to filter by, e.g., "Youth", "Families", "جوانان".',
      },
    },
    required: ['entityType'],
  },
};

const getFarsigramItemDetailsTool: FunctionDeclaration = {
  name: 'getFarsigramItemDetails',
  description: 'Fetches detailed information about a specific influencer, campaign, business, or location by its exact name. For influencers, campaigns, and businesses, it can retrieve details like age, gender, summaries, social media accounts, and contact information. For locations, it provides a summary of community activity, including the number of influencers, campaigns, and businesses present there.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      entityType: {
        type: Type.STRING,
        description: 'The type of entity. Must be one of "influencer", "campaign", "business", or "location".',
      },
      name: {
        type: Type.STRING,
        description: 'The exact name of the influencer, campaign, business, or location to get details for (e.g., "Iran", "Sara Mohamadi").',
      },
    },
    required: ['entityType', 'name'],
  },
};


// --- HELPER FUNCTIONS (Reused from LivePage) ---
const calculateAge = (birthdate: string | undefined): number | null => {
    if (!birthdate) return null;
    try {
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    } catch (e) {
        return null;
    }
};

const findItemNameById = (id: number, items: FilterItem[], i18n: i18nInstance): string | undefined => {
    const item = items.find(i => i.id === id);
    if (!item) return undefined;
    return i18n.language === 'fa' ? item.persianName || item.name : item.name;
};


// --- MAIN COMPONENT ---
const ChatPage: React.FC<ChatPageProps> = ({ history, setHistory, searchResults, setSearchResults, onNavigate }) => {
  const { t, i18n } = useTranslation('chat');

  // Unified State
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For text chat
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle'); // For voice chat
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveModelTranscript, setLiveModelTranscript] = useState('');
  
  // State for pre-fetched filter data
  const [categories, setCategories] = useState<FilterItem[]>([]);
  const [locations, setLocations] = useState<FilterItem[]>([]);
  const [audiences, setAudiences] = useState<FilterItem[]>([]);
  const [filtersLoaded, setFiltersLoaded] = useState<boolean>(false);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveUserTranscriptRef = useRef('');
  const liveModelTranscriptRef = useRef('');
  const searchResultsForTurnRef = useRef<SearchResultItem[] | null>(null);


  // Set initial greeting
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ role: 'model', parts: [{ text: t('initial_message') }] }]);
    }
  }, [t, history.length, setHistory]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history, isLoading, liveUserTranscript, liveModelTranscript]);
  
  // Fetch data for tools
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setFiltersLoaded(false);
        const [categoriesRes, locationsRes, audiencesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/items/categories?filter[status][_eq]=published&fields=id,category_parent&limit=-1`),
          fetch(`${API_BASE_URL}/items/locations?fields=id,country_persian,country&limit=-1`),
          fetch(`${API_BASE_URL}/items/audiences?filter[status][_eq]=published&fields=id,audience_title&limit=-1`),
        ]);

        if (!categoriesRes.ok || !locationsRes.ok || !audiencesRes.ok) {
            throw new Error("Failed to fetch one or more filter resources.");
        }

        const categoriesData = await categoriesRes.json();
        const locationsData = await locationsRes.json();
        const audiencesData = await audiencesRes.json();

        setCategories((categoriesData?.data ?? []).map((c: { id: number; category_parent: string }) => ({ id: c.id, name: c.category_parent })));
        setAudiences((audiencesData?.data ?? []).map((a: { id: number; audience_title: string }) => ({ id: a.id, name: a.audience_title })));

        const farsigramLocations: {id: number, country_persian: string, country: string}[] = locationsData?.data ?? [];
        const detailPromises = farsigramLocations.map(loc => fetch(`https://restcountries.com/v3.1/alpha/${loc.country}`).then(res => res.ok ? res.json() : null));
        const detailsResults = await Promise.all(detailPromises);
        const combinedLocations = farsigramLocations.map((loc, index) => {
            const detail = detailsResults[index]?.[0];
            let englishName = detail?.name?.common || loc.country_persian;
            if (loc.country_persian === 'جهانی') englishName = 'Global';
            return { id: loc.id, name: englishName, persianName: loc.country_persian };
        });
        setLocations(combinedLocations);
        setFiltersLoaded(true);
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
        setFiltersLoaded(false);
        setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Error: Could not load data needed for tools.' }] }]);
      }
    };
    fetchFilterData();
  }, []);

  const getSystemInstruction = useCallback(() => {
    const categoryList = categories.map(c => c.name).join(', ');
    const locationList = locations.map(l => `${l.name}${l.persianName ? ` (${l.persianName})` : ''}`).join(', ');
    const audienceList = audiences.map(a => a.name).join(', ');

    const brandNameInstruction = 'When speaking or writing in English, you must refer to the brand as "Farsigram". When speaking or writing in Farsi, you must refer to it as "فارسیگرام".';

    return `You are an AI assistant for Farsigram, a platform for the Farsi-speaking community. You are fluent in both English and Farsi. Your primary function is to help users discover content by using your tools.

**Your most important instruction is to be tool-driven and proactive.**
1.  When a user asks to find something (e.g., "find influencers," "any campaigns?", "پیشنهادت چیه؟"), you **MUST** call the \`searchFarsigram\` tool in your first response.
2.  **DO NOT** ask for clarifying information. Use the information provided in the user's prompt to make a best-effort search. For generic requests like "find something for me," you can pick a popular category like "Lifestyle" or "Art" ("سبک زندگی").
3.  **DO NOT** say you are searching (e.g., "Let me look," "I am searching...", "دارم جستجو می‌کنم"). The user will see a loading indicator. Your job is to call the function.
4.  After the tool returns results, your response must be friendly and conversational. Weave the \`summary\` from the tool output into your answer.

${brandNameInstruction}

Available Search Filters for your tools (use the English names for the API call):
- Categories: ${categoryList}
- Locations: ${locationList}
- Audiences: ${audienceList}`;
  }, [categories, locations, audiences]);
  
  // --- Tool Execution Logic ---
  const searchFarsigramInApi = async (
    entityType: string,
    searchTerm?: string,
    category?: string,
    location?: string,
    audience?: string
  ): Promise<string> => {
    let endpoint = '';
    let textSearchFields: string[] = [];
    let nameField = '';
    let categoryConfig: { field: string; type: 'direct' | 'junction'; junctionIdField: string } | null = null;
    let locationConfig: { field: string; type: 'direct' | 'junction'; junctionIdField: string } | null = null;
    let audienceConfig: { field: string; type: 'direct' | 'junction'; junctionIdField: string } | null = null;

    switch (entityType.toLowerCase()) {
      case 'influencer':
        endpoint = 'influencers';
        textSearchFields = ['influencer_name', 'influencer_title', 'influencer_bio'];
        nameField = 'influencer_name';
        categoryConfig = { field: 'influencer_category', type: 'direct', junctionIdField: 'id' };
        locationConfig = { field: 'influencer_location', type: 'direct', junctionIdField: 'id' };
        audienceConfig = { field: 'influencer_audience', type: 'junction', junctionIdField: 'audiences_id' };
        break;
      case 'campaign':
        endpoint = 'campaigns';
        textSearchFields = ['campaign_title', 'campaign_slogan', 'campaign_goal'];
        nameField = 'campaign_title';
        categoryConfig = { field: 'campaign_type', type: 'junction', junctionIdField: 'categories_id' };
        locationConfig = { field: 'campaign_location', type: 'junction', junctionIdField: 'locations_id' };
        audienceConfig = { field: 'campaign_audience', type: 'junction', junctionIdField: 'audiences_id' };
        break;
      case 'business':
        endpoint = 'business';
        textSearchFields = ['business_name', 'business_slogan', 'business_summary'];
        nameField = 'business_name';
        categoryConfig = { field: 'business_category', type: 'direct', junctionIdField: 'id' };
        locationConfig = { field: 'business_location', type: 'direct', junctionIdField: 'id' };
        audienceConfig = { field: 'business_audience', type: 'junction', junctionIdField: 'audiences_id' };
        break;
      default:
        return JSON.stringify({ summary: `Sorry, I can only search for "influencer", "campaign", or "business", not "${entityType}".`, results: [] });
    }
    
    const findId = (name: string, items: FilterItem[]): number | undefined => {
        const lowerName = name.toLowerCase();
        const item = items.find(i => 
            i.name.toLowerCase().includes(lowerName) || 
            (i.persianName && i.persianName.toLowerCase().includes(lowerName))
        );
        return item?.id;
    };
    
    const buildFilter = (config: { field: string; type: 'direct' | 'junction'; junctionIdField: string }, id: number) => {
        if (config.type === 'direct') {
            return { [config.field]: { "_eq": id } };
        }
        return { [config.field]: { [config.junctionIdField]: { "_eq": id } } };
    };

    const filterConditions: any[] = [{ status: { _eq: 'published' } }];
    if (searchTerm) {
      filterConditions.push({ _or: textSearchFields.map(field => ({ [field]: { _icontains: searchTerm } })) });
    }
    if (category && categoryConfig) {
        const categoryId = findId(category, categories);
        if (categoryId) filterConditions.push(buildFilter(categoryConfig, categoryId));
        else return JSON.stringify({ summary: `I couldn't find a category named "${category}". Please try again.`, results: [] });
    }
    if (location && locationConfig) {
        const locationId = findId(location, locations);
        if (locationId) filterConditions.push(buildFilter(locationConfig, locationId));
        else return JSON.stringify({ summary: `I couldn't find a location named "${location}". Please try again.`, results: [] });
    }
    if (audience && audienceConfig) {
        const audienceId = findId(audience, audiences);
        if (audienceId) filterConditions.push(buildFilter(audienceConfig, audienceId));
        else return JSON.stringify({ summary: `I couldn't find an audience named "${audience}". Please try again.`, results: [] });
    }
    
    try {
        const filter = { _and: filterConditions };
        const fields = [nameField, 'id'];
        if (entityType === 'influencer') fields.push('influencer_avatar', 'influencer_title');
        if (entityType === 'campaign') fields.push('campaign_image', 'campaign_slogan');
        if (entityType === 'business') fields.push('business_logo', 'business_slogan');

        const url = `${API_BASE_URL}/items/${endpoint}?filter=${encodeURIComponent(JSON.stringify(filter))}&limit=3&fields=${fields.join(',')}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        
        const data = await response.json();

        if (!data?.data || data.data.length === 0) {
            return JSON.stringify({ summary: `I couldn't find any matching ${entityType}s.`, results: [] });
        }

        const results: SearchResultItem[] = (data.data as any[]).map((item: any): SearchResultItem | null => {
            if (entityType === 'influencer') {
                return { id: item.id, type: 'influencer', name: item.influencer_name, image: item.influencer_avatar, slogan: item.influencer_title };
            }
            if (entityType === 'campaign') {
                return { id: item.id, type: 'campaign', name: item.campaign_title, image: item.campaign_image, slogan: item.campaign_slogan };
            }
            if (entityType === 'business') {
                return { id: item.id, type: 'business', name: item.business_name, image: item.business_logo, slogan: item.business_slogan };
            }
            return null;
        }).filter((item): item is SearchResultItem => item !== null);

        const count = results.length;
        const plural = count > 1 ? 's' : '';
        const summary = `I found ${count} matching ${entityType}${plural}. Here are the top results. You can click on any of them to see more details, or ask me for more information.`;
        
        return JSON.stringify({ summary, results });
    } catch (error) {
        console.error(`API search failed for ${entityType}:`, error);
        return JSON.stringify({ summary: `Sorry, I encountered an error while searching for ${String(entityType)}s.`, results: [] });
    }
  };
  
  const getFarsigramItemDetailsFromApi = async (entityType: string, name: string): Promise<string> => {
    if (entityType.toLowerCase() === 'location') {
        const locationItem = locations.find(l => 
            l.name.toLowerCase().includes(name.toLowerCase()) || 
            (l.persianName && l.persianName.toLowerCase().includes(name.toLowerCase()))
        );

        if (!locationItem) return `I'm sorry, I couldn't find information for a location named "${name}".`;
        
        const locationId = locationItem.id;
        const locationDisplayName = i18n.language === 'fa' ? locationItem.persianName || locationItem.name : locationItem.name;

        try {
            const [influencersRes, campaignsRes, businessesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/items/influencers?filter[influencer_location][_eq]=${locationId}&meta=filter_count&fields=influencer_name&limit=3`),
                fetch(`${API_BASE_URL}/items/campaigns?filter[campaign_location][locations_id][_eq]=${locationId}&meta=filter_count&fields=campaign_title&limit=3`),
                fetch(`${API_BASE_URL}/items/business?filter[business_location][_eq]=${locationId}&meta=filter_count&fields=business_name&limit=3`),
            ]);

            const influencersData = await influencersRes.json();
            const campaignsData = await campaignsRes.json();
            const businessesData = await businessesRes.json();

            const iCount = influencersData?.meta?.filter_count ?? 0;
            const cCount = campaignsData?.meta?.filter_count ?? 0;
            const bCount = businessesData?.meta?.filter_count ?? 0;

            let summary = `In ${locationDisplayName}, Farsigram has a vibrant community with ${iCount} influencer${iCount !== 1 ? 's' : ''}, ${cCount} campaign${cCount !== 1 ? 's' : ''}, and ${bCount} business${bCount !== 1 ? 'es' : ''}. `;

            if (iCount > 0) summary += `Popular influencers include ${(influencersData?.data ?? []).map((i: any) => i.influencer_name).join(', ')}. `;
            if (cCount > 0) summary += `Active campaigns include ${(campaignsData?.data ?? []).map((c: any) => c.campaign_title).join(', ')}. `;
            if (bCount > 0) summary += `Local businesses include ${(businessesData?.data ?? []).map((b: any) => b.business_name).join(', ')}. `;
            if (iCount > 0 || cCount > 0 || bCount > 0) summary += `Would you like details on any of these?`;
            else summary = `It looks like ${locationDisplayName} is a community on Farsigram, but no public profiles are listed yet.`;

            return summary;
        } catch (error) {
            return `Sorry, I had trouble getting a summary for ${locationDisplayName}.`;
        }
    }
    
    let endpoint = '';
    let nameField = '';
    let fields: string[] = [];
    switch (entityType.toLowerCase()) {
      case 'influencer': endpoint = 'influencers'; nameField = 'influencer_name'; fields = ['influencer_name', 'influencer_title', 'influencer_bio', 'influencer_birthdate', 'influencer_gender', 'influencer_location', 'influencer_category', 'influencer_social.socials_id.*']; break;
      case 'campaign': endpoint = 'campaigns'; nameField = 'campaign_title'; fields = ['campaign_title', 'campaign_slogan', 'campaign_overview', 'campaign_goal', 'campaign_location.locations_id.id', 'campaign_type.categories_id.id', 'campaign_social.socials_id.*']; break;
      case 'business': endpoint = 'business'; nameField = 'business_name'; fields = ['business_name', 'business_slogan', 'business_summary', 'business_age', 'business_phone', 'business_website', 'business_whatsapp', 'business_category', 'business_location', 'business_social.socials_id.*']; break;
      default: return `I can only get details for "influencer", "campaign", "business", or "location".`;
    }

    try {
      const url = `${API_BASE_URL}/items/${endpoint}?filter[${nameField}][_icontains]=${name}&limit=1&fields=${fields.join(',')}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const data = await response.json();
      if (!data?.data?.[0]) return `I couldn't find details for a ${entityType} named "${name}".`;
      const item = data.data[0];
      
      if (entityType === 'influencer') {
        const socials = item.influencer_social?.map((s: any) => s.socials_id).filter(Boolean) || [];
        const socialLinks = socials.map((s: any) => `${getSocialNetworkName(s.social_network)}: ${s.social_account}`).join(', ');

        const facts = [
            `Name: ${item.influencer_name}`,
            `Title: ${item.influencer_title || 'N/A'}`,
            `Bio: ${item.influencer_bio || 'N/A'}`,
            `Age: ${calculateAge(item.influencer_birthdate) || 'N/A'}`,
            `Gender: ${item.influencer_gender || 'N/A'}`,
            `Category: ${findItemNameById(item.influencer_category, categories, i18n) || 'N/A'}`,
            `Location: ${findItemNameById(item.influencer_location, locations, i18n) || 'N/A'}`,
            `Socials: ${socialLinks || 'N/A'}`,
        ];
        return `Here are the facts for ${item.influencer_name}:\n${facts.join('\n')}`;
      } else if (entityType === 'campaign') {
        const categoryIds = item.campaign_type?.map((c: any) => c.categories_id.id) || [];
        const categoryNames = categoryIds.map((id: number) => findItemNameById(id, categories, i18n)).filter(Boolean);
        const locationIds = item.campaign_location?.map((l: any) => l.locations_id.id) || [];
        const locationNames = locationIds.map((id: number) => findItemNameById(id, locations, i18n)).filter(Boolean);
        const socials = item.campaign_social?.map((s: any) => s.socials_id).filter(Boolean) || [];
        const socialLinks = socials.map((s: any) => `${getSocialNetworkName(s.social_network)}: ${s.social_account}`).join(', ');
        
        const facts = [
            `Title: ${item.campaign_title}`,
            `Slogan: ${item.campaign_slogan || 'N/A'}`,
            `Goal: ${item.campaign_goal || 'N/A'}`,
            `Category: ${categoryNames.join(', ') || 'N/A'}`,
            `Location: ${locationNames.join(', ') || 'N/A'}`,
            `Socials: ${socialLinks || 'N/A'}`,
            `Overview: ${item.campaign_overview || 'N/A'}`,
        ];
        return `Here are the facts for the campaign "${item.campaign_title}":\n${facts.join('\n')}`;
      } else if (entityType === 'business') {
        const socials = item.business_social?.map((s: any) => s.socials_id).filter(Boolean) || [];
        const socialLinks = socials.map((s: any) => `${getSocialNetworkName(s.social_network)}: ${s.social_account}`).join(', ');

        const facts = [
            `Name: ${item.business_name}`,
            `Slogan: ${item.business_slogan || 'N/A'}`,
            `Summary: ${item.business_summary || 'N/A'}`,
            `Category: ${findItemNameById(item.business_category, categories, i18n) || 'N/A'}`,
            `Location: ${findItemNameById(item.business_location, locations, i18n) || 'N/A'}`,
            `Established: ${item.business_age ? new Date(item.business_age).getFullYear() : 'N/A'}`,
            `Phone: ${item.business_phone || 'N/A'}`,
            `Website: ${item.business_website || 'N/A'}`,
            `WhatsApp: ${item.business_whatsapp || 'N/A'}`,
            `Socials: ${socialLinks || 'N/A'}`,
        ];
        return `Here are the facts for the business "${item.business_name}":\n${facts.join('\n')}`;
      }
      return `I found ${name}, but there are no further details available.`;
    } catch (error) {
      return `Sorry, I had trouble getting details for ${name}.`;
    }
  };

  const handleResultClick = (item: SearchResultItem) => {
    let page: Page;
    switch (item.type) {
        case 'influencer': page = Page.Influencers; break;
        case 'campaign': page = Page.Campaigns; break;
        case 'business': page = Page.Business; break;
        default: return;
    }
    onNavigate(page, item.id, item.type);
  };
  
  // --- Text Chat Logic ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = userInput.trim();
    if (!text || isLoading) return;

    const newUserContent: Content = { role: 'user', parts: [{ text }] };
    setHistory(prev => [...prev, newUserContent]);
    setUserInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const systemInstruction = getSystemInstruction();
      let modelHistory = [...history, newUserContent];
      let searchResultsPayload: SearchResultItem[] | undefined;

      while(true) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: modelHistory,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [searchFarsigramTool, getFarsigramItemDetailsTool] }],
          },
        });

        const lastCandidate = response.candidates?.[0];
        if (!lastCandidate) throw new Error("No response from model.");
        
        const lastPart = lastCandidate.content.parts[0];

        if (lastPart.functionCall) {
            modelHistory.push(lastCandidate.content);
            const fc = lastPart.functionCall;
            let resultText: string;

            if (fc.name === 'searchFarsigram') {
                const { entityType, searchTerm, category, location, audience } = fc.args;
                const apiResult = await searchFarsigramInApi(entityType as string, searchTerm as string | undefined, category as string | undefined, location as string | undefined, audience as string | undefined);
                try {
                    const parsed = JSON.parse(apiResult);
                    resultText = parsed.summary;
                    searchResultsPayload = parsed.results;
                } catch (e) {
                    resultText = apiResult;
                    searchResultsPayload = undefined;
                }
            } else if (fc.name === 'getFarsigramItemDetails') {
                const { entityType, name } = fc.args;
                resultText = await getFarsigramItemDetailsFromApi(entityType as string, name as string);
                searchResultsPayload = undefined;
            } else {
                resultText = `Unknown function call: ${fc.name}`;
            }

            modelHistory.push({
                role: 'model',
                parts: [{ functionResponse: { name: fc.name, response: { result: resultText } } }],
            });

        } else if (lastPart.text) {
            const modelResponseText = lastPart.text;
            const finalHistoryIndex = history.length + 1; // +1 for the user message
            
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: modelResponseText }] }]);
            
            if (searchResultsPayload) {
                setSearchResults(prev => ({ ...prev, [finalHistoryIndex]: searchResultsPayload! }));
            }
            break; 
        } else {
             throw new Error("Model response did not contain text or a function call.");
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Sorry, something went wrong.' }] }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // --- Voice Chat Logic ---
  const handleStop = useCallback(async () => {
    if (!sessionPromiseRef.current) return;
    setConnectionState('closing');
    
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current.disconnect();
    }
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') inputAudioContextRef.current.close();
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    for (const source of outputSourcesRef.current.values()) {
        source.stop();
        outputSourcesRef.current.delete(source);
    }
    nextStartTimeRef.current = 0;

    try {
        const session = await sessionPromiseRef.current;
        session.close();
    } catch (e) {
        console.error("Error closing session:", e);
    } finally {
        sessionPromiseRef.current = null;
        setConnectionState('closed');
    }
  }, []);
  
  const handleStart = async () => {
    setConnectionState('connecting');
    setLiveUserTranscript('');
    setLiveModelTranscript('');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = getSystemInstruction();

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                tools: [{ functionDeclarations: [searchFarsigramTool, getFarsigramItemDetailsTool] }],
            },
            callbacks: {
                onopen: () => {
                    setConnectionState('connected');
                    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                    mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                           session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.toolCall) {
                         for (const fc of message.toolCall.functionCalls) {
                            let resultText = '';
                            if (fc.name === 'searchFarsigram') {
                                const { entityType, searchTerm, category, location, audience } = fc.args;
                                const apiResult = await searchFarsigramInApi(entityType as string, searchTerm as string, category as string, location as string, audience as string);
                                try {
                                    const parsed = JSON.parse(apiResult);
                                    resultText = parsed.summary;
                                    searchResultsForTurnRef.current = parsed.results;
                                } catch (e) {
                                    resultText = apiResult;
                                    searchResultsForTurnRef.current = null;
                                }
                            } else if (fc.name === 'getFarsigramItemDetails') {
                                resultText = await getFarsigramItemDetailsFromApi(fc.args.entityType as string, fc.args.name as string);
                                searchResultsForTurnRef.current = null;
                            }
                            sessionPromiseRef.current?.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: resultText } } }));
                        }
                    }

                    if (message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        liveUserTranscriptRef.current += text;
                        setLiveUserTranscript(liveUserTranscriptRef.current);
                    }
                    if (message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                        liveModelTranscriptRef.current += text;
                        setLiveModelTranscript(liveModelTranscriptRef.current);
                    }
                    if (message.serverContent?.turnComplete) {
                        const finalUserTranscript = liveUserTranscriptRef.current.trim();
                        const finalModelTranscript = liveModelTranscriptRef.current.trim();
                        
                        setHistory(prev => {
                            const newHistory = [...prev];
                            if (finalUserTranscript) newHistory.push({ role: 'user', parts: [{ text: finalUserTranscript }] });
                            if (finalModelTranscript) newHistory.push({ role: 'model', parts: [{ text: finalModelTranscript }] });
                            
                            if (finalModelTranscript && searchResultsForTurnRef.current) {
                                const finalMessageIndex = newHistory.length - 1;
                                setSearchResults(prevResults => ({ ...prevResults, [finalMessageIndex]: searchResultsForTurnRef.current! }));
                                searchResultsForTurnRef.current = null; // Reset for next turn
                            }
                            return newHistory;
                        });
    
                        liveUserTranscriptRef.current = '';
                        liveModelTranscriptRef.current = '';
                        setLiveUserTranscript('');
                        setLiveModelTranscript('');
                    }
                    
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => outputSourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        outputSourcesRef.current.add(source);
                    }

                    if (message.serverContent?.interrupted) {
                        for (const source of outputSourcesRef.current.values()) {
                            source.stop();
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setConnectionState('error');
                    handleStop();
                },
                onclose: () => {},
            },
        });
    } catch (error) {
        console.error("Failed to start session:", error);
        setConnectionState('error');
        alert(t('mic_error'))
    }
  };

  useEffect(() => {
    return () => { handleStop(); };
  }, [handleStop]);

  const handleVoiceToggle = () => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      handleStop();
    } else {
      handleStart();
    }
  };

  const isVoiceActive = connectionState === 'connecting' || connectionState === 'connected';

  const statusMap: Record<ConnectionState, { text: string; color: string; pulse: boolean }> = {
    idle: { text: t('status_idle'), color: 'bg-neutral-400', pulse: false },
    connecting: { text: t('status_connecting'), color: 'bg-amber-500', pulse: true },
    connected: { text: t('status_connected'), color: 'bg-green-500', pulse: true },
    closing: { text: t('status_closing'), color: 'bg-amber-500', pulse: false },
    closed: { text: t('status_closed'), color: 'bg-neutral-500', pulse: false },
    error: { text: t('status_error'), color: 'bg-red-500', pulse: false },
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-neutral-800/50 rounded-xl shadow-lg">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {history.map((msg, index) => {
            const textPart = msg.parts.find(p => p.text);
            if (!textPart) return null;

            return (
              <React.Fragment key={`msg-frag-${index}`}>
                <div className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${msg.role === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                    {msg.role === 'user' ? t('user_avatar') : t('model_avatar')}
                  </div>
                  <div className={`prose dark:prose-invert prose-sm max-w-none p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10' : 'bg-neutral-100 dark:bg-neutral-700/50'}`}>
                      <Markdown>{textPart.text}</Markdown>
                  </div>
                </div>
                {searchResults[index] && msg.role === 'model' && (
                    <div className="ml-11 space-y-2"> {/* Align with model avatar */}
                        {searchResults[index].map(item => (
                            <ChatSearchResultCard key={`${item.type}-${item.id}`} item={item} onClick={handleResultClick} />
                        ))}
                    </div>
                )}
              </React.Fragment>
            )
        })}
        
        {/* Live Transcripts */}
        {(liveUserTranscript) && (
            <div className="flex items-start gap-3 flex-row-reverse opacity-70">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-primary">{t('user_avatar')}</div>
                <div className="prose dark:prose-invert prose-sm max-w-none p-3 rounded-lg bg-primary/10"><p>{liveUserTranscript}</p></div>
            </div>
        )}
        {(liveModelTranscript) && (
             <div className="flex items-start gap-3 flex-row opacity-70">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-secondary">{t('model_avatar')}</div>
                <div className="prose dark:prose-invert prose-sm max-w-none p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700/50"><p>{liveModelTranscript}</p></div>
            </div>
        )}

        {isLoading && (
            <div className="flex items-start gap-3 flex-row">
                 <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-secondary">
                    {t('model_avatar')}
                </div>
                <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700/50">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-secondary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-secondary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-secondary rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <div className="flex-shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-700">
        {isVoiceActive && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                <span className={`absolute inline-flex h-full w-full rounded-full ${statusMap[connectionState].color} ${statusMap[connectionState].pulse ? 'animate-ping' : ''} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${statusMap[connectionState].color}`}></span>
              </span>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{statusMap[connectionState].text}</p>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={!filtersLoaded || isLoading}
            className={`p-3 rounded-full transition-colors disabled:opacity-50 ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-primary'}`}
            aria-label={isVoiceActive ? t('stop_voice') : t('start_voice')}
          >
            {isVoiceActive ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
          </button>
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isLoading || !filtersLoaded || isVoiceActive}
              className="w-full bg-neutral-100 dark:bg-neutral-800 border border-transparent rounded-full py-3 pr-14 pl-5 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !userInput || isVoiceActive}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-primary text-white disabled:bg-neutral-300 dark:disabled:bg-neutral-600 transition-colors"
              aria-label={t('send_message')}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;