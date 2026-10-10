import { siteConfig } from "../config";
import { formatPrice } from "../format";

// Emails use inline styles and tables because email clients ignore most CSS.
// Everything a customer typed is escaped before it goes into the HTML.

export type EmailOrder = {
  id: string;
  number: number;
  name: string;
  email: string;
  address: { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };
  subtotal: number;
  shippingFee: number;
  total: number;
  items: { name: string; price: number; quantity: number }[];
};

export type Email = { subject: string; html: string; text: string };

const GOLD = "#C9A84C";
const GOLD_TEXT = "#766023";
const INK = "#1A1208";
const CREAM = "#FDFAF4";
const PARCHMENT = "#EDE0C4";

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const addressLines = (a: EmailOrder["address"]): string[] =>
  [a.line1 ?? "", a.line2 ?? "", [a.city, a.state].filter(Boolean).join(", ") + (a.postalCode ? ` ${a.postalCode}` : "")].filter((l) => l.trim());

function layout(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding-bottom:24px;text-align:center;font-size:28px;letter-spacing:1px;color:${INK};">${escapeHtml(siteConfig.name)}</td></tr>
<tr><td style="background:#ffffff;border-top:3px solid ${GOLD};padding:32px 28px;">${body}</td></tr>
<tr><td style="padding-top:20px;text-align:center;font-size:13px;color:${GOLD_TEXT};font-style:italic;">${escapeHtml(siteConfig.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${PARCHMENT};font-size:16px;">${escapeHtml(i.name)} &times; ${i.quantity}</td>
<td style="padding:8px 0;border-bottom:1px solid ${PARCHMENT};font-size:16px;text-align:right;">${formatPrice(i.price * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;font-size:16px;${bold ? "font-weight:bold;" : ""}">${label}</td><td style="padding:4px 0;font-size:16px;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td colspan="2" style="height:8px;"></td></tr>
${line("Subtotal", formatPrice(order.subtotal))}${line("Shipping", formatPrice(order.shippingFee))}${line("Total", formatPrice(order.total), true)}</table>`;
}

function itemsText(order: EmailOrder) {
  return [
    ...order.items.map((i) => `${i.name} x ${i.quantity}  ${formatPrice(i.price * i.quantity)}`),
    "",
    `Subtotal  ${formatPrice(order.subtotal)}`,
    `Shipping  ${formatPrice(order.shippingFee)}`,
    `Total     ${formatPrice(order.total)}`,
  ].join("\n");
}

export function customerConfirmation(order: EmailOrder, siteUrl: string): Email {
  const firstName = order.name.split(" ")[0] || "there";
  const address = addressLines(order.address);
  const subject = `Your ${siteConfig.name} order #${order.number} is confirmed`;
  const html = layout(
    subject,
    `<p style="margin:0 0 8px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_TEXT};">Order #${order.number}</p>
<h1 style="margin:0 0 16px;font-size:26px;color:${GOLD_TEXT};">Thank you, ${escapeHtml(firstName)}</h1>
<p style="margin:0 0 24px;font-size:17px;line-height:1.6;">Your payment has been received and your order is confirmed. We will be in touch by email about delivery.</p>
${itemsTable(order)}
<p style="margin:24px 0 4px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_TEXT};">Delivering to</p>
<p style="margin:0;font-size:16px;line-height:1.5;">${[order.name, ...address].map(escapeHtml).join("<br>")}</p>
${siteUrl ? `<p style="margin:28px 0 0;"><a href="${escapeHtml(siteUrl)}/shop" style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;padding:12px 28px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Continue shopping</a></p>` : ""}
<p style="margin:28px 0 0;font-size:15px;line-height:1.6;">Questions about your order? Just reply to this email.</p>`,
  );
  const text = [
    `Thank you, ${firstName}.`,
    "",
    `Your ${siteConfig.name} order #${order.number} is confirmed. We will be in touch by email about delivery.`,
    "",
    itemsText(order),
    "",
    "Delivering to:",
    order.name,
    ...address,
    "",
    "Questions about your order? Just reply to this email.",
  ].join("\n");
  return { subject, html, text };
}

export function newOrderAlert(order: EmailOrder, siteUrl: string): Email {
  const address = addressLines(order.address);
  const subject = `New order #${order.number}: ${formatPrice(order.total)}`;
  const adminLink = siteUrl ? `${siteUrl}/admin/orders/${order.id}` : "";
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;color:${GOLD_TEXT};">New paid order #${order.number}</h1>
${itemsTable(order)}
<p style="margin:24px 0 4px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_TEXT};">Customer</p>
<p style="margin:0;font-size:16px;line-height:1.5;">${escapeHtml(order.name)}<br><a href="mailto:${escapeHtml(order.email)}" style="color:${GOLD_TEXT};">${escapeHtml(order.email)}</a></p>
<p style="margin:16px 0 4px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${GOLD_TEXT};">Ship to</p>
<p style="margin:0;font-size:16px;line-height:1.5;">${address.map(escapeHtml).join("<br>")}</p>
${adminLink ? `<p style="margin:28px 0 0;"><a href="${escapeHtml(adminLink)}" style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;padding:12px 28px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Open in admin</a></p>` : ""}`,
  );
  const text = [
    `New paid order #${order.number}`,
    "",
    itemsText(order),
    "",
    `Customer: ${order.name} <${order.email}>`,
    `Ship to: ${address.join(", ")}`,
    adminLink ? `\nOpen in admin: ${adminLink}` : "",
  ].join("\n");
  return { subject, html, text };
}

export function contactAlert(msg: { name: string; email: string; message: string }): Email {
  const subject = `New message from ${msg.name}`;
  const html = layout(
    subject,
    `<h1 style="margin:0 0 16px;font-size:24px;color:${GOLD_TEXT};">New contact message</h1>
<p style="margin:0 0 4px;font-size:16px;">${escapeHtml(msg.name)} &middot; <a href="mailto:${escapeHtml(msg.email)}" style="color:${GOLD_TEXT};">${escapeHtml(msg.email)}</a></p>
<p style="margin:16px 0 0;font-size:17px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(msg.message)}</p>
<p style="margin:24px 0 0;font-size:14px;color:${GOLD_TEXT};">Reply to this email to answer ${escapeHtml(msg.name.split(" ")[0])} directly.</p>`,
  );
  return { subject, html, text: `${msg.name} <${msg.email}> wrote:\n\n${msg.message}` };
}
