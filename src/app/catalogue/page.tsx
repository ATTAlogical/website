"use client";

import { type ProjectEntry, PROJECTS_DATA } from "@/data/projects";
import Link from "next/link";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";

const ProjectSection = memo(function ProjectSection({
  project,
  onBecomeActive,
  isFirst,
}: {
  project: ProjectEntry;
  onBecomeActive: (slug: string) => void;
  isFirst: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [dragLeft, setDragLeft] = useState(0);
  const dragX = useMotionValue(0);

  const { scrollYProgress: entranceP } = useScroll({
    target: sectionRef,
    offset: ["start 0.92", "start 0.38"],
  });
  const headerY = useTransform(entranceP, [0, 1], [38, 0]);
  const headerOpacity = useTransform(entranceP, [0, 0.6], [0, 1]);

  const { scrollYProgress: centerP } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });
  useMotionValueEvent(centerP, "change", (v) => {
    if (v >= 0 && v <= 1) onBecomeActive(project.slug);
  });

  useEffect(() => {
    const measure = () => {
      if (!rowRef.current || !innerRef.current) return;
      setDragLeft(
        Math.min(0, -(innerRef.current.offsetWidth - rowRef.current.clientWidth))
      );
    };
    const t = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, []);

  const allImages = [
    ...(project.image ? [project.image] : []),
    ...(project.images ?? []),
  ];
  const hasImages = allImages.length > 0;

  return (
    <section
      ref={sectionRef}
      id={project.slug}
      style={{ paddingTop: "14vh", paddingBottom: "10vh" }}
    >
      <motion.div
        style={{ paddingLeft: "8vw", marginBottom: "2.5rem", y: headerY, opacity: headerOpacity }}
      >
        <p style={{ fontSize: "0.57rem", letterSpacing: "0.16em", color: "rgba(0,0,0,0.3)", textTransform: "uppercase", marginBottom: "0.5rem", fontFamily: '"Playfair Display", serif' }}>
          {project.subtitle}
        </p>
        <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 400, color: "#000", letterSpacing: "0.02em", lineHeight: 1.1, fontFamily: '"Playfair Display", serif' }}>
          {project.title}
        </h2>
      </motion.div>

      <div ref={rowRef} style={{ overflow: "hidden", paddingTop: "40px", marginTop: "-40px", paddingBottom: "40px", marginBottom: "-40px" }}>
        <motion.div
          ref={innerRef}
          drag={dragLeft < 0 ? "x" : false}
          dragConstraints={{ left: dragLeft, right: 0 }}
          dragElastic={0.05}
          dragMomentum
          style={{
            x: dragX,
            display: "inline-flex",
            gap: "5rem",
            paddingLeft: "8vw",
            paddingRight: "8vw",
            cursor: dragLeft < 0 ? "grab" : "default",
            userSelect: "none",
            minWidth: "100%",
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          {hasImages
            ? allImages.map((src, i) => (
                <div
                  key={i}
                  className="glass-image-frame"
                  style={{
                    flexShrink: 0,
                    width: "clamp(340px, 52vw, 820px)",
                    height: "64vh",
                    borderRadius: "20px",
                    background: "#e0e0e2",
                  }}
                >
                  <img
                    src={src}
                    alt={`${project.title} — ${i === 0 ? "cover" : i}`}
                    loading={isFirst && i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    draggable={false}
                  />
                </div>
              ))
            : (
              <div
                className="glass-image-frame"
                style={{
                  flexShrink: 0,
                  width: "clamp(340px, 52vw, 820px)",
                  height: "64vh",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #f0f0f0, #e6e6e8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(0,0,0,0.14)", textTransform: "uppercase", fontFamily: '"Playfair Display", serif' }}>
                  coming soon
                </span>
              </div>
            )}
        </motion.div>

        {/* Glass surface edge */}
        <div
          style={{
            marginTop: "18px",
            height: "1.5px",
            background: "linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.85) 15%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.85) 85%, transparent 96%)",
            pointerEvents: "none",
          }}
        />

        {/* Floor reflection */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            height: "22vh",
            marginTop: "1px",
            pointerEvents: "none",
            willChange: "transform",
            WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.38) 30%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.38) 30%, transparent 100%)",
          }}
        >
          <motion.div
            style={{
              x: dragX,
              scaleY: -1,
              display: "inline-flex",
              gap: "5rem",
              paddingLeft: "8vw",
              paddingRight: "8vw",
              minWidth: "100%",
              willChange: "transform",
            }}
          >
            {hasImages
              ? allImages.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      flexShrink: 0,
                      width: "clamp(340px, 52vw, 820px)",
                      height: "64vh",
                      borderRadius: "20px",
                      overflow: "hidden",
                      background: "#e0e0e2",
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      draggable={false}
                    />
                  </div>
                ))
              : (
                <div
                  style={{
                    flexShrink: 0,
                    width: "clamp(340px, 52vw, 820px)",
                    height: "64vh",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, #f0f0f0, #e6e6e8)",
                  }}
                />
              )}
          </motion.div>

        </div>
      </div>
    </section>
  );
});

export default function Catalogue() {
  const [activeSlug, setActiveSlug] = useState(PROJECTS_DATA[0].slug);
  const active = PROJECTS_DATA.find(p => p.slug === activeSlug) ?? PROJECTS_DATA[0];

  // Stable reference — memo on ProjectSection is not defeated when activeSlug changes
  const handleBecomeActive = useCallback((slug: string) => setActiveSlug(slug), []);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";

    const id = window.location.hash.slice(1);
    if (id) {
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      });
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        fontFamily: '"Playfair Display", serif',
        paddingBottom: "160px",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(247,247,247,0.88)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          padding: "1.2rem 8vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          className="catalogue-back-link"
          style={{ fontSize: "0.62rem", letterSpacing: "0.14em", textDecoration: "none", textTransform: "uppercase" }}
        >
          ← ATTA logical
        </Link>
        <span style={{ fontSize: "0.62rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.25)", textTransform: "uppercase" }}>
          catalogue
        </span>
      </div>

      {PROJECTS_DATA.map((project, i) => (
        <ProjectSection
          key={project.slug}
          project={project}
          onBecomeActive={handleBecomeActive}
          isFirst={i === 0}
        />
      ))}

      {/* Fixed bottom info panel */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(247,247,247,0.92)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          padding: "1.5rem 8vw 2rem",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "3rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ fontSize: "0.56rem", letterSpacing: "0.15em", color: "rgba(0,0,0,0.28)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                {active.subtitle}
              </p>
              <h3
                style={{
                  fontSize: "clamp(1.1rem, 2vw, 1.55rem)",
                  fontWeight: 400,
                  color: "#000",
                  letterSpacing: "0.02em",
                  lineHeight: 1.15,
                  marginBottom: active.href ? "0.6rem" : 0,
                }}
              >
                {active.title}
              </h3>
              {active.href && (
                <a
                  href={active.href}
                  target="_blank"
                  rel="noreferrer"
                  className="catalogue-visit-link"
                  style={{
                    fontSize: "0.6rem",
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.15)",
                    paddingBottom: "0.1em",
                  }}
                >
                  {active.href.replace(/^https?:\/\//, "")} →
                </a>
              )}
            </div>

            <div style={{ maxWidth: "420px", textAlign: "right" }}>
              <p style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.42)", lineHeight: 1.75, marginBottom: "0.75rem", letterSpacing: "0.01em" }}>
                {active.description}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", justifyContent: "flex-end" }}>
                {active.tags.slice(0, 5).map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.52rem",
                      letterSpacing: "0.07em",
                      padding: "0.18rem 0.48rem",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "20px",
                      color: "rgba(0,0,0,0.35)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
