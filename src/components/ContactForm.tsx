'use client';

import { useState } from 'react';

const SERVICES = [
  'Litigation & Dispute Resolution',
  'Personal & Criminal Legal Services',
  'Contracts & Legal Document Drafting',
  'Company Formation & Corporate Services',
  'Private Notary & Attestation Services',
  'Other',
];

type State = 'idle' | 'sending' | 'sent' | 'error';

export function ContactForm() {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, sourcePage: window.location.pathname, locale: 'en' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }
      setState('sent');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-ink p-8">
        <h2 className="text-xl">Thank you — your enquiry has been received.</h2>
        <p className="mt-3 text-body">
          A member of our team will respond within one business day. We have sent a confirmation to
          your email address. If your matter is urgent, call{' '}
          <a href="tel:+971502057209" className="font-medium text-ink underline underline-offset-2">
            +971 50 205 7209
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/*
        Honeypot. Hidden from people, filled in by bots. Not `display:none` —
        some bots skip those — and aria-hidden + tabIndex keep it away from
        screen readers and keyboard users.
      */}
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
        <label className="flex flex-col gap-2">
          <span className="font-display text-sm font-600 text-ink">How can we help?</span>
          <select
            name="service"
            className="border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Select a service
            </option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-display text-sm font-600 text-ink">
          Your message <span className="text-muted">*</span>
        </span>
        <textarea
          name="message"
          required
          rows={6}
          className="border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
          placeholder="Tell us briefly about your matter."
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-body">
        <input type="checkbox" name="consent" value="true" className="mt-1 accent-[#141414]" />
        <span>
          I consent to Fakher &amp; Co storing this enquiry so they can respond to me. Submitting
          this form does not create a lawyer–client relationship.
        </span>
      </label>

      {error && (
        <p role="alert" className="border-l-2 border-ink bg-surface-alt px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-ink px-8 py-3.5 font-display text-sm font-700 text-white transition-colors hover:bg-ink-2 disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Send enquiry'}
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
    <label className="flex flex-col gap-2">
      <span className="font-display text-sm font-600 text-ink">
        {label} {required && <span className="text-muted">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="border border-line bg-surface px-4 py-3 text-[0.9375rem] focus:border-ink focus:outline-none"
      />
    </label>
  );
}
