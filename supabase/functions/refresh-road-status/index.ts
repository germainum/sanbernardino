import { parseAstraTrafficSituations } from "../../../packages/core/dist/providers/astraDatex2.js";
import { serviceClient } from "../_shared/db.ts";

/**
 * Slow-cadence sibling of `poll` (own pg_cron job, ~every 30min — see migration
 * 0004_schedule_road_status_cron.sql): fetches ASTRA/opentransportdata.swiss's national DATEX
 * II Traffic Situations feed (~23MB, no server-side road filter), parses it down to the San
 * Bernardino/Gotthard corridor via parseAstraTrafficSituations(), and upserts the result into
 * road_status_cache. `poll` reads that cache instead of hitting this 23MB feed on its own
 * 3-min cadence — see packages/core/src/providers/http.ts's ViasuisseHttpConfig doc comment
 * for the bandwidth math that motivated this split.
 */

const SOAP_BODY = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <d2LogicalModel xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" modelBaseVersion="2" xmlns="http://datex2.eu/schema/2/2_0">
    <exchange>
        <supplierIdentification>
	    <country>ch</country>
	    <nationalIdentifier>FEDRO</nationalIdentifier>
        </supplierIdentification>
        <subscription>
	    <operatingMode>operatingMode1</operatingMode>
	    <subscriptionStartTime>2025-01-01T00:00:00.00+01:00</subscriptionStartTime>
	    <subscriptionState>active</subscriptionState>
	    <updateMethod>singleElementUpdate</updateMethod>
	    <target>
		<address></address>
		<protocol>http</protocol>
	    </target>
        </subscription>
    </exchange>
    </d2LogicalModel>
  </soap:Body>
</soap:Envelope>`;

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = Deno.env.get("VIASUISSE_API_KEY");
  const apiBase = Deno.env.get("VIASUISSE_API_BASE") ?? "https://api.opentransportdata.swiss/TDP/Soap_Datex2/TrafficSituations/Pull";
  if (!apiKey) return new Response(JSON.stringify({ error: "VIASUISSE_API_KEY not set" }), { status: 500 });

  const res = await fetch(apiBase, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      Authorization: `Bearer ${apiKey}`,
      SOAPAction: "http://opentransportdata.swiss/TDP/Soap_Datex2/Pull/v1/pullTrafficMessages",
    },
    body: SOAP_BODY,
  });
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `upstream ${res.status}`, body: await res.text() }), { status: 502 });
  }
  const xml = await res.text();
  const raw = parseAstraTrafficSituations(xml);

  const db = serviceClient();
  const fetchedAt = new Date().toISOString();
  const { error } = await db.from("road_status_cache").upsert({ id: 1, fetched_at: fetchedAt, raw });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, fetchedAt, raw }), { headers: { "content-type": "application/json" } });
});
