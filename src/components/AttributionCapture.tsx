"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureCampaignAttribution } from "@/lib/marketing/attribution";

export function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureCampaignAttribution(pathname || "/", window.location.search, document.referrer);
  }, [pathname]);
  return null;
}
