import type { Metadata } from "next";
import { LegalIndex } from "@/components/legal/LegalDocument";
export const metadata: Metadata = { title: "Legal | Bavio", description: "Bavio legal, privacy, voice, AI, commercial, and developer policies." };
export default function LegalPage() { return <LegalIndex />; }
