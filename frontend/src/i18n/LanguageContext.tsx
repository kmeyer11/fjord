import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LOCALE, translations, type Language } from './translations'

const STORAGE_KEY = 'fjord.language'

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  locale: string
  t: typeof translations.en
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'da' || stored === 'en' ? stored : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value: LanguageContextValue = {
    language,
    setLanguage: setLanguageState,
    locale: LOCALE[language],
    t: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
