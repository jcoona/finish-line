"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.css";

const SYNC_QUERY_PARAMS = [
  "synced",
  "races",
  "registrations",
  "racesUpdated",
  "eventsNamed",
  "resultsMatched",
  "nameFallbackMatches",
] as const;

export function DismissibleSyncBanner() {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(true);

      const nextParams = new URLSearchParams(searchParams.toString());

      for (const key of SYNC_QUERY_PARAMS) {
        nextParams.delete(key);
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      router.replace(nextUrl, { scroll: false });
    }, 4000);

    return () => clearTimeout(timer);
  }, [pathname, router, searchParams]);

  if (dismissed) {
    return null;
  }

  return (
    <section className={styles.successBanner}>
      <strong>Sync completed.</strong>
    </section>
  );
}
