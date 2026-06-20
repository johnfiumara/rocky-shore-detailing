import { Mail, Phone } from "lucide-react";

const PHONE = "(207) 555-0100";
const EMAIL = "hello@rockycoastdetailing.net";
const INSTAGRAM = "@rockycoast";
const HOURS = {
  weekday: "Mon – Fri · 8a – 6p",
  saturday: "Saturday · 9a – 4p",
  sunday: "Sunday · by appointment",
};
const TAGLINE =
  "Mobile auto detailing by Aiden Quinn. From Kittery to Madawaska — we bring the studio to your driveway.";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative border-t border-line">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-display text-bone text-3xl md:text-4xl max-w-md leading-tight">
              {TAGLINE}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href={`tel:${PHONE.replace(/\D/g, "")}`} className="btn-ghost text-sm flex items-center gap-2">
                <Phone size={14} />
                {PHONE}
              </a>
              <a href={`mailto:${EMAIL}`} className="btn-ghost text-sm flex items-center gap-2">
                <Mail size={14} />
                {EMAIL}
              </a>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9 space-y-8">
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bone-dim mb-3">
                Hours
              </p>
              <ul className="space-y-1 text-sm text-bone">
                <li>{HOURS.weekday}</li>
                <li>{HOURS.saturday}</li>
                <li>{HOURS.sunday}</li>
              </ul>
            </div>
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bone-dim mb-3">
                Social
              </p>
              <a
                href={`https://instagram.com/${INSTAGRAM.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-bone hover:text-bronze transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                {INSTAGRAM}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-line flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-bone-dim text-xs">
            &copy; {year} Rocky Coast Detailing. All rights reserved.
          </p>
          <p className="text-bone-dim text-xs">
            Maine · Mobile detailing statewide
          </p>
        </div>
      </div>
    </footer>
  );
}
