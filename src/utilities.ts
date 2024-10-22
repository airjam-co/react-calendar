import { CALENDAR_DEFAULT_TRANSLATIONS, ComponentTranslation, Translation, mergeTranslation, negotiateLocale } from "@airjam/types";
const humanizeDuration = require("humanize-duration");

export function getHumanReadableDuration(startTime: Date, endTime: Date): string {
    // TODO - i18n this
    if (!startTime || !endTime) return "";
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    const diffTimeSec = Math.abs((endTimeDate.getTime() - startTimeDate.getTime())) / 1000;
    if (diffTimeSec === 0) return "";
    if (diffTimeSec < 60) return getHumanReadableTimeNumber(diffTimeSec) + " seconds";
    const diffTimeMin = diffTimeSec / 60;
    return getHumanTimeUnit(diffTimeMin);
}

export function getHumanTimeUnit(minute: number): string {
    if (minute < 60) return getHumanReadableTimeNumber(minute) + " minutes";
    const hour = minute / 60.0;
    if (hour < 24) return getHumanReadableTimeNumber(hour) + " hours";
    const days = hour / 24.0;
    return getHumanReadableTimeNumber(days) + " days";
}

export function getHumanReadableTimeNumber(timeNumber: number): string {
    if (Number.isInteger(timeNumber)) return timeNumber + "";
    return timeNumber.toPrecision(2) + "";
}

export function getPreferredTranslation(translations?: ComponentTranslation, locale?: string): Translation {
    const systemDefaultLocale = "en-US";
    const preferredLocale = translations && locale ? negotiateLocale(translations, locale) : systemDefaultLocale;
    const defaultTranslations = JSON.parse(JSON.stringify(CALENDAR_DEFAULT_TRANSLATIONS)) as ComponentTranslation;
    let defaultTranslation = {} as Translation;
    if (defaultTranslations.clientTranslations[preferredLocale]) {
        defaultTranslation = JSON.parse(JSON.stringify(defaultTranslations.clientTranslations[preferredLocale])) as Translation;
    } else if (locale && defaultTranslations.clientTranslations[locale]) {
        defaultTranslation = JSON.parse(JSON.stringify(defaultTranslations.clientTranslations[locale])) as Translation;
    } else if (defaultTranslations.clientTranslations[defaultTranslations.defaultLocale]) {
        defaultTranslation = JSON.parse(JSON.stringify(defaultTranslations.clientTranslations[defaultTranslations.defaultLocale])) as Translation;
    }

    let overridingTranslation = {} as Translation;
    if (translations && translations.clientTranslations) {
        if (translations.clientTranslations[preferredLocale]) {
            overridingTranslation = JSON.parse(JSON.stringify(translations.clientTranslations[preferredLocale])) as Translation;
        } else if (locale && translations.clientTranslations[locale]) {
            overridingTranslation = JSON.parse(JSON.stringify(translations.clientTranslations[locale])) as Translation;
        } else if (translations.clientTranslations[systemDefaultLocale]) {
            overridingTranslation = JSON.parse(JSON.stringify(translations.clientTranslations[systemDefaultLocale])) as Translation;
        }
    }
    return overridingTranslation ? mergeTranslation(defaultTranslation, overridingTranslation) : defaultTranslation;
}

export const minToHumanizedDuration = (min: number, locale?: string) => {
    const valueInMs = min * 60 * 1000;
    return msToHumanizedDuration(valueInMs, locale);
};

export const getLangFromLangOrLocale = (langOrLocale: string) => {
    if (langOrLocale.split("-").length > 1) return langOrLocale.split("-")[0];
    return langOrLocale;
};

export const getArrayOfFallbackLanguages = (locale?: string) => {
    const returning: string[] = [];
    if (locale) returning.push(getLangFromLangOrLocale(locale));
    returning.push(getLangFromLangOrLocale(navigator.language));
    returning.push("en");
    return returning;
};

export const msToHumanizedDuration = (valueInMs: number, locale?: string) => {
    const localeToUse = locale ? locale : "en";
    return humanizeDuration(valueInMs, { language: localeToUse, fallbacks: getArrayOfFallbackLanguages(localeToUse) });
};