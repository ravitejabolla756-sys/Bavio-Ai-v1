import type { Metadata } from "next";
import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata: Metadata = { title: "Refund and Cancellation Policy | Bavio", description: "Draft refund and cancellation policy for Bavio." };
export default function RefundPage() { return <LegalDocument document={documentFor("refund")} />; }
