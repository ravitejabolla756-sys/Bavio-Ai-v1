import Link from "next/link";
import { legalDocuments, legalIndexGroups, type LegalDocument as LegalDocumentType } from "@/content/legalContent";

const crossLinks = [
  ["Privacy", "/legal/privacy"], ["Acceptable use", "/legal/acceptable-use"], ["Billing", "/legal/billing"], ["Recording", "/legal/call-recording"], ["Telecommunications", "/legal/telecommunications"],
] as const;

export function LegalIndex() {
  return <div className="legal-shell">
    <header className="legal-hero"><p className="legal-kicker">Bavio legal library</p><h1>Clear terms for a<br /><em>clearer service.</em></h1><p className="legal-lede">Review-ready policies for the people and businesses who use Bavio voice, AI, automation, and developer features.</p><p className="legal-review-note">Every document is a draft for founder and legal review. No policy is lawyer-approved by this page.</p></header>
    <div className="legal-index-grid">{legalIndexGroups.map((group) => <section key={group.title} className="legal-index-group"><p className="legal-kicker">{group.title}</p>{group.items.map(([slug, label]) => <Link key={slug} href={`/legal/${slug}`} className="legal-index-link"><span>{label}</span><span aria-hidden="true">↗</span></Link>)}</section>)}</div>
    <div className="legal-index-footer"><Link href="/security">Security overview</Link><Link href="/trust">Trust center</Link><Link href="/">Back to Bavio</Link></div>
  </div>;
}

export default function LegalDocument({ document }: { document: LegalDocumentType }) {
  return <div className="legal-shell">
    <header className="legal-hero legal-hero-document"><Link href="/legal" className="legal-back">← All legal documents</Link><p className="legal-kicker">{document.eyebrow}</p><h1>{document.title}</h1><p className="legal-lede">{document.description}</p><p className="legal-meta">Draft status · Last updated: {document.updated}</p></header>
    <div className="legal-document-grid">
      <aside className="legal-toc" aria-label="On this page"><p className="legal-kicker">On this page</p>{document.sections.map((item) => <a key={item.id} href={`#${item.id}`}>{item.title.replace(/^\d+\.\s*/, "")}</a>)}</aside>
      <article className="legal-article">{document.sections.map((item) => <section id={item.id} key={item.id} className="legal-section"><h2>{item.title}</h2>{item.paragraphs?.map((p) => <p key={p}>{p}</p>)}{item.bullets?.length ? <ul>{item.bullets.map((b) => <li key={b}>{b}</li>)}</ul> : null}{item.callout ? <div className="legal-callout"><strong>{item.callout.label}</strong><span>{item.callout.text}</span></div> : null}</section>)}<nav className="legal-cross-links" aria-label="Related policies"><p className="legal-kicker">Related policies</p>{crossLinks.map(([label, href]) => <Link key={href} href={href}>{label} ↗</Link>)}</nav></article>
    </div>
  </div>;
}

export function documentFor(slug: string): LegalDocumentType {
  const document = legalDocuments[slug];
  if (!document) throw new Error(`Unknown legal document: ${slug}`);
  return document;
}
