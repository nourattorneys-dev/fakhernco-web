'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Hover/focus disclosure for the header menus.
 *
 * WHY THIS NEEDS STATE AT ALL
 * ---------------------------
 * The menu opens on :hover, which is fine until you click one of its links.
 * Next navigates client-side, so the page changes but the cursor is still
 * over the trigger — :hover is still true, and the menu stays open over the
 * page you just navigated to. CSS alone cannot close a menu that is still
 * being hovered.
 *
 * So a navigation suppresses the menu until the pointer actually leaves, or
 * Escape is pressed. Hover and focus still drive it the rest of the time,
 * which keeps it working without JavaScript for anyone who never clicks
 * through.
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
  const [suppressed, setSuppressed] = useState(false);

  useEffect(() => {
    if (pathname !== seen.current) {
      seen.current = pathname;
      setSuppressed(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!suppressed) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSuppressed(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [suppressed]);

  return (
    <div
      className="group relative"
      data-closed={suppressed || undefined}
      onMouseLeave={() => setSuppressed(false)}
    >
      <Link
        href={href}
        className="flex items-center gap-1.5 py-6 font-display text-[0.9375rem] font-600 text-ink transition-opacity hover:opacity-60"
      >
        {label}
        <span aria-hidden className="text-[0.55rem] text-muted">
          ▼
        </span>
      </Link>

      <div
        className={`invisible absolute top-full opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 group-data-[closed]:invisible group-data-[closed]:opacity-0 ${
          wide ? 'left-1/2 w-[64rem] max-w-[95vw] -translate-x-1/2' : 'start-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
