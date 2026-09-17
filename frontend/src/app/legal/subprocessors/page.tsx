import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Subprocessors | Bavio", description: "Draft Bavio Subprocessors list." };
export default function Page() { return <LegalDocument document={documentFor("subprocessors")} />; }
