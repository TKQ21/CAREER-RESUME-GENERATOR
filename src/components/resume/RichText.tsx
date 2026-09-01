import { Fragment } from "react";

/**
 * Renders resume text with light inline formatting:
 *  - **word** or *word*  -> bold
 *  - [Label](https://url) -> clickable link that looks like plain text
 *  - a bare https://... url -> clickable, plain looking
 */
const TOKEN =
  /(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))|((?:https?:\/\/|www\.)[^\s,;)]+)/g;

function normalizeHref(raw: string) {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function PlainLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={normalizeHref(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-inherit no-underline hover:no-underline"
      style={{ color: "inherit", textDecoration: "none" }}
    >
      {children}
    </a>
  );
}

export function RichText({ text }: { text?: string }) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [raw] = m;
    if (m[1]) {
      parts.push(<strong key={m.index} className="font-bold">{raw.slice(2, -2)}</strong>);
    } else if (m[2]) {
      parts.push(<strong key={m.index} className="font-bold">{raw.slice(1, -1)}</strong>);
    } else if (m[3]) {
      const close = raw.indexOf("](");
      const label = raw.slice(1, close);
      const href = raw.slice(close + 2, -1);
      parts.push(
        <PlainLink key={m.index} href={href}>
          {label}
        </PlainLink>,
      );
    } else {
      parts.push(
        <PlainLink key={m.index} href={raw}>
          {raw}
        </PlainLink>,
      );
    }
    last = m.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <Fragment>{parts}</Fragment>;
}

export default RichText;
