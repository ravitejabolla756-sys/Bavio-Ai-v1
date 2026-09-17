import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Acceptable Use Policy | Bavio", description: "Draft Acceptable Use Policy for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("acceptable-use")} />; }
