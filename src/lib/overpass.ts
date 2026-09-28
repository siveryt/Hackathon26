// src/lib/overpass.ts

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

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export async function getBuildingsInRadius(
	lat: number,
	lon: number,
	radiusKm: number = 1
): Promise<Building[]> {
	const radiusLat = radiusKm / 111; // 1° Breite ≈ 111km
	const radiusLon = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

	const south = lat - radiusLat;
	const north = lat + radiusLat;
	const west = lon - radiusLon;
	const east = lon + radiusLon;

	// Globale Settings müssen in EINER Anweisung stehen
	const query = `
    [out:json][timeout:30][bbox:${south},${west},${north},${east}];
    (
      way["building"];
      relation["building"];
    );
    out center tags;
  `;

	try {
		const response = await fetch(OVERPASS_URL, {
			method: 'POST',
			body: new URLSearchParams({ data: query })
		});

		if (!response.ok) {
			throw new Error(`Overpass Fehler: ${response.status} ${response.statusText}`);
		}

		const json: { elements?: OverpassElement[] } = await response.json();
		return parseOSMtoBuildings(json.elements ?? []);
	} catch (error) {
		console.error('Overpass API Fehler:', error);
		return [];
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
