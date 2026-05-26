import { Resend } from "resend";
import {
  type BookingInput,
  TIME_WINDOW_LABELS,
} from "@/lib/booking-schema";

type SendInput = {
  data: BookingInput;
  files: File[];
};

const SERVICE_LABELS: Record<BookingInput["service"], string> = {
  "express-wash": "Express Wash",
  "full-detail": "Full Detail",
  "paint-correction": "Paint Correction",
  "ceramic-coating": "Ceramic Coating",
  "interior-restoration": "Interior Restoration",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 16px 8px 0;color:#8a8578;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;vertical-align:top;width:160px;">${label}</td>
    <td style="padding:8px 0;color:#f4efe6;font-size:15px;">${escapeHtml(value)}</td>
  </tr>`;
}

function buildHtml(d: BookingInput, fileCount: number): string {
  const dateLabel = new Date(d.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 28px;color:#f4efe6;">
    <p style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a36b;margin:0 0 8px;">Rocky Shore Detailing</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.1;margin:0 0 24px;">New booking request</h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(244,239,230,0.12);border-bottom:1px solid rgba(244,239,230,0.12);">
      ${row("Service", SERVICE_LABELS[d.service])}
      ${row("Date", dateLabel)}
      ${row("Time window", TIME_WINDOW_LABELS[d.timeWindow])}
      ${row("Vehicle", `${d.year} ${d.make} ${d.model} (${d.color})`)}
      ${row("Address", `${d.address}, ${d.city}, ME ${d.zip}`)}
      ${row("Customer", `${d.name}`)}
      ${row("Email", d.email)}
      ${row("Phone", d.phone)}
      ${d.notes ? row("Notes", d.notes) : ""}
      ${row("Photos", fileCount ? `${fileCount} attached` : "none")}
    </table>
    <p style="font-size:12px;color:#8a8578;margin-top:24px;">Reply directly to this email to respond to ${escapeHtml(d.name)}.</p>
  </div>
</body></html>`;
}

export async function sendBookingEmail({ data, files }: SendInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const to = process.env.BOOKING_TO_EMAIL ?? "fumarajohn8@gmail.com";
  const from = process.env.BOOKING_FROM_EMAIL ?? "Rocky Shore Bookings <onboarding@resend.dev>";

  const resend = new Resend(apiKey);
  const attachments = await Promise.all(
    files.map(async (f) => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
    })),
  );

  const subject = `New booking — ${SERVICE_LABELS[data.service]} · ${data.name} · ${data.date}`;

  const result = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject,
    html: buildHtml(data, files.length),
    attachments,
  });

  if (result.error) {
    throw new Error(`Resend failed: ${result.error.message}`);
  }
}
