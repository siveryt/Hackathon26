// src/lib/overpass.ts
import { env } from '$env/dynamic/private';

export interface Building {
	id: string;
	lat: number;
	lon: number;
	height: number;
	buildingType: string;
}

interface OverpassElement {
	type: 'way' | 'relation' | 'node';
	id: number;
	center?: { lat: number; lon: number };
	tags?: Record<string, string>;
}

// Öffentliche Overpass-Instanzen – Fallback, falls keine lokale Instanz (OVERPASS_URL)
// erreichbar ist. Werden parallel angefragt, die erste Antwort gewinnt
// (einzelne Instanzen sind oft überlastet und liefern 429/504 oder hängen)
const OVERPASS_URLS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.private.coffee/api/interpreter',
	'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];
const REQUEST_TIMEOUT_MS = 30_000;

// Gebäude ändern sich kaum – Ergebnisse pro (gerundeter) Bounding Box cachen
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { buildings: Building[]; expires: number }>();

export async function getBuildingsInBBox(
	south: number,
	west: number,
	north: number,
	east: number
): Promise<Building[]> {
	// Auf ~100 m nach außen runden, damit ähnliche Anfragen den Cache treffen
	const r = (v: number, fn: (x: number) => number) => fn(v * 1000) / 1000;
	[south, west, north, east] = [
		r(south, Math.floor),
		r(west, Math.floor),
		r(north, Math.ceil),
		r(east, Math.ceil)
	];

	const key = `${south},${west},${north},${east}`;
	const cached = cache.get(key);
	if (cached && cached.expires > Date.now()) return cached.buildings;

	// Globale Settings müssen in EINER Anweisung stehen
	const query = `
    [out:json][timeout:25][bbox:${south},${west},${north},${east}];
    (
      way["building"];
      relation["building"];
    );
    out center tags;
  `;

	let buildings: Building[];
	try {
		buildings = env.OVERPASS_URL
			? await fetchBuildings(env.OVERPASS_URL, query).catch(() => fetchFromPublic(query))
			: await fetchFromPublic(query);
	} catch {
		// Ohne Gebäude wäre jede Route 0 % Schatten – lieber klar scheitern
		throw new Error('Gebäudedaten nicht verfügbar: alle Overpass-Server überlastet');
	}

	cache.set(key, { buildings, expires: Date.now() + CACHE_TTL_MS });
	return buildings;
}

// Alle öffentlichen Instanzen parallel fragen, die erste Antwort gewinnt
async function fetchFromPublic(query: string): Promise<Building[]> {
	// Sobald eine Instanz geantwortet hat, die übrigen Anfragen abbrechen
	const done = new AbortController();
	try {
		return await Promise.any(OVERPASS_URLS.map((url) => fetchBuildings(url, query, done.signal)));
	} finally {
		done.abort();
	}
}

async function fetchBuildings(url: string, query: string, cancel?: AbortSignal) {
	const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			method: 'POST',
			// overpass-api.de lehnt generische User-Agents (z.B. Nodes "node") mit 406 ab
			headers: {
				'User-Agent': 'Hackathon26-ShadowRoute/0.1',
				Accept: 'application/json'
			},
			body: new URLSearchParams({ data: query }),
			signal: cancel ? AbortSignal.any([cancel, timeout]) : timeout
		});

		if (!response.ok) {
			throw new Error(`${response.status} ${response.statusText}`);
		}

		const json: { elements?: OverpassElement[] } = await response.json();
		return parseOSMtoBuildings(json.elements ?? []);
	} catch (error) {
		if (!cancel?.aborted) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`[Overpass] ${url} fehlgeschlagen: ${message}`);
		}
		throw error;
	}
}

function parseOSMtoBuildings(elements: OverpassElement[]): Building[] {
	const buildings: Building[] = [];

	for (const el of elements) {
		if (!el.center) continue; // Nur Gebäude mit Center-Punkt

		const tags = el.tags ?? {};
		const buildingType = tags.building ?? 'yes';

		// Höhe: height-Tag > building:levels > Default nach Gebäudetyp
		let height = parseFloat(tags.height);
		if (!(height > 0)) {
			const levels = parseFloat(tags['building:levels']);
			height = levels > 0 ? levels * 3 : getDefaultHeight(buildingType);
		}

		buildings.push({
			id: `${el.type}/${el.id}`,
			lat: el.center.lat,
			lon: el.center.lon,
			height,
			buildingType
		});
	}

	return buildings;
}

function getDefaultHeight(buildingType: string): number {
	const defaults: Record<string, number> = {
		residential: 8,
		apartment: 12,
		apartments: 12,
		house: 7,
		commercial: 10,
		retail: 8,
		office: 12,
		industrial: 10,
		warehouse: 8,
		church: 20,
		yes: 9
	};
	return defaults[buildingType] || 9;
}
