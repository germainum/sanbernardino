import { describe, expect, it } from "vitest";
import { parseAstraTrafficSituations } from "../src/providers/astraDatex2.js";

// Fixtures are minimal but structurally faithful to real dx223 DATEX II records pulled live
// from opentransportdata.swiss on 2026-08-10 (see astraDatex2.ts's doc comment) — same tag
// names/nesting, trimmed of fields the parser doesn't read.
function situation(opts: {
  validityStatus?: string;
  causeType?: string;
  lengthAffected?: number;
  timeLossMin?: number;
  overallStartTime?: string;
  periodStart?: string;
  periodEnd?: string;
  de: string;
  fr?: string;
}): string {
  const {
    validityStatus = "active",
    causeType,
    lengthAffected,
    timeLossMin,
    overallStartTime = "2026-08-01T00:00:00.000000Z",
    periodStart,
    periodEnd,
    de,
    fr = de,
  } = opts;
  const deText = timeLossMin != null ? `${de} Zusatz 1: Zeitverlust Anz. [min] ${timeLossMin}` : de;
  return `<dx223:situation xsi:type="dx223:Situation" id="situation.1.1"><dx223:situationRecord xsi:type="dx223:AbnormalTraffic" id="situation.1.1.1">
    <dx223:validityStatus xsi:type="dx223:ValidityStatusEnum">${validityStatus}</dx223:validityStatus>
    <dx223:validityTimeSpecification xsi:type="dx223:OverallPeriod">
      <dx223:overallStartTime xsi:type="dx223:DateTime">${overallStartTime}</dx223:overallStartTime>
      ${periodStart ? `<dx223:validPeriod xsi:type="dx223:Period"><dx223:startOfPeriod xsi:type="dx223:DateTime">${periodStart}</dx223:startOfPeriod><dx223:endOfPeriod xsi:type="dx223:DateTime">${periodEnd}</dx223:endOfPeriod></dx223:validPeriod>` : ""}
    </dx223:validityTimeSpecification>
    ${causeType ? `<dx223:cause xsi:type="dx223:NonManagedCause"><dx223:causeType xsi:type="dx223:CauseTypeEnum">${causeType}</dx223:causeType></dx223:cause>` : ""}
    ${lengthAffected != null ? `<dx223:lengthAffected xsi:type="dx223:MetresAsFloat">${lengthAffected.toFixed(2)}</dx223:lengthAffected>` : ""}
    <dx223:generalPublicComment xsi:type="dx223:Comment"><dx223:comment xsi:type="dx223:MultilingualString"><dx223:values>
      <dx223:value xsi:type="dx223:MultilingualStringValue" lang="de-CH">${deText}</dx223:value>
      <dx223:value xsi:type="dx223:MultilingualStringValue" lang="fr-CH">${fr}</dx223:value>
    </dx223:values></dx223:comment><dx223:commentType xsi:type="dx223:CommentTypeEnum">description</dx223:commentType></dx223:generalPublicComment>
  </dx223:situationRecord></dx223:situation>`;
}

function wrap(...situations: string[]): string {
  return `<?xml version="1.0"?><soap:Envelope><soap:Body><d2LogicalModel><payload><situationPublication>${situations.join("")}</situationPublication></payload></d2LogicalModel></soap:Body></soap:Envelope>`;
}

const NOW = new Date("2026-08-10T12:00:00.000Z");

describe("parseAstraTrafficSituations", () => {
  it("returns go/go/go when nothing currently affects the San Bernardino corridor", () => {
    const xml = wrap(situation({ de: "A13 Bellinzona &lt;-&gt; S. Bernardino zwischen Anschluss Grono und Anschluss Lostallo Sachlage: Verkehrsbehinderung" }));
    // "S. Bernardino" alone (as a direction label, no tunnel/pass-specific junction) must NOT match either route.
    const raw = parseAstraTrafficSituations(xml, NOW);
    expect(raw.tunnel.state).toBe("go");
    expect(raw.col.state).toBe("go");
    expect(raw.gothard.state).toBe("go");
  });

  it("detects a closed San Bernardino tunnel", () => {
    const xml = wrap(situation({ de: "A13 Tunnel San-Bernardino-Tunnel Sachlage: Tunnel gesperrt Baustelle" }));
    const raw = parseAstraTrafficSituations(xml, NOW);
    expect(raw.tunnel.state).toBe("stop");
    expect(raw.tunnel.detail).toBe("Tunnel fermé");
  });

  it("detects a closed Gotthard tunnel without affecting the San Bernardino tunnel", () => {
    const xml = wrap(situation({ de: "A2 Chiasso &lt;-&gt; Gotthard Tunnel Gotthard-Tunnel Sachlage: Tunnel gesperrt Baustelle" }));
    const raw = parseAstraTrafficSituations(xml, NOW);
    expect(raw.gothard.state).toBe("stop");
    expect(raw.tunnel.state).toBe("go");
  });

  it("classifies minor roadworks on the pass as caution, keyed off the Passstrasse junction", () => {
    const xml = wrap(
      situation({ lengthAffected: 500, de: "A13 Bellinzona &lt;-&gt; S. Bernardino zwischen Anschluss Pian San Giacomo und Anschluss Passstrasse Sachlage: Verkehrsbehinderung Baustelle, Länge [km] 0.5" }),
    );
    const raw = parseAstraTrafficSituations(xml, NOW);
    expect(raw.col.state).toBe("caution");
    expect(raw.col.detail).toContain("Chantier");
  });

  it("classifies a severe jam (high time loss) at the tunnel as stop, and a mild one as caution", () => {
    const severe = wrap(
      situation({ causeType: "congestion", lengthAffected: 5000, timeLossMin: 50, de: "A13 Tunnel San-Bernardino-Tunnel Sachlage: Stau Länge [km] 5.0 Ursache: Verkehrsüberlastung" }),
    );
    expect(parseAstraTrafficSituations(severe, NOW).tunnel.state).toBe("stop");

    const mild = wrap(situation({ causeType: "congestion", lengthAffected: 500, timeLossMin: 3, de: "A13 Tunnel San-Bernardino-Tunnel Sachlage: Stau Länge [km] 0.5 Ursache: Verkehrsüberlastung" }));
    expect(parseAstraTrafficSituations(mild, NOW).tunnel.state).toBe("caution");
  });

  it("ignores a bulletin scheduled for a future night that hasn't started yet", () => {
    const xml = wrap(
      situation({
        de: "A13 Tunnel San-Bernardino-Tunnel Sachlage: Tunnel gesperrt Baustelle",
        overallStartTime: "2026-04-27T07:30:00.000000Z",
        periodStart: "2026-08-18T20:00:00.000000Z",
        periodEnd: "2026-08-19T03:00:00.000000Z",
      }),
    );
    expect(parseAstraTrafficSituations(xml, NOW).tunnel.state).toBe("go"); // NOW (Aug 10) is before the Aug 18-19 window
  });

  it("ignores a lifted (Aufgehoben) bulletin even if it mentions a closure keyword", () => {
    const xml = wrap(situation({ validityStatus: "definedByValidityTimeSpec", de: "Aufgehoben: A13 Tunnel San-Bernardino-Tunnel Sachlage: Tunnel gesperrt" }));
    expect(parseAstraTrafficSituations(xml, NOW).tunnel.state).toBe("go");
  });

  it("always marks the pass as seasonal regardless of live status", () => {
    const raw = parseAstraTrafficSituations(wrap(), NOW);
    expect(raw.col.seasonal).toBe(true);
  });
});
