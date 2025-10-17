export const getSocialNetworkName = (url: string): string => {
    if (!url) return 'Social Link';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) return 'X (Twitter)';
    if (lowerUrl.includes('instagram.com')) return 'Instagram';
    if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) return 'Telegram';
    if (lowerUrl.includes('youtube.com')) return 'YouTube';
    if (lowerUrl.includes('tiktok.com')) return 'TikTok';
    if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) return 'WhatsApp';
    if (lowerUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowerUrl.includes('facebook.com')) return 'Facebook';
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
};