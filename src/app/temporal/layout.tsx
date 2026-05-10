import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "the log — ATTA logical",
  description:
    "Chronological record of the ATTA logical universe. Builds, drops, tracks, milestones, notes.",
};

export default function TemporalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
