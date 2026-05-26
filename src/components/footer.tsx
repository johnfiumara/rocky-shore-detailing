import { Mail, Phone, AtSign } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="eyebrow">Rocky Shore Detailing</p>
            <h2 className="headline mt-4 text-5xl md:text-7xl">
              Hand-detailed,<br />
              <em>statewide.</em>
            </h2>
            <p className="mt-6 max-w-md text-bone-dim leading-relaxed">
              Mobile auto detailing by Aiden Quinn. From Kittery to Madawaska — we bring the studio to your driveway.
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 gap-10">
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-mist mb-4">Contact</p>
              <ul className="space-y-3 text-bone">
                <li className="flex items-center gap-3">
                  <Phone size={14} className="text-bronze" />
                  <a href="tel:+12075550100" className="hover:text-bronze-glow transition-colors">(207) 555-0100</a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={14} className="text-bronze" />
                  <a href="mailto:hello@rockyshoredetailing.com" className="hover:text-bronze-glow transition-colors">hello@rockyshoredetailing.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <AtSign size={14} className="text-bronze" />
                  <a href="https://instagram.com" className="hover:text-bronze-glow transition-colors">@rockyshore</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-mist mb-4">Hours</p>
              <ul className="space-y-2 text-bone-dim text-sm">
                <li>Mon – Fri · 8a – 6p</li>
                <li>Saturday · 9a – 4p</li>
                <li>Sunday · by appointment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-line flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-mist text-xs font-mono-accent tracking-wider uppercase">
          <span>© {year} Rocky Shore Detailing · Statewide Maine</span>
          <span>Built with care</span>
        </div>
      </div>
    </footer>
  );
}
