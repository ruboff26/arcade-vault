import Link from "next/link";

export default function NotFound() {
  return (
    <section
      className="av-hero fade-in"
      style={{ paddingTop: 96, paddingBottom: 96 }}
    >
      <div
        className="pixel neon-magenta flicker"
        style={{ fontSize: "clamp(40px, 10vw, 96px)" }}
      >
        404
      </div>
      <div className="sub" style={{ marginTop: 24 }}>
        GAME OVER <span className="blink">_</span>
      </div>
      <p style={{ color: "var(--ink-dim)", margin: "20px 0 32px" }}>
        Esta página no existe en el vault.
      </p>
      <Link href="/" className="btn lg">
        VOLVER AL VAULT
      </Link>
    </section>
  );
}
