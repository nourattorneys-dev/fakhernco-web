'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/locale';
import { t } from '@/lib/ui';
import { PHONE, TEL_HREF } from '@/lib/contact';

type State = 'idle' | 'sending' | 'sent' | 'error';

/**
 * The contact form, in either locale.
 *
 * `services` comes from the CMS practice areas rather than a hardcoded list,
 * so the Arabic form offers the firm's own Arabic service names and the
 * options stay in step if a practice area is renamed.
 *
 * The submitted locale is passed through to the CMS, which uses it to decide
 * which language to send the auto-reply in.
 */
export function ContactForm({
  locale = 'en',
  services = [],
}: {
  locale?: Locale;
  services?: string[];
}) {
  const s = t(locale);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const options = [...services, s.other];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    /*
      FormData serialises a ticked checkbox as the STRING "true" and omits an
      unticked one entirely. The CMS stores `body.consent === true` — strict
      equality against a boolean — so every enquiry ever submitted was recorded
      with consent: false, whatever the enquirer actually ticked. For a law firm
      that is not a display bug; it is the consent record being wrong.
    */
    const consent = payload.consent === 'true';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, consent, sourcePage: window.location.pathname, locale }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? s.genericError);
      }
      /*
        A preview deploy short-circuits the proxy rather than writing a real
        enquiry into the firm's leads table. Say so plainly instead of showing
        the success panel — a green tick that did nothing is the one outcome
        that would make a genuinely broken form look fine during QA.
      */
      if (body.preview) {
        throw new Error('Preview deployment — nothing was sent to the CMS.');
      }
      /*
        Reported here, not on the button click, and only after the CMS has
        confirmed it stored. A click-triggered conversion counts submissions
        that failed validation, timed out, or hit a network error — which
        teaches Google's bidding to buy clicks that never became enquiries.

        `generate_lead` is GA4's standard lead event, so it can be marked as a
        key event in GA4 and imported into Google Ads as a conversion — no
        conversion label to copy around, and it keeps working if the Ads
        account is ever rebuilt.

        source_page is the landing page the enquiry came from, which is the
        number that tells the firm where to move budget.
      */
      window.gtag?.('event', 'generate_lead', {
        source_page: window.location.pathname,
        service: String(payload.service ?? ''),
        language: locale,
      });

      setState('sent');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : s.genericError);
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-ink card-p">
        <h2 className="text-card">{s.thanksTitle}</h2>
        <p className="mt-3 text-body">
          {s.thanksBody}{' '}
          <a href={TEL_HREF} className="font-medium text-ink underline underline-offset-2" dir="ltr">
            {PHONE.DISPLAY}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/*
        Honeypot. Hidden from people, filled in by bots. Not display:none —
        some bots skip those — and aria-hidden + tabIndex keep it away from
        screen readers and keyboard users.
      */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={s.fullName} name="name" required autoComplete="name" />
        <Field label={s.email} name="email" type="email" required autoComplete="email" />
        <Field label={s.phone} name="phone" type="tel" autoComplete="tel" />
        {/*
          min-w-0 is load-bearing.

          Grid items default to min-width:auto, which refuses to shrink below
          the content's intrinsic size. A <select> takes that from its longest
          option — "Company Formation & Corporate Services" measures 326px — so
          on a 390px phone, where this column has 244px, the control pushed 82px
          past the container and the form hung off the right edge of the screen.
          The options come from the CMS, so the longest one is not fixed and
          this cannot be solved by shortening a label.
        */}
        <label className="flex min-w-0 flex-col gap-2">
          <span className="font-display text-sm font-600 text-ink">{s.howCanWeHelp}</span>
          <select
            name="service"
            className="w-full border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              {s.selectService}
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex min-w-0 flex-col gap-2">
        <span className="font-display text-sm font-600 text-ink">
          {s.yourMessage} <span className="text-muted">*</span>
        </span>
        <textarea
          name="message"
          required
          rows={6}
          className="w-full border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
          placeholder={s.messagePlaceholder}
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-body">
        <input type="checkbox" name="consent" value="true" className="mt-1 accent-[#141414]" />
        <span>{s.consent}</span>
      </label>

      {error && (
        <p role="alert" className="border-s-2 border-ink bg-surface-alt px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-ink px-8 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2 disabled:opacity-50"
        >
          {state === 'sending' ? s.sending : s.sendEnquiry}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="font-display text-sm font-600 text-ink">
        {label} {required && <span className="text-muted">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
      />
    </label>
  );
}
