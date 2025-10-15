import React from 'react';
import { ASSETS_URL } from '../constants';

// Re-exporting from Heroicons with aliases to maintain consistency
export {
  HomeIcon,
  MegaphoneIcon as CampaignIcon,
  SparklesIcon as CultureIcon,
  GlobeEuropeAfricaIcon as ExploreIcon,
  Squares2X2Icon as CategoryIcon,
  ShoppingBagIcon as MarketplaceIcon,
  ChatBubbleOvalLeftEllipsisIcon as MessageIcon,
  BellIcon as NotificationIcon,
  UserCircleIcon as ProfileIcon,
  Cog6ToothIcon as SettingsIcon,
  ArrowRightStartOnRectangleIcon as LogoutIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon as SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  LightBulbIcon,
  UsersIcon,
  MapPinIcon,
  TagIcon,
  ComputerDesktopIcon,
  // FIX: Add missing LinkIcon to exports
  LinkIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

// Keep custom brand icon
type IconProps = { className?: string };
export const FarsigramIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <img 
    src={`${ASSETS_URL}/9e90ea38-c50b-4dd7-99ea-bcff23b98ce1`} 
    alt="Farsigram Logo" 
    className={`${className} dark:invert`} 
  />
);

export const SocialIcon: React.FC<{ networkUrl: string; className?: string }> = ({ networkUrl, className = 'w-6 h-6' }) => {
    const lowerUrl = networkUrl.toLowerCase();

    if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </svg>
        );
    }
    if (lowerUrl.includes('instagram.com')) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
        );
    }
    if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) {
        return (
             <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.08l16.1-5.84c.72-.26 1.36.22 1.14.94l-2.82 13.25c-.24.99-1.14 1.22-1.83.73l-4.76-3.48-2.2 2.12c-.24.24-.45.45-.83.45z"></path>
            </svg>
        );
    }
    // Default link icon
    return <LinkIcon className={className} />;
};
