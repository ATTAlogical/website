import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "about — ATTA logical",
  description:
    "Boelie van Camp. Software, design, music. ATTA logical, Laugical, ATTA.CKORE, Petallaugical.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
