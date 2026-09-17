import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Trust Center | Bavio", description: "Bavio trust and security documentation." };
export default function Page() { return <LegalDocument document={documentFor("privacy")} />; }
