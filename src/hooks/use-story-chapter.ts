"use client";

import { useEffect, useState } from "react";

export const storyChapters = [
  { id: "top", number: "01", label: "The idea" },
  { id: "manifesto", number: "02", label: "The point of view" },
  { id: "work", number: "03", label: "The proof" },
  { id: "services", number: "04", label: "The craft" },
  { id: "approach", number: "05", label: "The method" },
  { id: "contact", number: "06", label: "The result" },
] as const;

/** Updates only when the reader enters a new story chapter, never on every scroll tick. */
export function useStoryChapter() {
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    const sections = storyChapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.chapter);
          if (Number.isInteger(index)) setActiveChapter(index);
        });
      },
      // A narrow line below the header makes chapters change when their own content arrives,
      // even when a previous long sticky section still occupies most of the viewport.
      { rootMargin: "-16% 0px -82%", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return storyChapters[activeChapter] ?? storyChapters[0];
}
