import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata = { title: "Billing and Subscription Terms | Bavio", description: "Draft Billing and Subscription Terms for Bavio." };
export default function Page() { return <LegalDocument document={documentFor("billing")} />; }
