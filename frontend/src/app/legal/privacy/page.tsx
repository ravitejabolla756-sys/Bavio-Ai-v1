import type { Metadata } from "next";
import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata: Metadata = { title: "Privacy Policy | Bavio", description: "Draft Privacy Policy for Bavio account, caller, conversation, and AI data." };
export default function PrivacyPage() { return <LegalDocument document={documentFor("privacy")} />; }
