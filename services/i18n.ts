import AsyncStorage from '@react-native-async-storage/async-storage';
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

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (!savedLanguage) {
        const systemLocale = Localization.getLocales()[0].languageCode;
        savedLanguage = systemLocale === 'en' || systemLocale === 'fr' ? systemLocale : 'fr';
    }

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            fallbackLng: 'fr',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
