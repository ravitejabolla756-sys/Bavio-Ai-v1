import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Security Overview | Bavio", description: "Implementation-grounded security overview for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("security")} />; }
