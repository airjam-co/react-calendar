import { CALENDAR_DEFAULT_TRANSLATIONS, ComponentTranslation, Translation, negotiateLocale } from "@airjam/types";
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
    const preferredLocale = translations && locale ? negotiateLocale(translations, locale) : undefined;
    const defaultTranslations = CALENDAR_DEFAULT_TRANSLATIONS;
    let chosenTranslation = translations && translations.clientTranslations && preferredLocale ? translations.clientTranslations[preferredLocale] : undefined;
     if (!chosenTranslation) {
      console.log('no translation found, using default');
      chosenTranslation = defaultTranslations.clientTranslations[defaultTranslations.defaultLocale];
      if (preferredLocale) chosenTranslation = defaultTranslations.clientTranslations[preferredLocale];
    }
    let translationToUse: Translation = chosenTranslation!;
    return translationToUse;
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