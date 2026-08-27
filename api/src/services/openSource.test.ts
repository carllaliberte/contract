import { describe, expect, it } from "vitest";
import {
  htmlToText,
  parsePublicHttpUrl,
  appendOpenSource,
  youtubeOEmbedEndpoint,
  wikipediaSummaryEndpoint,
  isYouTubeHost,
} from "./openSource.js";

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

  it("maps YouTube URLs to the oEmbed endpoint", () => {
    expect(isYouTubeHost("www.youtube.com")).toBe(true);
    expect(isYouTubeHost("youtu.be")).toBe(true);
    const watch = parsePublicHttpUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(watch).not.toBeNull();
    const endpoint = youtubeOEmbedEndpoint(watch!);
    expect(endpoint?.host).toBe("www.youtube.com");
    expect(endpoint?.pathname).toBe("/oembed");
    expect(endpoint?.searchParams.get("format")).toBe("json");
    expect(endpoint?.searchParams.get("url")).toContain("dQw4w9WgXcQ");
  });

  it("maps Wikipedia article URLs to the REST summary", () => {
    const wiki = parsePublicHttpUrl("https://fr.wikipedia.org/wiki/Qu%C3%A9bec");
    expect(wiki).not.toBeNull();
    const endpoint = wikipediaSummaryEndpoint(wiki!);
    expect(endpoint?.host).toBe("fr.wikipedia.org");
    expect(endpoint?.pathname).toBe("/api/rest_v1/page/summary/Qu%C3%A9bec");
  });

  it("ignores non-article Wikipedia paths", () => {
    const search = parsePublicHttpUrl(
      "https://en.wikipedia.org/wiki/Special:Search",
    );
    expect(wikipediaSummaryEndpoint(search!)).toBeNull();
    expect(
      wikipediaSummaryEndpoint(parsePublicHttpUrl("https://example.com/wiki/X")!),
    ).toBeNull();
  });
});
