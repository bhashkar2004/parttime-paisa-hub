import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "en" | "te";

export const LANG_KEY = "ptp_lang";

export const getStoredLang = (): Lang =>
  (typeof window !== "undefined" && localStorage.getItem(LANG_KEY)) === "te" ? "te" : "en";

const UI: Record<string, { en: string; te: string }> = {
  backHome: { en: "Back to Home", te: "హోమ్‌కి తిరిగి" },
  myApplications: { en: "My Applications", te: "నా దరఖాస్తులు" },
  myJobs: { en: "My Jobs", te: "నా ఉద్యోగాలు" },
  postJob: { en: "Post a Job", te: "ఉద్యోగం పోస్ట్ చేయండి" },
  heading: { en: "Available Opportunities", te: "అందుబాటులో ఉన్న ఉద్యోగాలు" },
  subHeading: {
    en: "Browse and apply for part-time positions",
    te: "పార్ట్ టైమ్ ఉద్యోగాలు చూసి దరఖాస్తు చేసుకోండి",
  },
  allLocations: { en: "All Locations", te: "అన్ని ప్రాంతాలు" },
  filterLocation: { en: "Filter by location", te: "ప్రాంతం ప్రకారం వడపోత" },
  loading: { en: "Loading jobs...", te: "ఉద్యోగాలు లోడ్ అవుతున్నాయి..." },
  noJobs: { en: "No jobs available yet", te: "ఇంకా ఉద్యోగాలు లేవు" },
  noJobsHere: { en: "No jobs in", te: "ఇక్కడ ఉద్యోగాలు లేవు:" },
  beFirst: { en: "Be the first to post a job opportunity!", te: "మొదటి ఉద్యోగాన్ని మీరే పోస్ట్ చేయండి!" },
  tryOther: {
    en: "Try selecting a different location or check back later",
    te: "వేరే ప్రాంతం ఎంచుకోండి లేదా తర్వాత చూడండి",
  },
  applyBy: { en: "Apply by", te: "చివరి తేదీ" },
  experience: { en: "Experience", te: "అనుభవం" },
  qualification: { en: "Qualification", te: "విద్యార్హత" },
  salary: { en: "Salary", te: "జీతం" },
  contactRecruiter: { en: "Contact Recruiter:", te: "యజమానిని సంప్రదించండి:" },
  call: { en: "Call", te: "కాల్" },
  email: { en: "Email", te: "ఇమెయిల్" },
  applyNow: { en: "Apply Now", te: "ఇప్పుడే దరఖాస్తు చేయండి" },
  translating: { en: "Translating...", te: "అనువాదం జరుగుతోంది..." },
};

export const useLanguage = () => {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
    window.dispatchEvent(new CustomEvent("ptp-lang", { detail: next }));
  }, []);

  const t = useCallback((key: keyof typeof UI) => UI[key]?.[lang] ?? String(key), [lang]);

  return { lang, setLang, t };
};

/** Translates a list of strings, caching results in localStorage. */
export const useTranslatedTexts = (texts: string[], lang: Lang) => {
  const [map, setMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const unique = useMemo(
    () => Array.from(new Set(texts.filter((t) => t && t.trim().length > 0))),
    [texts],
  );

  useEffect(() => {
    if (lang === "en" || unique.length === 0) return;

    let cancelled = false;
    const cacheKey = `ptp_tr_${lang}`;
    const cache: Record<string, string> = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    const missing = unique.filter((t) => !cache[t]);

    setMap({ ...cache });
    if (missing.length === 0) return;

    const run = async () => {
      setBusy(true);
      try {
        for (let i = 0; i < missing.length; i += 60) {
          const batch = missing.slice(i, i + 60);
          const { data, error } = await supabase.functions.invoke("translate-text", {
            body: { texts: batch, target: lang },
          });
          if (error || !data?.translations) break;
          batch.forEach((src, idx) => {
            cache[src] = data.translations[idx] ?? src;
          });
          localStorage.setItem(cacheKey, JSON.stringify(cache));
          if (!cancelled) setMap({ ...cache });
        }
      } finally {
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

  return { tr, busy };
};
