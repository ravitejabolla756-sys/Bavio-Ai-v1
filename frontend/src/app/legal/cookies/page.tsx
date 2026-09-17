import type { Metadata } from "next";
import LegalDocument, { documentFor } from "@/components/legal/LegalDocument";
export const metadata: Metadata = { title: "Cookie Policy | Bavio", description: "Draft Cookie and Browser Storage Policy for Bavio." };
export default function CookiesPage() { return <LegalDocument document={documentFor("cookies")} />; }
