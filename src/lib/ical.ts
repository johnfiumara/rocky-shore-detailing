// Minimal RFC 5545 generator — only what we need for booking feeds.

type IcsEvent = {
  uid: string;
  date: Date;
  summary: string;
  description?: string;
  location?: string;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function dateOnly(d: Date): string {
  // VALUE=DATE wants YYYYMMDD in the booking's local day. The Booking model
  // stores @db.Date so JS gets midnight UTC — using UTC parts is correct.
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function addDay(d: Date): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function buildIcs(events: IcsEvent[]): string {
  const now = utcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rocky Coast Detailing//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateOnly(ev.date)}`,
      `DTEND;VALUE=DATE:${dateOnly(addDay(ev.date))}`,
      `SUMMARY:${escapeText(ev.summary)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
