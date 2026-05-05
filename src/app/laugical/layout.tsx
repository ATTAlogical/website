import type { Metadata } from "next";
import { LaugicalCartProvider } from "@/context/LaugicalCart";

export const metadata: Metadata = {
  title: "laugical store",
  description: "Designed objects, one-of-one reworks, and curated items.",
};

export default function LaugicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LaugicalCartProvider>{children}</LaugicalCartProvider>;
}
