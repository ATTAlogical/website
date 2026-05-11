import type { Metadata } from "next";
import { LaugicalCartProvider } from "@/context/LaugicalCart";
import CartDrawer from "./CartDrawer";

export const metadata: Metadata = {
  title: "Laugical store",
  description: "Designed objects, one-of-one reworks, and curated items.",
};

export default function LaugicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LaugicalCartProvider>
      {children}
      <CartDrawer />
    </LaugicalCartProvider>
  );
}
