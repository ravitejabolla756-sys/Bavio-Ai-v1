import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "API Terms | Bavio", description: "Draft API Terms for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("api-terms")} />; }
