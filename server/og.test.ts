import { describe, expect, it } from "vitest";
import { escapeHtml, injectOgTags, renderOgTags } from "./_core/og";

const META = {
  title: "Sommerferien – ReiseKompass",
  description:
    "Geteilte Packliste mit 12 Einträgen – zum Mitpacken und Abhaken.",
  url: "https://meinreisekompass.ch/liste/abc12345",
  image: "https://meinreisekompass.ch/icons/icon-512.png",
};

describe("escapeHtml", () => {
  it("escapet alle HTML-Sonderzeichen", () => {
    expect(escapeHtml(`<script>alert("x") & 'y'</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;"
    );
  });

  it("lässt harmlose Texte unverändert", () => {
    expect(escapeHtml("Zeltplatz Grimselpass 2026")).toBe(
      "Zeltplatz Grimselpass 2026"
    );
  });
});

describe("renderOgTags", () => {
  it("rendert alle OG- und Twitter-Tags", () => {
    const tags = renderOgTags(META);
    expect(tags).toContain(
      `<meta property="og:title" content="Sommerferien – ReiseKompass" />`
    );
    expect(tags).toContain(`<meta property="og:type" content="website" />`);
    expect(tags).toContain(
      `<meta property="og:url" content="https://meinreisekompass.ch/liste/abc12345" />`
    );
    expect(tags).toContain(
      `<meta property="og:image" content="https://meinreisekompass.ch/icons/icon-512.png" />`
    );
    expect(tags).toContain(`<meta name="twitter:card" content="summary" />`);
  });

  it("escapet Namen mit HTML-Sonderzeichen (XSS)", () => {
    const tags = renderOgTags({
      ...META,
      title: `"><script>alert(1)</script> – ReiseKompass`,
    });
    expect(tags).not.toContain("<script>");
    expect(tags).toContain("&quot;&gt;&lt;script&gt;");
  });
});

describe("injectOgTags", () => {
  const html = `<!doctype html><html><head><title>ReiseKompass</title></head><body><div id="root"></div></body></html>`;

  it("fügt die Tags vor </head> ein", () => {
    const result = injectOgTags(html, META);
    const headEnd = result.indexOf("</head>");
    const ogTitle = result.indexOf(`property="og:title"`);
    expect(ogTitle).toBeGreaterThan(-1);
    expect(ogTitle).toBeLessThan(headEnd);
    // Rest des Dokuments bleibt unverändert
    expect(result).toContain(`<div id="root"></div>`);
    expect(result).toContain("<title>ReiseKompass</title>");
  });

  it("lässt HTML ohne </head> unverändert", () => {
    expect(injectOgTags("<body>kein head</body>", META)).toBe(
      "<body>kein head</body>"
    );
  });
});
