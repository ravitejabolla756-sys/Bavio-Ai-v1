import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Telecommunications Terms | Bavio", description: "Draft Telecommunications Terms for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("telecommunications")} />; }
