<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { RouteWithShadowResult } from '$lib/routeWithShadow';
	import type { Map as LeafletMap, Marker, Polyline, LayerGroup } from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import type { PageData } from './$types';

	let startLat = $state(50.9406);
	let startLon = $state(6.9577); // Köln
	let endLat = $state(50.98);
	let endLon = $state(7.05); // Bergheim

	let startQuery = $state('Interaktiv Lab');
	let endQuery = $state('Gymnasium Kerpen');

	let loading = $state(false);
	let result = $state<RouteWithShadowResult | null>(null);
	let error = $state<string | null>(null);

	type GeoSuggestion = { display_name: string; lat: string; lon: string };
	let startSuggestions = $state<GeoSuggestion[]>([]);
	let endSuggestions = $state<GeoSuggestion[]>([]);
	let startSearching = $state(false);
	let endSearching = $state(false);
	let showStartSuggestions = $state(false);
	let showEndSuggestions = $state(false);
	let panelCollapsed = $state(false);

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | undefined;
	let startMarker: Marker | undefined;
	let endMarker: Marker | undefined;
	let routeLine: Polyline | undefined;
	let alternativeLines: LayerGroup | undefined;
	let L: typeof import('leaflet');

	let startDebounce: ReturnType<typeof setTimeout>;
	let endDebounce: ReturnType<typeof setTimeout>;

	// ---- POIs ----
	let { data }: { data: PageData } = $props();

	let poiLayer = $state<LayerGroup | null>(null);
	let showPois = $state(true);

	const categoryColors: Record<string, string> = {
		general: '#3b82f6',
		restaurant: '#f97316',
		sight: '#8b5cf6',
		park: '#22c55e',
		shop: '#ec4899'
	};

	function escapeHtml(s: string) {
		return s.replace(
			/[&<>"']/g,
			(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
		);
	}

	function poiPinSvg(color: string) {
		return `
            <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z"
                    fill="${color}" stroke="#fff" stroke-width="2"/>
                <circle cx="14" cy="14" r="5" fill="#fff"/>
            </svg>`;
	}

	function createPoiLayer() {
		const layer = L.layerGroup();

		for (const p of data.pois) {
			const icon = L.divIcon({
				className: 'poi-marker',
				html: poiPinSvg(categoryColors[p.category] ?? categoryColors.general),
				iconSize: [28, 38],
				iconAnchor: [14, 38],
				popupAnchor: [0, -38]
			});

			const popupHtml = `
				<div class="poi-popup">
					${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" />` : ''}
					<h3>${escapeHtml(p.name)}</h3>
					<span class="poi-category">${escapeHtml(p.category)}</span>
					${p.description ? `<p>${escapeHtml(p.description)}</p>` : ''}
				</div>`;

			L.marker([p.latitude, p.longitude], { icon })
				.bindPopup(popupHtml, { maxWidth: 260 })
				.addTo(layer);
		}

		return layer;
	}

	// POIs ein-/ausblenden
	$effect(() => {
		// poiLayer zuerst lesen, damit Svelte es als Abhängigkeit trackt (map ist kein $state)
		if (!poiLayer || !map) return;
		if (showPois) poiLayer.addTo(map);
		else poiLayer.remove();
	});

	// ---- SVG Pin-Icons ----
	function pinSvg(color: string, label: string) {
		return `
            <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26s16-15 16-26C32 7.16 24.84 0 16 0z"
                    fill="${color}" stroke="#fff" stroke-width="2"/>
                <circle cx="16" cy="16" r="9" fill="#fff" fill-opacity="0.9"/>
                <text x="16" y="21" text-anchor="middle" font-size="13" font-weight="700"
                    font-family="system-ui, sans-serif" fill="${color}">${label}</text>
            </svg>`;
	}

	onMount(async () => {
		L = await import('leaflet');

		map = L.map(mapContainer, { zoomControl: false }).setView([startLat, startLon], 11);
		L.control.zoom({ position: 'bottomright' }).addTo(map);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		const startIcon = L.divIcon({
			className: 'custom-marker',
			html: pinSvg('#22c55e', 'A'),
			iconSize: [32, 42],
			iconAnchor: [16, 42]
		});
		const endIcon = L.divIcon({
			className: 'custom-marker',
			html: pinSvg('#ef4444', 'B'),
			iconSize: [32, 42],
			iconAnchor: [16, 42]
		});

		startMarker = L.marker([startLat, startLon], { icon: startIcon, draggable: true }).addTo(map);
		endMarker = L.marker([endLat, endLon], { icon: endIcon, draggable: true }).addTo(map);

		startMarker.on('dragend', async () => {
			const pos = startMarker!.getLatLng();
			startLat = pos.lat;
			startLon = pos.lng;
			startQuery = await reverseGeocode(startLat, startLon);
		});

		endMarker.on('dragend', async () => {
			const pos = endMarker!.getLatLng();
			endLat = pos.lat;
			endLon = pos.lng;
			endQuery = await reverseGeocode(endLat, endLon);
		});

		poiLayer = createPoiLayer();

		fitToMarkers();

		await initLocations();
	});

	async function initLocations() {
		const [startRes] = await geocode('Interaktiv Lab Kerpen');
		if (startRes) selectStart(startRes);

		// kurz warten wegen Nominatim Rate-Limit (max 1 Anfrage/Sek)
		await new Promise((r) => setTimeout(r, 1100));

		const [endRes] = await geocode('Gymnasium Kerpen');
		if (endRes) selectEnd(endRes);

		fitToMarkers();
	}

	onDestroy(() => {
		poiLayer?.clearLayers();
		map?.remove();
	});

	function fitToMarkers() {
		if (!map || !L) return;
		const bounds = L.latLngBounds([
			[startLat, startLon],
			[endLat, endLon]
		]);
		map.fitBounds(bounds, { padding: [80, 80] });
	}

	// Zentrale Helfer: Marker + State immer gemeinsam setzen
	function setStart(lat: number, lon: number) {
		startLat = lat;
		startLon = lon;
		startMarker?.setLatLng([lat, lon]);
	}

	function setEnd(lat: number, lon: number) {
		endLat = lat;
		endLon = lon;
		endMarker?.setLatLng([lat, lon]);
	}

	// ---- Geocoding (Nominatim) ----
	async function geocode(query: string): Promise<GeoSuggestion[]> {
		if (!query.trim()) return [];
		const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`;
		const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
		if (!res.ok) return [];
		return (await res.json()) as GeoSuggestion[];
	}

	async function reverseGeocode(lat: number, lon: number): Promise<string> {
		try {
			const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
			const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
			if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
			const data = await res.json();
			return data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
		} catch {
			return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
		}
	}

	function onStartInput() {
		clearTimeout(startDebounce);
		showStartSuggestions = true;
		startDebounce = setTimeout(async () => {
			startSearching = true;
			startSuggestions = await geocode(startQuery);
			startSearching = false;
		}, 350);
	}

	function onEndInput() {
		clearTimeout(endDebounce);
		showEndSuggestions = true;
		endDebounce = setTimeout(async () => {
			endSearching = true;
			endSuggestions = await geocode(endQuery);
			endSearching = false;
		}, 350);
	}

	function selectStart(s: GeoSuggestion) {
		setStart(parseFloat(s.lat), parseFloat(s.lon));
		startQuery = s.display_name;
		startSuggestions = [];
		showStartSuggestions = false;
		map?.panTo([startLat, startLon]);
	}

	function selectEnd(s: GeoSuggestion) {
		setEnd(parseFloat(s.lat), parseFloat(s.lon));
		endQuery = s.display_name;
		endSuggestions = [];
		showEndSuggestions = false;
		map?.panTo([endLat, endLon]);
	}

	async function useMyLocation(target: 'start' | 'end') {
		if (!navigator.geolocation) {
			error = 'Geolocation wird nicht unterstützt';
			return;
		}
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				const { latitude, longitude } = pos.coords;
				if (target === 'start') {
					setStart(latitude, longitude);
					startQuery = await reverseGeocode(latitude, longitude);
				} else {
					setEnd(latitude, longitude);
					endQuery = await reverseGeocode(latitude, longitude);
				}
				map?.panTo([latitude, longitude]);
			},
			() => {
				error = 'Standort konnte nicht ermittelt werden';
			}
		);
	}

	function swapLocations() {
		const sLat = startLat,
			sLon = startLon,
			sQ = startQuery;
		setStart(endLat, endLon);
		setEnd(sLat, sLon);
		startQuery = endQuery;
		endQuery = sQ;
	}

	function updateRouteLine() {
		if (!map || !L) return;

		routeLine?.remove();
		routeLine = undefined;
		alternativeLines?.remove();
		alternativeLines = undefined;

		if (!result) return;

		const toLatLngs = (coords: [number, number][]) =>
			coords.map(([lon, lat]) => [lat, lon] as [number, number]);

		alternativeLines = L.layerGroup().addTo(map);
		result.alternatives.forEach((alt, i) => {
			if (i === result!.selectedIndex) return;
			L.polyline(toLatLngs(alt.geometry.coordinates), {
				color: '#888',
				weight: 4,
				opacity: 0.6,
				dashArray: '6, 6'
			})
				.bindTooltip(`Alternative ${i + 1}: ${alt.shadowPercentage}% Schatten`)
				.addTo(alternativeLines!);
		});

		routeLine = L.polyline(toLatLngs(result.geometry.coordinates), {
			color: '#007bff',
			weight: 5,
			opacity: 0.85
		}).addTo(map);
		map.fitBounds(routeLine.getBounds(), { padding: [80, 80] });
	}

	async function calculateRoute() {
		loading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				startLat: startLat.toString(),
				startLon: startLon.toString(),
				endLat: endLat.toString(),
				endLon: endLon.toString()
			});

			const response = await fetch(`/api/route?${params}`);

			if (!response.ok) {
				const body = await response.json().catch(() => null);
				throw new Error(body?.message ?? `HTTP ${response.status}`);
			}

			result = await response.json();
			updateRouteLine();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Fehler';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Vollbild-Karte -->
<div bind:this={mapContainer} class="map"></div>

<!-- Floating Suchpanel -->
<div class="floating-panel search-panel" class:collapsed={panelCollapsed}>
	<div class="panel-header">
		<h1>
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="#22c55e"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22z" />
				<circle cx="12" cy="10" r="3" />
			</svg>
			Schatten-Route
		</h1>
		<button
			class="collapse-btn"
			onclick={() => (panelCollapsed = !panelCollapsed)}
			aria-label="Panel ein-/ausklappen"
		>
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				style="transform: rotate({panelCollapsed ? 180 : 0}deg); transition: transform 0.2s;"
			>
				<polyline points="18 15 12 9 6 15" />
			</svg>
		</button>
	</div>

	{#if !panelCollapsed}
		<div class="panel-body">
			<!-- Start -->
			<div class="field-group">
				<div class="field-icon start-dot"></div>
				<div class="autocomplete">
					<input
						type="text"
						placeholder="Startpunkt suchen…"
						bind:value={startQuery}
						oninput={onStartInput}
						onfocus={() => (showStartSuggestions = true)}
						onblur={() => setTimeout(() => (showStartSuggestions = false), 150)}
					/>
					{#if startSearching}<div class="spinner"></div>{/if}
					{#if showStartSuggestions && startSuggestions.length}
						<ul class="suggestions">
							{#each startSuggestions as s (s.lat + s.lon)}
								<li>
									<button type="button" onclick={() => selectStart(s)}>
										<svg
											class="sg-icon"
											viewBox="0 0 24 24"
											width="16"
											height="16"
											fill="none"
											stroke="#007bff"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22z" />
											<circle cx="12" cy="10" r="3" />
										</svg>
										<span>{s.display_name}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				<button
					class="geo-btn"
					title="Meinen Standort verwenden"
					onclick={() => useMyLocation('start')}
					aria-label="Standort für Start"
				>
					<svg
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="3" />
						<path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
						<circle cx="12" cy="12" r="8" />
					</svg>
				</button>
			</div>

			<button
				class="swap-btn"
				title="Start & Ziel tauschen"
				onclick={swapLocations}
				aria-label="Start und Ziel tauschen"
			>
				<svg
					viewBox="0 0 24 24"
					width="18"
					height="18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M7 4v16M7 4l-3 3M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3" />
				</svg>
			</button>

			<!-- Ziel -->
			<div class="field-group">
				<div class="field-icon end-dot"></div>
				<div class="autocomplete">
					<input
						type="text"
						placeholder="Ziel suchen…"
						bind:value={endQuery}
						oninput={onEndInput}
						onfocus={() => (showEndSuggestions = true)}
						onblur={() => setTimeout(() => (showEndSuggestions = false), 150)}
					/>
					{#if endSearching}<div class="spinner"></div>{/if}
					{#if showEndSuggestions && endSuggestions.length}
						<ul class="suggestions">
							{#each endSuggestions as s (s.lat + s.lon)}
								<li>
									<button type="button" onclick={() => selectEnd(s)}>
										<svg
											class="sg-icon"
											viewBox="0 0 24 24"
											width="16"
											height="16"
											fill="none"
											stroke="#007bff"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22z" />
											<circle cx="12" cy="10" r="3" />
										</svg>
										<span>{s.display_name}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				<button
					class="geo-btn"
					title="Meinen Standort verwenden"
					onclick={() => useMyLocation('end')}
					aria-label="Standort für Ziel"
				>
					<svg
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="3" />
						<path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
						<circle cx="12" cy="12" r="8" />
					</svg>
				</button>
			</div>

			<button class="calc-btn" onclick={calculateRoute} disabled={loading}>
				{#if loading}
					<span class="spinner light"></span> Berechnung…
				{:else}
					<svg
						viewBox="0 0 24 24"
						width="18"
						height="18"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" />
						<path d="M9 19h6a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h6" />
					</svg>
					Route berechnen
				{/if}
			</button>

			{#if data.pois.length}
				<label class="poi-toggle">
					<input type="checkbox" bind:checked={showPois} />
					POIs anzeigen ({data.pois.length})
				</label>
			{/if}

			{#if error}
				<div class="error">
					<svg
						viewBox="0 0 24 24"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
						/>
						<line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
					{error}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Floating Ergebnispanel -->
{#if result}
	<div class="floating-panel result-panel">
		<h2>Ergebnis</h2>
		<div class="stats">
			<div class="stat">
				<span class="stat-value">{(result.distance / 1000).toFixed(2)}</span>
				<span class="stat-label">km</span>
			</div>
			<div class="stat">
				<span class="stat-value">{Math.round(result.duration / 60)}</span>
				<span class="stat-label">min</span>
			</div>
			<div class="stat highlight">
				<span class="stat-value">{result.shadowPercentage}%</span>
				<span class="stat-label">Schatten</span>
			</div>
		</div>

		<div class="meta">
			<span>
				<svg
					viewBox="0 0 24 24"
					width="14"
					height="14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M3 21h18M5 21V7l7-4 7 4v14" /><path
						d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"
					/>
				</svg>
				{result.buildingCount} Gebäude
			</span>
			<span>
				<svg
					viewBox="0 0 24 24"
					width="14"
					height="14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
				</svg>
				{result.shadowedBuildingCount} mit Schatten
			</span>
		</div>

		{#if result.alternatives.length > 1}
			<details>
				<summary>Verglichene Routen ({result.alternatives.length})</summary>
				<table>
					<thead>
						<tr><th>Route</th><th>Distanz</th><th>Dauer</th><th>Schatten</th></tr>
					</thead>
					<tbody>
						{#each result.alternatives as alt, i (i)}
							<tr class:selected={i === result.selectedIndex}>
								<td>{i + 1}{i === result.selectedIndex ? ' ✓' : ''}</td>
								<td>{(alt.distance / 1000).toFixed(2)} km</td>
								<td>{Math.round(alt.duration / 60)} min</td>
								<td>{alt.shadowPercentage}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</details>
		{/if}
	</div>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			sans-serif;
	}

	.map {
		position: absolute; /* statt fixed */
		inset: 0;
		width: 100%; /* statt 100vw */
		height: 100%; /* statt 100vh */
		z-index: 0;
	}

	.floating-panel {
		position: absolute; /* statt fixed */
		z-index: 1000;
		background: rgba(255, 255, 255, 0.97);
		backdrop-filter: blur(10px);
		border-radius: 16px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.6);
	}

	.search-panel {
		top: 16px;
		left: 16px;
		width: 360px;
		max-width: calc(100vw - 32px);
		padding: 16px;
		transition: all 0.25s ease;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.panel-header h1 {
		font-size: 1.15rem;
		margin: 0;
		color: #1a1a1a;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.collapse-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		padding: 4px 8px;
		border-radius: 6px;
		display: flex;
	}
	.collapse-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	.poi-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		color: #444;
		cursor: pointer;
		padding: 2px 4px;
	}

	:global(.poi-marker) {
		background: transparent;
		border: none;
	}
	:global(.poi-popup) {
		font-family: system-ui;
		min-width: 180px;
	}
	:global(.poi-popup img) {
		width: 100%;
		height: 120px;
		object-fit: cover;
		border-radius: 6px;
		margin-bottom: 0.5rem;
	}
	:global(.poi-popup h3) {
		margin: 0 0 0.25rem;
		font-size: 1rem;
	}
	:global(.poi-category) {
		display: inline-block;
		background: #eef2ff;
		color: #4338ca;
		padding: 0.15rem 0.5rem;
		border-radius: 10px;
		font-size: 0.75rem;
	}
	:global(.poi-popup p) {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: #444;
	}

	.panel-body {
		margin-top: 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field-group {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #f4f5f7;
		border-radius: 12px;
		padding: 4px 10px;
		border: 1.5px solid transparent;
		transition:
			border-color 0.15s,
			background 0.15s;
	}
	.field-group:focus-within {
		border-color: #007bff;
		background: #fff;
	}

	.field-icon {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.start-dot {
		background: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
	}
	.end-dot {
		background: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
	}

	.autocomplete {
		position: relative;
		flex: 1;
	}
	.autocomplete input {
		width: 100%;
		border: none;
		background: transparent;
		padding: 10px 4px;
		font-size: 0.95rem;
		outline: none;
	}

	.suggestions {
		position: absolute;
		top: calc(100% + 6px);
		left: -10px;
		right: -40px;
		list-style: none;
		margin: 0;
		padding: 6px;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
		max-height: 260px;
		overflow-y: auto;
		z-index: 1100;
	}
	.suggestions li button {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 8px;
		text-align: left;
		border: none;
		background: none;
		padding: 10px 12px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1.35;
		color: #333;
	}
	.suggestions li button:hover {
		background: #f0f6ff;
	}
	.sg-icon {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.geo-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		border-radius: 8px;
		flex-shrink: 0;
		color: #007bff;
		display: flex;
	}
	.geo-btn:hover {
		background: rgba(0, 123, 255, 0.1);
	}

	.swap-btn {
		align-self: center;
		background: #fff;
		border: 1.5px solid #e0e0e0;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		cursor: pointer;
		color: #007bff;
		margin: -4px 0;
		z-index: 2;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.swap-btn:hover {
		transform: rotate(180deg);
	}

	.calc-btn {
		margin-top: 6px;
		padding: 12px;
		background: linear-gradient(135deg, #007bff, #0056d6);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition:
			transform 0.1s,
			opacity 0.2s;
	}
	.calc-btn:hover:not(:disabled) {
		transform: translateY(-1px);
	}
	.calc-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		position: absolute;
		right: 4px;
		top: 50%;
		width: 16px;
		height: 16px;
		border: 2px solid #ccc;
		border-top-color: #007bff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	.spinner.light {
		position: static;
		border-color: rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		animation: spin-light 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: translateY(-50%) rotate(360deg);
		}
	}
	@keyframes spin-light {
		to {
			transform: rotate(360deg);
		}
	}

	.error {
		color: #c0392b;
		background: #ffeaea;
		padding: 10px 12px;
		border-radius: 10px;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.result-panel {
		bottom: 16px;
		left: 16px;
		width: 360px;
		max-width: calc(100vw - 32px);
		padding: 18px;
	}
	.result-panel h2 {
		margin: 0 0 12px;
		font-size: 1.05rem;
	}

	.stats {
		display: flex;
		gap: 10px;
		margin-bottom: 12px;
	}
	.stat {
		flex: 1;
		background: #f4f5f7;
		border-radius: 12px;
		padding: 12px 8px;
		text-align: center;
	}
	.stat.highlight {
		background: linear-gradient(135deg, #e3f0ff, #d0e4ff);
	}
	.stat-value {
		display: block;
		font-size: 1.4rem;
		font-weight: 700;
		color: #1a1a1a;
	}
	.stat-label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.82rem;
		color: #555;
		margin-bottom: 8px;
	}
	.meta span {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	details summary {
		cursor: pointer;
		font-size: 0.85rem;
		color: #007bff;
		padding: 6px 0;
		user-select: none;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
		font-size: 0.82rem;
	}
	th,
	td {
		text-align: left;
		padding: 6px 8px;
		border-bottom: 1px solid #eee;
	}
	tr.selected {
		font-weight: 700;
		color: #007bff;
	}

	:global(.custom-marker) {
		background: none;
		border: none;
	}
</style>
