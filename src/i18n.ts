import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: [
      'common',
      'home',
      'campaigns',
      'culturalhub',
      'explore',
      'categories',
      'marketplace',
      'messages',
      'notifications',
      'profile',
      'influencers',
      'map',
    ],
    defaultNS: 'common',
    backend: {
      loadPath: '/public/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;