import { type Locale } from '@/lib/locale';
import { t } from '@/lib/ui';

/**
 * The dark strip above the header, as on the live site.
 *
 * Was a private copy in each root layout. Adding a third locale would have made
 * three, and this codebase has already paid twice for copied locale chrome —
 * the Arabic 404 that rendered English, and the Arabic breadcrumb that linked
 * to the English homepage labelled "English". Both were copies that nobody
 * revisited.
 *
 * Extracted with the existing strings verbatim, so English and Arabic output is
 * unchanged.
 */
export function UtilityBar({ locale }: { locale: Locale }) {
  const s = t(locale);

  return (
    <div className="bg-bar text-white">
      <div className="site-container flex h-9 items-center gap-6 overflow-x-auto text-xs whitespace-nowrap">
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-white/40">◷</span>
          <span className="font-semibold">{s.weekdays}</span>
          <span className="text-white/55">{s.hours}</span>
        </span>
        {/*
          The location was `hidden sm:flex`, so on a phone it disappeared
          entirely — the bar told you the hours of an office it would not name.
          The full street address is too long for a 390px bar, so the city shows
          there and the whole thing from sm up.

          The "Main Office" label goes too below sm. With it, the two groups
          need ~364px and a 390px phone offers ~350, so the address ran under
          the edge — the bar scrolls, but all the reader sees is a word cut in
          half. The label is the redundant part: the pin marks it as a place and
          the text already says Abu Dhabi.
        */}
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-white/40">⌖</span>
          <span className="hidden font-semibold sm:inline">{s.mainOffice}</span>
          <span className="text-white/55 sm:hidden">{s.officeCity}</span>
          <span className="hidden text-white/55 sm:inline">{s.officeAddress}</span>
        </span>
      </div>
    </div>
  );
}
