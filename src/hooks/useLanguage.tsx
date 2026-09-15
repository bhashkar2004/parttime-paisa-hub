import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, findLanguage } from "@/lib/languages";

/** Short language code, e.g. "en", "te", "es". */
export type Lang = string;

export const LANG_KEY = "ptp_lang";

const translationRequests = new Map<string, Promise<{ translations?: string[]; warning?: string }>>();

const requestTranslations = (texts: string[], target: Lang) => {
  const key = `${target}:${texts.join("\u0000")}`;
  const existing = translationRequests.get(key);
  if (existing) return existing;

  const request = supabase.functions
    .invoke("translate-text", { body: { texts, target } })
    .then(({ data, error }) => {
      if (error) throw error;
      return (data ?? {}) as { translations?: string[]; warning?: string };
    });
  translationRequests.set(key, request);
  return request;
};

export const getStoredLang = (): Lang => {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_KEY);
  return LANGUAGES.some((l) => l.code === stored) ? (stored as Lang) : "en";
};

export const storeLang = (next: Lang) => {
  localStorage.setItem(LANG_KEY, next);
  window.dispatchEvent(new CustomEvent("ptp-lang", { detail: next }));
};

/** English source strings; every other language is translated on the fly. */
const UI = {
  backHome: "Back to Home",
  myApplications: "My Applications",
  myJobs: "My Jobs",
  postJob: "Post a Job",
  heading: "Available Opportunities",
  subHeading: "Browse and apply for part-time positions",
  allLocations: "All Locations",
  filterLocation: "Filter by location",
  loading: "Loading jobs...",
  noJobs: "No jobs available yet",
  noJobsHere: "No jobs in",
  beFirst: "Be the first to post a job opportunity!",
  tryOther: "Try selecting a different location or check back later",
  applyBy: "Apply by",
  experience: "Experience",
  qualification: "Qualification",
  salary: "Salary",
  contactRecruiter: "Contact Recruiter:",
  call: "Call",
  email: "Email",
  applyNow: "Apply Now",
  translating: "Translating...",
  changeLanguage: "Change language in My Profile",
} as const;

export type UiKey = keyof typeof UI;

export const useLanguage = () => {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  useEffect(() => {
    const onLang = (e: Event) => setLangState((e as CustomEvent<Lang>).detail);
    window.addEventListener("ptp-lang", onLang);
    return () => window.removeEventListener("ptp-lang", onLang);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storeLang(next);
  }, []);

  const uiTexts = useMemo(() => Object.values(UI) as string[], []);
  const { tr } = useTranslatedTexts(uiTexts, lang);

  const t = useCallback((key: UiKey) => tr(UI[key]) || UI[key], [tr]);

  return { lang, setLang, t, language: findLanguage(lang) };
};

/** Translates a list of strings, caching results in localStorage. */
export const useTranslatedTexts = (texts: string[], lang: Lang) => {
  const [map, setMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const unique = useMemo(
    () =>
      Array.from(new Set(texts.filter((t) => t && t.trim().length > 0)))
        .sort()
        .join("\u0000"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texts.join("\u0000")],
  );

  // Keys we already requested (or that failed), so we never loop on the same texts.
  const attempted = useRef<Set<string>>(new Set());
  const inFlight = useRef(false);

  useEffect(() => {
    if (lang === "en" || unique.length === 0) return;

    let cancelled = false;
    const cacheKey = `ptp_tr_${lang}`;
    let cache: Record<string, string> = {};
    try {
      cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    } catch {
      cache = {};
    }
    const missing = unique.split("\u0000").filter((t) => t && !cache[t]);

    setMap({ ...cache });
    if (missing.length === 0) return;

    const runKey = `${lang}:${missing.join("\u0000")}`;
    if (inFlight.current || attempted.current.has(runKey)) return;
    attempted.current.add(runKey);
    inFlight.current = true;

    const run = async () => {
      setBusy(true);
      try {
        for (let i = 0; i < missing.length; i += 60) {
          const batch = missing.slice(i, i + 60);
          const data = await requestTranslations(batch, lang);
          if (!data.translations) break;
          batch.forEach((src, idx) => {
            cache[src] = data.translations?.[idx] ?? src;
          });
          localStorage.setItem(cacheKey, JSON.stringify(cache));
          if (!cancelled) {
            setMap({ ...cache });
            setWarning(data.warning ?? null);
          }
        }
      } catch {
        // ignore — English text stays visible
      } finally {
        inFlight.current = false;
        if (!cancelled) setBusy(false);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [unique, lang]);

  const tr = useCallback(
    (text: string | null | undefined) => {
      if (!text) return text ?? "";
      if (lang === "en") return text;
      return map[text] ?? text;
    },
    [map, lang],
  );

  return { tr, busy, warning };
};
