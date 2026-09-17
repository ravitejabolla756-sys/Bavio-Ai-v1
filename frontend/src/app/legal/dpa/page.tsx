import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Data Processing Addendum | Bavio", description: "Draft Data Processing Addendum for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("dpa")} />; }
