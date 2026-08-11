'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Hover/tap disclosure for the header menus.
 *
 * WHY HOVER ALONE DOES NOT WORK
 * -----------------------------
 * Two problems, and the second is the one that traps people.
 *
 * 1. The menu opens on :hover, which is fine until you click one of its links.
 *    Next navigates client-side, so the page changes but the cursor is still
 *    over the trigger — :hover is still true, and the menu stays open over the
 *    page you just arrived at. CSS alone cannot close a menu that is still
 *    being hovered.
 *
 * 2. On a touch screen there is no hover to leave. Tapping the trigger fires a
 *    synthetic hover, the panel opens, and then nothing the reader can do will
 *    close it: no pointer ever leaves, and tapping again re-fires the same
 *    hover. The panel covers the page until they navigate away.
 *
 * So the chevron is a real disclosure button — aria-expanded, toggles on tap,
 * closes on Escape or on a tap outside. The label stays a plain link, so
 * tapping "Services" still goes to the services page rather than being
 * swallowed by the toggle, which is what happens when the whole trigger is
 * turned into a button.
 *
 * Hover still opens it for anyone using a pointer, so desktop loses nothing,
 * and the links remain in the markup for a reader who never taps at all.
 */
export function NavGroup({
  href,
  label,
  children,
  wide = false,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const seen = useRef(pathname);
  const root = useRef<HTMLDivElement>(null);

  /** Opened by tap. Separate from hover, which CSS drives on its own. */
  const [open, setOpen] = useState(false);
  /** Hover suppressed after a client-side navigation, until the pointer leaves. */
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    if (pathname !== seen.current) {
      seen.current = pathname;
      setSuppressed(true);
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open && !suppressed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setSuppressed(false);
    };
    // A tap anywhere else closes it — what every other menu on a phone does,
    // and the first thing anyone tries.
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open, suppressed]);

  return (
    <div
      ref={root}
      className="group relative"
      data-closed={suppressed && !open ? '' : undefined}
      data-open={open ? '' : undefined}
      onMouseLeave={() => setSuppressed(false)}
    >
      <div className="flex items-center">
        <Link
          href={href}
          className="py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
        >
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${label}: show or hide`}
          data-on={open ? '' : undefined}
          onClick={() => {
            setOpen((v) => !v);
            setSuppressed(false);
          }}
          className="-ms-0.5 p-2 text-[0.55rem] text-muted transition-transform data-[on]:rotate-180"
        >
          <span aria-hidden>▼</span>
        </button>
      </div>

      <div
        className={`invisible absolute top-full opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 group-data-[open]:visible group-data-[open]:opacity-100 group-data-[closed]:invisible group-data-[closed]:opacity-0 ${
          wide ? 'left-1/2 w-[64rem] max-w-[95vw] -translate-x-1/2' : 'start-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
