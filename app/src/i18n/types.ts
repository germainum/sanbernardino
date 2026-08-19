export type Lang = "fr" | "en" | "de" | "it";

export const LANGS: readonly Lang[] = ["fr", "en", "de", "it"];

/** Each language's own name for itself — a picker shows these, never translated. */
export const LANG_NAMES: Record<Lang, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  it: "Italiano",
};

export interface Dictionary {
  common: {
    settingsAriaLabel: string;
    back: string;
    min: string;
    tunnel: string;
    col: string;
    language: string;
  };
  home: {
    eyebrow: string;
    offline: string;
  };
  directionSwitch: {
    ariaLabel: string;
    toSwitzerland: string;
    toItaly: string;
  };
  verdict: {
    route: Record<"italie" | "suisse", { from: string; to: string }>;
    title: Record<"tunnel" | "col" | "gothard" | "attente", string>;
    chip: Record<"tunnel" | "col" | "gothard" | "attente", string>;
    heroTunnelColClosed: string;
    heroTunnelColOpen: string;
    heroColTunnelClosed: string;
    heroColTunnelOpen: string;
    heroGothard: string;
    heroAttente: string;
  };
  statusLine: {
    colOpen: string;
    colRestricted: string;
    colClosed: string;
    staleSuffix: string;
  };
  axisCondition: {
    saturated: string;
    heavy: string;
    fluid: string;
  };
  comparison: {
    colClosedPrefix: string;
    colClosedFallback: string;
    costVignette: string;
    costFree: string;
  };
  routeCard: {
    trait: Record<"tunnel" | "col", string>;
    colState: Record<"go" | "caution" | "stop", string>;
    trendWorse: string;
    trendBetter: string;
    trendStable: string;
    delay: string;
    stateLabel: string;
  };
  routeMap: {
    departSuisse: string;
    arriveeItalie: string;
    departItalie: string;
    arriveeSuisse: string;
  };
  gothardPanel: {
    altRoute: string;
    altDismissed: string;
    name: string;
    detour: (min: number) => string;
    notFaster: string;
  };
  scenarioSwitcher: {
    label: string;
  };
  webcam: {
    defaultTitle: string;
    unavailable: (status: number) => string;
    imageUnavailable: string;
    connectionFailed: string;
    loadingLabel: string;
    offlineLabel: string;
    retry: string;
    altText: (title: string) => string;
  };
  settings: {
    title: string;
    notificationsTitle: string;
    notificationsExplain: string;
    enableNotifications: string;
    directionsTitle: string;
    typesTitle: string;
    types: {
      verdict: string;
      col_open: string;
      tunnel_closed: string;
      jam_threshold: string;
      gothard: string;
      cleared: string;
      restriction: string;
    };
    jamThresholdTitle: string;
    jamThresholdNote: string;
    quietHoursTitle: string;
    quietHoursFrom: string;
    quietHoursTo: string;
    quietHoursNote: string;
    plannedTripTitle: string;
    plannedTripButton: string;
    plannedTripSaved: string;
    plannedTripError: string;
    saveError: string;
    adsTitle: string;
    adsRemoved: string;
    adsDescription: string;
    adsBuy: (price: string) => string;
    adsBuying: string;
    adsUnavailable: string;
    adsRestore: string;
    adsRestoring: string;
    footerSource: string;
    footerSourceLink: string;
    footerTravelTime: string;
    footerDisclaimer: string;
    languageTitle: string;
  };
  format: {
    updatedNow: string;
    updatedOneMinuteAgo: string;
    updatedMinutesAgo: (n: number) => string;
    updatedHoursAgo: (n: number) => string;
  };
  source: {
    simulated: string;
    live: string;
    offline: string;
  };
}
