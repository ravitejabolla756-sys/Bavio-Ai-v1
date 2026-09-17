import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Call Recording and Consent | Bavio", description: "Draft call recording and consent guidance for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("call-recording")} />; }
