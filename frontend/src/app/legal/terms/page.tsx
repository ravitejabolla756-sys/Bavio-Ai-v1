import type { Metadata } from "next";
import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata: Metadata = { title: "Terms of Service | Bavio", description: "Draft Terms of Service for Bavio voice, AI, and automation services." };
export default function TermsPage() { return <LegalDocument document={documentFor("terms")} />; }
