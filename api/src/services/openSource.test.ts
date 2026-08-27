import { describe, expect, it } from "vitest";
import { htmlToText, parsePublicHttpUrl, appendOpenSource } from "./openSource.js";

describe("openSource", () => {
  it("accepts public https URLs", () => {
    expect(parsePublicHttpUrl("https://en.wikipedia.org/wiki/Quebec")?.host).toBe(
      "en.wikipedia.org",
    );
  });

  it("rejects private and non-http URLs", () => {
    expect(parsePublicHttpUrl("http://localhost/secret")).toBeNull();
    expect(parsePublicHttpUrl("http://127.0.0.1/")).toBeNull();
    expect(parsePublicHttpUrl("http://192.168.1.9/")).toBeNull();
    expect(parsePublicHttpUrl("ftp://example.com/a")).toBeNull();
    expect(parsePublicHttpUrl("not a url")).toBeNull();
  });

  it("strips html to readable text", () => {
    const text = htmlToText(
      "<html><head><style>p{}</style></head><body><h1>Hello</h1><p>World & friends</p></body></html>",
    );
    expect(text).toBe("Hello World & friends");
  });

  it("appends source block to the user prompt", () => {
    const out = appendOpenSource("Titre: x", "Un article public", "fr");
    expect(out).toContain("SOURCE OUVERTE");
    expect(out).toContain("Un article public");
    expect(out.startsWith("Titre: x")).toBe(true);
  });
});
