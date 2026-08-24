'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_DIR,
  LOCALE_HREFLANG,
  LOCALE_LABEL,
  LOCALE_NAV_ARIA,
  LOCALE_SWITCH_ARIA,
  localeOf,
  pathIn,
  type Locale,
} from '@/lib/locale';

/**
 * Language switcher — a dropdown showing the current language, opening a menu
 * of the others.
 *
 * The menu items are real <Link>s rendered in the DOM, not a <select> that
 * navigates from JavaScript. That keeps the two virtues the old link-row had:
 * crawlable alternate URLs, and staying on the page being read rather than
 * dumping the reader on a homepage.
 *
 * Only locales the CURRENT PAGE genuinely exists in are offered. `translated`
 * is resolved on the server from the CMS, so the menu never links into a 404 —
 * a German page that does not exist yet is simply not listed.
 *
 * FLAGS ARE INLINE SVG, NOT EMOJI. Windows renders flag emoji as bare letter
 * pairs ("GB", "DE"), which reads as broken on a law firm's site. Three tiny
 * hand-drawn rects cost nothing and render identically everywhere. The Union Jack for
 * English, UAE for Arabic, Germany for German.
 */

/**
 * The languages the header offers.
 *
 * Deliberately NOT `LOCALES`. German pages still exist and stay reachable by
 * URL, in the sitemap and via hreflang - they are simply not advertised in the
 * header, which the site offers as an English/Arabic choice. Re-adding German
 * to the menu is a one-word change here; nothing else needs touching.
 */
const SWITCHER_LOCALES = ['en', 'ar'] as const satisfies readonly Locale[];

function Flag({ locale }: { locale: Locale }) {
  const common = {
    width: 20,
    height: 14,
    viewBox: '0 0 20 14',
    'aria-hidden': true as const,
    className: 'shrink-0 rounded-[2px] ring-1 ring-black/10',
  };
  switch (locale) {
    case 'en':
      // United Kingdom — a simplified Union Jack; at 20px the fimbriation
      // detail of the real ensign would just smear.
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#012169" />
          <path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.8" />
          <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="4.6" />
          <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.8" />
        </svg>
      );
    case 'ar':
      // United Arab Emirates.
      return (
        <svg {...common}>
          <rect width="20" height="14" fill="#00732F" />
          <rect y="4.67" width="20" height="4.66" fill="#fff" />
          <rect y="9.33" width="20" height="4.67" fill="#000" />
          <rect width="5" height="14" fill="#FF0000" />
        </svg>
      );
    case 'de':
      // Germany.
      return (
        <svg {...common}>
          <rect width="20" height="4.67" fill="#000" />
          <rect y="4.67" width="20" height="4.66" fill="#DD0000" />
          <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
        </svg>
      );
  }
}

export function LanguageSwitcher({
  translated,
}: {
  translated: Partial<Record<Locale, string[]>>;
}) {
  const pathname = usePathname() ?? '/';
  const current = localeOf(pathname);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  /*
    Close on outside click and on Escape. Deliberately plain listeners rather
    than a focus-trap library: the menu is two or three links, and Tab moving
    beyond them closing the menu is acceptable dropdown behaviour.
  */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Close when the route changes — the reader picked a language.
  useEffect(() => setOpen(false), [pathname]);

  const others = SWITCHER_LOCALES.filter((locale) => locale !== current)
    .map((locale) => ({ locale, target: pathIn(pathname, locale) }))
    .filter(
      ({ locale, target }) =>
        locale === DEFAULT_LOCALE || (translated[locale] ?? []).includes(target),
    );

  if (!others.length) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      {/*
        dir="ltr" on the rows, deliberately: without it the flex order mirrors
        on Arabic pages, so the flag sat on the opposite side of the name
        depending on which language you were reading. The row order is fixed —
        name, then flag, then chevron — on every locale; only the name itself
        still renders in its own script direction.
      */}
      <button
        type="button"
        dir="ltr"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={LOCALE_NAV_ARIA[current]}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 border border-line px-2.5 py-1.5 font-display text-xs font-600 text-ink transition-colors hover:border-ink sm:px-3 lg:px-3.5 lg:py-2 lg:text-sm"
      >
        <span className="hidden sm:inline">{LOCALE_LABEL[current]}</span>
        <Flag locale={current} />
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M0 0l4 5 4-5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-[10rem] border border-line bg-surface py-1 shadow-lg"
        >
          {others.map(({ locale, target }) => (
            <Link
              key={locale}
              role="menuitem"
              href={target}
              hrefLang={LOCALE_HREFLANG[locale]}
              lang={locale}
              dir="ltr"
              aria-label={LOCALE_SWITCH_ARIA[current][locale]}
              className="flex items-center justify-between gap-2.5 px-3.5 py-2 font-display text-sm font-600 text-ink transition-colors hover:bg-surface-alt"
            >
              <span lang={locale} dir={LOCALE_DIR[locale]}>
                {LOCALE_LABEL[locale]}
              </span>
              <Flag locale={locale} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
