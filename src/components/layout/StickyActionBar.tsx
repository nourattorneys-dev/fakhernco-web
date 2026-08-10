import { PHONE, TEL_HREF } from '@/lib/contact';

/**
 * Sticky action bar for the ad landing pages.
 *
 * WHY NOT A SECOND FLOATING BUTTON
 * Two circles stacked in the same corner compete with each other and neither
 * gets pressed — and the WhatsApp one is already there. A bar spanning the
 * foot gives the primary action a full-width target and room for a label, so
 * the reader can see what it does rather than guessing from an icon.
 *
 * MOBILE ONLY
 * Below `sm` the header replaces its WhatsApp button with a small "Contact Us"
 * text link, so a phone reader scrolling a 900-word page has no prominent way
 * to act until they reach the form. On desktop the sticky header keeps its
 * call-to-action in view the whole way down, and a second fixed bar there
 * would just cover the content.
 *
 * `data-action-bar` is read by globals.css, which lifts the floating WhatsApp
 * button clear of this bar on pages that render it.
 */
export function StickyActionBar() {
  return (
    <div
      data-action-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-sm lg:hidden"
    >
      <div className="flex items-stretch gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <a
          href="#enquire"
          className="flex flex-1 items-center justify-center bg-ink px-5 py-3 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2"
        >
          Request a consultation
        </a>
        <a
          href={TEL_HREF}
          aria-label={`Call ${PHONE.DISPLAY}`}
          className="flex shrink-0 items-center justify-center border border-ink px-5 py-3 font-display text-sm font-700 text-ink transition-colors hover:bg-surface-alt"
        >
          <span aria-hidden>Call</span>
        </a>
      </div>
    </div>
  );
}
