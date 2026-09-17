import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "AI and Automated Systems | Bavio", description: "Draft AI and Automated Systems Disclosure for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("ai")} />; }
