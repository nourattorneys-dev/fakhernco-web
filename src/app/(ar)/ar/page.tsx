import { redirect } from 'next/navigation';

/**
 * There is no Arabic homepage.
 *
 * /ar/ on the live site is only 15% Arabic — the hero and most sections are
 * still English — so importing it would produce a half-translated homepage,
 * which is worse than sending the reader to the English one. Redirect until
 * a real Arabic homepage is written.
 *
 * The language switcher already hides itself on `/` for the same reason, so
 * this path is only reachable from a legacy link or a bookmark.
 */
export default function ArabicHome() {
  redirect('/');
}
