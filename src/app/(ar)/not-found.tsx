import { LocaleNotFound } from '@/components/LocaleNotFound';

/**
 * The Arabic route group's 404. The component is shared — see LocaleNotFound
 * for why this file used to be a byte-identical copy of the English one, and
 * what that did to an Arabic reader who mistyped a URL.
 */
export default function NotFound() {
  return <LocaleNotFound locale="ar" />;
}
