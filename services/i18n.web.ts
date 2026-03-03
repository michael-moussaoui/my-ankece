/**
 * Web-compatible i18n initialization.
 * Metro picks this over i18n.ts on web. Uses localStorage with SSR guard.
 */
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../constants/translations/en.json';
import fr from '../constants/translations/fr.json';

const resources = {
    fr: { translation: fr },
    en: { translation: en },
};

const LANGUAGE_KEY = 'user-language';

const getSavedLanguage = (): string => {
    // Guard for SSR / Node.js context where window is not available
    if (typeof window === 'undefined') return 'fr';
    try {
        return localStorage.getItem(LANGUAGE_KEY) || '';
    } catch {
        return '';
    }
};

const getDefaultLanguage = (): string => {
    let saved = getSavedLanguage();
    if (saved === 'en' || saved === 'fr') return saved;
    try {
        const locale = Localization.getLocales()[0].languageCode;
        return locale === 'en' || locale === 'fr' ? locale : 'fr';
    } catch {
        return 'fr';
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getDefaultLanguage(),
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
