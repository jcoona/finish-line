"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import styles from "./page.module.css";

type RaceOption = {
  runsignupRaceId: string;
  label: string;
};

type RaceHistorySelectorProps = {
  options: RaceOption[];
  selectedRaceId?: string;
  sectionId: string;
};

export function RaceHistorySelector({
  options,
  selectedRaceId,
  sectionId,
}: RaceHistorySelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(selectedRaceId ?? options[0]?.runsignupRaceId ?? "");

  const baseParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function handleChange(nextValue: string) {
    setValue(nextValue);

    const nextParams = new URLSearchParams(baseParams);
    if (nextValue) {
      nextParams.set("race", nextValue);
    } else {
      nextParams.delete("race");
    }

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    });

    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className={styles.selectorRow}>
      <label className={styles.selectorLabel} htmlFor="race">
        Race
      </label>
      <select
        aria-label="Select a race history"
        className={styles.selectorInput}
        disabled={isPending}
        id="race"
        onChange={(event) => handleChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.runsignupRaceId} value={option.runsignupRaceId}>
            {option.label}
          </option>
        ))}
      </select>
      {isPending ? <span className={styles.selectorStatus}>Loading history…</span> : null}
    </div>
  );
}
