import type { Metadata } from 'next';
import { Phone, Mail, MapPin } from 'lucide-react';
import { SITE, whatsAppLink } from '@/lib/site';
import { EnquiryForm } from '@/components/enquiry-form';

export const metadata: Metadata = {
  title: 'Contact Glitz Holidays — Talk to a Kashmir Travel Specialist',
  description: `Contact Glitz Holidays. WhatsApp or call ${SITE.phone.display}, email ${SITE.email}, or send an enquiry — our Srinagar team replies within hours.`,
  alternates: { canonical: `${SITE.domain}/contact` },
};

export default function ContactPage() {
  return (
    <section className="container-editorial grid gap-14 py-20 md:grid-cols-2 md:py-28">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-brand-600)]">
          Get in touch
        </p>
        <h1 className="display mt-2 text-[44px] leading-[1.02] md:text-[64px]">
          Talk to a person who's actually in Kashmir.
        </h1>
        <p className="mt-6 text-[15.5px] leading-relaxed text-[color:var(--color-ink-700)] max-w-md">
          The fastest path to a real answer is WhatsApp — we reply within minutes
          during working hours (10am–9pm IST). For anything urgent on a live trip,
          call directly.
        </p>

        <div className="mt-8 space-y-5">
          <a
            href={`tel:${SITE.phone.tel}`}
            className="flex items-center gap-4 rounded-xl border border-[color:var(--color-ink-200)] bg-white p-5 hover:border-[color:var(--color-brand-500)] transition-colors"
          >
            <div className="grid size-11 place-items-center rounded-full bg-[color:var(--color-brand-500)] text-[color:var(--color-ink-950)]">
              <Phone className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Call us</p>
              <p className="text-[16px] font-medium text-[color:var(--color-ink-900)]">{SITE.phone.display}</p>
            </div>
          </a>

          <a
            href={whatsAppLink('a Himalayan holiday')}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-4 rounded-xl border border-[color:var(--color-ink-200)] bg-white p-5 hover:border-[#25D366] transition-colors"
          >
            <div className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white">
              <svg viewBox="0 0 24 24" className="size-5 fill-current"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.1-.3.1-.5 0-.3-.1-1.2-.4-2.2-1.3-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.2-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.8.1.2 1.8 2.9 4.4 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.3 4.9L2 22l5.3-1.3c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">WhatsApp</p>
              <p className="text-[16px] font-medium text-[color:var(--color-ink-900)]">{SITE.phone.display}</p>
            </div>
          </a>

          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-4 rounded-xl border border-[color:var(--color-ink-200)] bg-white p-5 hover:border-[color:var(--color-brand-500)] transition-colors"
          >
            <div className="grid size-11 place-items-center rounded-full bg-[color:var(--color-ink-900)] text-[color:var(--color-ink-50)]">
              <Mail className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Email</p>
              <p className="text-[15px] font-medium text-[color:var(--color-ink-900)]">{SITE.email}</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-ink-200)] bg-white p-5">
            <div className="grid size-11 place-items-center rounded-full bg-[color:var(--color-ink-100)] text-[color:var(--color-ink-800)]">
              <MapPin className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[color:var(--color-ink-500)]">Office</p>
              <p className="text-[15px] text-[color:var(--color-ink-900)]">
                {SITE.address.street}, {SITE.address.city}<br />
                {SITE.address.region} {SITE.address.postalCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--color-ink-200)] bg-white p-6 md:p-8">
        <h2 className="display text-[28px] text-[color:var(--color-ink-900)]">Send an enquiry</h2>
        <p className="mt-1 text-[13.5px] text-[color:var(--color-ink-600)]">
          We reply within a few hours during working hours.
        </p>
        <div className="mt-6">
          <EnquiryForm source="contact_page" />
        </div>
      </div>
    </section>
  );
}
