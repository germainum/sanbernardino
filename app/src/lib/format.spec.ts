import { describe, expect, it } from "vitest";
import { formatUpdatedLabel } from "./format";
import { fr } from "../i18n/fr";
import { en } from "../i18n/en";
import { de } from "../i18n/de";
import { it as itLang } from "../i18n/it";

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe("formatUpdatedLabel", () => {
  it("says 'just now' under a minute, in every language", () => {
    const iso = isoMinutesAgo(0);
    expect(formatUpdatedLabel(iso, fr)).toBe("Mis à jour à l'instant");
    expect(formatUpdatedLabel(iso, en)).toBe("Updated just now");
    expect(formatUpdatedLabel(iso, de)).toBe("Gerade aktualisiert");
    expect(formatUpdatedLabel(iso, itLang)).toBe("Aggiornato proprio ora");
  });

  it("special-cases exactly one minute", () => {
    const iso = isoMinutesAgo(1);
    expect(formatUpdatedLabel(iso, fr)).toBe("Mis à jour il y a 1 min");
    expect(formatUpdatedLabel(iso, en)).toBe("Updated 1 min ago");
  });

  it("interpolates minutes under an hour", () => {
    const iso = isoMinutesAgo(12);
    expect(formatUpdatedLabel(iso, fr)).toBe("Mis à jour il y a 12 min");
    expect(formatUpdatedLabel(iso, en)).toBe("Updated 12 min ago");
    expect(formatUpdatedLabel(iso, de)).toBe("Vor 12 Min aktualisiert");
    expect(formatUpdatedLabel(iso, itLang)).toBe("Aggiornato 12 min fa");
  });

  it("switches to hours at 60 minutes", () => {
    const iso = isoMinutesAgo(125);
    expect(formatUpdatedLabel(iso, fr)).toBe("Mis à jour il y a 2 h");
    expect(formatUpdatedLabel(iso, en)).toBe("Updated 2 h ago");
  });
});
