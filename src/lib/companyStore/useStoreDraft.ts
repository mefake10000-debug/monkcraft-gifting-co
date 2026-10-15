"use client";

import { useEffect, useState } from "react";
import {
  emptyCompanyStoreDraft,
  type CompanyStoreDraft,
} from "@/data/companyStore/types";
import {
  COMPANY_STORE_DRAFT_EVENT,
  readCompanyStoreDraft,
} from "@/lib/companyStore/draft";

export function useStoreDraft() {
  const [draft, setDraft] = useState<CompanyStoreDraft>(emptyCompanyStoreDraft);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setDraft(readCompanyStoreDraft());
      setReady(true);
    };
    sync();
    window.addEventListener(COMPANY_STORE_DRAFT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPANY_STORE_DRAFT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { draft, ready };
}
