"use client";

import dynamic from "next/dynamic";

// Move the current component to DadafarinAssistantContent.tsx
const DadafarinAssistantContent = dynamic(
  () => import("./DadafarinAssistantContent"),
  { ssr: false }
);

export default function DadafarinAssistant() {
  return <DadafarinAssistantContent />;
}
