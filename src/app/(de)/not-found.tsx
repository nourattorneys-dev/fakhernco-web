import { LocaleNotFound } from '@/components/LocaleNotFound';

/**
 * The German route group's 404. Shared component — see LocaleNotFound for what
 * happened the last time a locale's 404 was copied from another one's.
 */
export default function NotFound() {
  return <LocaleNotFound locale="de" />;
}
