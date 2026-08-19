import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Preferences } from "@capacitor/preferences";
import { LANGS, type Dictionary, type Lang } from "./types";
import { fr } from "./fr";
import { en } from "./en";
import { de } from "./de";
import { it } from "./it";

export { LANGS, LANG_NAMES, type Lang, type Dictionary } from "./types";

const DICTIONARIES: Record<Lang, Dictionary> = { fr, en, de, it };

const LANG_CACHE_KEY = "sanbernardino:lang";

async function readCachedLang(): Promise<Lang | null> {
  const { value } = await Preferences.get({ key: LANG_CACHE_KEY });
  return value && (LANGS as readonly string[]).includes(value) ? (value as Lang) : null;
}

async function writeCachedLang(lang: Lang): Promise<void> {
  await Preferences.set({ key: LANG_CACHE_KEY, value: lang });
}

/** Matches "de-CH"/"it-IT"/etc. against our 4 supported locales; defaults to French. */
function detectLang(): Lang {
  const prefix = (typeof navigator !== "undefined" ? navigator.language : "fr").slice(0, 2).toLowerCase();
  return (LANGS as readonly string[]).includes(prefix) ? (prefix as Lang) : "fr";
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dictionary;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    (async () => {
      const cached = await readCachedLang();
      setLangState(cached ?? detectLang());
    })();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    void writeCachedLang(next);
  }

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, t: DICTIONARIES[lang] }), [lang]);

  return createElement(LangContext.Provider, { value }, children);
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang() must be used within a <LangProvider>");
  return ctx;
}
