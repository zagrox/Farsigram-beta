import React from 'react';
import { ASSETS_URL } from '../constants';

// FIX: Changed re-export to import and export to make icons available within this file.
import {
  HomeIcon,
  MegaphoneIcon,
  SparklesIcon,
  GlobeEuropeAfricaIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  SunIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  LightBulbIcon,
  UsersIcon,
  MapPinIcon,
  TagIcon,
  ComputerDesktopIcon,
  LinkIcon,
  ShareIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';

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
  UsersIcon as InfluencersIcon,
  MapPinIcon,
  TagIcon,
  ComputerDesktopIcon,
  LinkIcon,
  ShareIcon,
  GiftIcon,
};

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
    if (lowerUrl.includes('youtube.com')) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
            </svg>
        );
    }
    if (lowerUrl.includes('tiktok.com')) {
        return (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.55-2-2.31-4.52-2.3-7.09 0-2.62.78-5.17 2.39-7.18 1.56-1.96 3.82-3.13 6.18-3.16.24-.01.48-.02.72-.02" />
            </svg>
        );
    }
    if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) {
        return (
             <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.82-1.26-4.38 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23zm4.52-6.13c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.98s-.29.17-.54.05c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.95-1.61-2.29c-.17-.34-.01-.52.11-.64s.25-.29.37-.43c.12-.15.17-.25.25-.42s.12-.31.06-.52c-.06-.21-.56-1.35-.76-1.84s-.4-.41-.56-.41h-.54c-.17 0-.43.06-.66.31s-.87.85-.87 2.07c0 1.22.89 2.4 1.01 2.56s1.75 2.67 4.23 3.73c.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18s.21-1.09.15-1.18c-.06-.09-.17-.15-.42-.27z" />
            </svg>
        );
    }
    if (lowerUrl.includes('linkedin.com')) {
        return (
             <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
        );
    }
    if (lowerUrl.includes('facebook.com')) {
        return (
             <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96s4.46 9.96 9.96 9.96c5.5 0 9.96-4.46 9.96-9.96S17.5 2.04 12 2.04zm3.6 5.46h-2.1c-.8 0-1 .4-1 .9v1.3h3.1l-.4 3.1h-2.7V20h-3.3v-6.2H8.4V10.7h2.2V9.4c0-2.2 1.3-3.4 3.3-3.4h2.7v3.1z" />
            </svg>
        );
    }
    // Default link icon
    return <LinkIcon className={className} />;
};