import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

const STR = {
  en: {
    greeting: "Namaste",
    explore: "Explore Schemes",
    checkEligibility: "Check Eligibility",
    home: "Home",
    schemes: "Schemes",
    assistant: "Saathi AI",
    profile: "Profile",
  },
  hi: {
    greeting: "नमस्ते",
    explore: "योजनाएं देखें",
    checkEligibility: "पात्रता जांचें",
    home: "होम",
    schemes: "योजनाएं",
    assistant: "साथी एआई",
    profile: "प्रोफ़ाइल",
  }
};

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("js_lang") || "en");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    localStorage.setItem("js_lang", lang);
  }, [lang]);

  const t = (key) => STR[lang]?.[key] || STR.en[key] || key;

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    userId,
    setUserId
  }), [lang, userId]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
