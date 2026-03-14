"use client";

import { useState } from "react";
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

type DismissibleSyncBannerProps = {
  races: string;
  registrations: string;
  racesUpdated: string;
  eventsNamed: string;
  resultsMatched: string;
  nameFallbackMatches: string;
};

export function DismissibleSyncBanner({
  races,
  registrations,
  racesUpdated,
  eventsNamed,
  resultsMatched,
  nameFallbackMatches,
}: DismissibleSyncBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (dismissed) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);

    const nextParams = new URLSearchParams(searchParams.toString());

    for (const key of SYNC_QUERY_PARAMS) {
      nextParams.delete(key);
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }

  return (
    <section className={styles.successBanner}>
      <div className={styles.successBannerBody}>
        <strong>Sync completed.</strong>
        <span>
          {" "}
          Saved {races} races, {registrations} registrations, updated {racesUpdated} races,
          named {eventsNamed} events, and matched {resultsMatched} results (
          {nameFallbackMatches} via name fallback).
        </span>
      </div>
      <button
        aria-label="Dismiss sync completed message"
        className={styles.dismissButton}
        onClick={handleDismiss}
        type="button"
      >
        ×
      </button>
    </section>
  );
}
