import { PROJECTS_DATA } from "@/data/projects";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return PROJECTS_DATA.map(p => ({ slug: p.slug }));
}

export default async function ProjectCatalogue({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS_DATA.find(p => p.slug === slug);
  if (!project) notFound();

  const hasImages = project.images && project.images.length > 0;

  return (
    <main style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: '"Playfair Display", serif', overflowX: "hidden" }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "rgba(248,248,248,0.85)", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "1.2rem 8vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="catalogue-back-link" style={{ fontSize: "0.62rem", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" }}>
          ← ATTA logical
        </Link>
        <span style={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.25)", textTransform: "uppercase" }}>
          catalogue
        </span>
      </div>

      {/* Header */}
      <div style={{ padding: "6vw 8vw 4vw" }}>
        <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(0,0,0,0.3)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          {project.subtitle}
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, color: "#000", letterSpacing: "0.02em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
          {project.title}
        </h1>
        <p style={{ maxWidth: "560px", fontSize: "clamp(0.85rem, 1.2vw, 1rem)", color: "rgba(0,0,0,0.5)", lineHeight: 1.9, letterSpacing: "0.01em" }}>
          {project.longDescription ?? project.description}
        </p>

        {/* Tags + external link */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginTop: "2rem" }}>
          {project.tags.map(tag => (
            <span key={tag} style={{ fontSize: "0.56rem", letterSpacing: "0.08em", padding: "0.22rem 0.6rem", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "20px", color: "rgba(0,0,0,0.38)" }}>
              {tag}
            </span>
          ))}
          {project.href && (
            <a href={project.href} target="_blank" rel="noreferrer" className="catalogue-visit-link"
              style={{ marginLeft: "0.5rem", fontSize: "0.62rem", letterSpacing: "0.1em", textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.15)", paddingBottom: "0.1em" }}
            >
              visit site →
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "0 8vw", borderTop: "1px solid rgba(0,0,0,0.06)" }} />

      {/* Image gallery */}
      <div style={{ padding: "4vw 8vw 8vw" }}>
        {hasImages ? (
          <div style={{ columns: "2 320px", gap: "1.25rem" }}>
            {project.images!.map((src, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#ececec" }}>
                <img
                  src={src}
                  alt={`${project.title} — ${i + 1}`}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Placeholder grid — ready for images */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #f0f0f0, #e8e8e8)", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "0.52rem", letterSpacing: "0.15em", color: "rgba(0,0,0,0.15)", textTransform: "uppercase" }}>
                  image {n}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlights at the bottom */}
      {project.highlights && (
        <div style={{ padding: "0 8vw 8vw", borderTop: "1px solid rgba(0,0,0,0.06)", margin: "0 0 0 0", paddingTop: "4vw" }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.28)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            highlights
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.85rem 3rem" }}>
            {project.highlights.map((h, i) => (
              <li key={i} style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.5)", lineHeight: 1.75, paddingLeft: "1.2em", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, color: "rgba(0,0,0,0.2)" }}>—</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
