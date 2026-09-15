export interface LanguageOption {
  /** Short language code stored in the profile / localStorage. */
  code: string;
  /** Name in the language itself. */
  native: string;
  /** English name, for search and secondary labels. */
  english: string;
  /** Locale used for speech recognition and speech output. */
  locale: string;
  /** Full name (with script) handed to the translation model. */
  aiName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", native: "English", english: "English", locale: "en-IN", aiName: "English" },
  { code: "hi", native: "हिंदी", english: "Hindi", locale: "hi-IN", aiName: "Hindi (Devanagari script)" },
  { code: "te", native: "తెలుగు", english: "Telugu", locale: "te-IN", aiName: "Telugu (Telugu script)" },
  { code: "ta", native: "தமிழ்", english: "Tamil", locale: "ta-IN", aiName: "Tamil (Tamil script)" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", locale: "kn-IN", aiName: "Kannada (Kannada script)" },
  { code: "ml", native: "മലയാളം", english: "Malayalam", locale: "ml-IN", aiName: "Malayalam (Malayalam script)" },
  { code: "mr", native: "मराठी", english: "Marathi", locale: "mr-IN", aiName: "Marathi (Devanagari script)" },
  { code: "bn", native: "বাংলা", english: "Bengali", locale: "bn-IN", aiName: "Bengali (Bengali script)" },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", locale: "gu-IN", aiName: "Gujarati (Gujarati script)" },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", locale: "pa-IN", aiName: "Punjabi (Gurmukhi script)" },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", locale: "or-IN", aiName: "Odia (Odia script)" },
  { code: "as", native: "অসমীয়া", english: "Assamese", locale: "as-IN", aiName: "Assamese (Bengali script)" },
  { code: "ur", native: "اردو", english: "Urdu", locale: "ur-IN", aiName: "Urdu (Arabic script)" },
  { code: "ar", native: "العربية", english: "Arabic", locale: "ar-SA", aiName: "Arabic (Arabic script)" },
  { code: "zh", native: "中文", english: "Chinese (Simplified)", locale: "zh-CN", aiName: "Simplified Chinese" },
  { code: "es", native: "Español", english: "Spanish", locale: "es-ES", aiName: "Spanish" },
  { code: "fr", native: "Français", english: "French", locale: "fr-FR", aiName: "French" },
  { code: "de", native: "Deutsch", english: "German", locale: "de-DE", aiName: "German" },
  { code: "pt", native: "Português", english: "Portuguese", locale: "pt-BR", aiName: "Portuguese" },
  { code: "ru", native: "Русский", english: "Russian", locale: "ru-RU", aiName: "Russian (Cyrillic script)" },
  { code: "ja", native: "日本語", english: "Japanese", locale: "ja-JP", aiName: "Japanese" },
  { code: "ko", native: "한국어", english: "Korean", locale: "ko-KR", aiName: "Korean" },
  { code: "it", native: "Italiano", english: "Italian", locale: "it-IT", aiName: "Italian" },
  { code: "tr", native: "Türkçe", english: "Turkish", locale: "tr-TR", aiName: "Turkish" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese", locale: "vi-VN", aiName: "Vietnamese" },
  { code: "th", native: "ไทย", english: "Thai", locale: "th-TH", aiName: "Thai (Thai script)" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian", locale: "id-ID", aiName: "Indonesian" },
  { code: "fa", native: "فارسی", english: "Persian", locale: "fa-IR", aiName: "Persian (Arabic script)" },
  { code: "sw", native: "Kiswahili", english: "Swahili", locale: "sw-KE", aiName: "Swahili" },
  { code: "nl", native: "Nederlands", english: "Dutch", locale: "nl-NL", aiName: "Dutch" },
  { code: "pl", native: "Polski", english: "Polish", locale: "pl-PL", aiName: "Polish" },
];

export const findLanguage = (code: string | null | undefined): LanguageOption =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
