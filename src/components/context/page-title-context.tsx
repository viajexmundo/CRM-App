"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface PageTitleContextType {
  /** Map of CUID → display name (e.g., "cmmsdqdl5000mh6rul327h9" → "Cancún - Juan Pérez") */
  titles: Record<string, string>;
  setPageTitle: (id: string, title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType>({
  titles: {},
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [titles, setTitles] = useState<Record<string, string>>({});

  const setPageTitle = useCallback((id: string, title: string) => {
    setTitles((prev) => {
      if (prev[id] === title) return prev;
      return { ...prev, [id]: title };
    });
  }, []);

  return (
    <PageTitleContext.Provider value={{ titles, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
