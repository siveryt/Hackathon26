<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { RouteWithShadowResult } from '$lib/routeWithShadow';
	import type { Map as LeafletMap, Marker, Polyline } from 'leaflet';
	import 'leaflet/dist/leaflet.css';

	let startLat = $state(50.9406);
	let startLon = $state(6.9577); // Köln
	let endLat = $state(50.98);
	let endLon = $state(7.05); // Bergheim

	let loading = $state(false);
	let result = $state<RouteWithShadowResult | null>(null);
	let error = $state<string | null>(null);

	let mapContainer: HTMLDivElement;
	let map: LeafletMap | undefined;
	let startMarker: Marker | undefined;
	let endMarker: Marker | undefined;
	let routeLine: Polyline | undefined;
	let L: typeof import('leaflet');

	onMount(async () => {
		L = await import('leaflet');

		map = L.map(mapContainer).setView([startLat, startLon], 11);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		const startIcon = L.divIcon({
			className: 'custom-marker',
			html: '🟢',
			iconSize: [24, 24]
		});
		const endIcon = L.divIcon({
			className: 'custom-marker',
			html: '🔴',
			iconSize: [24, 24]
		});

		startMarker = L.marker([startLat, startLon], { icon: startIcon, draggable: true }).addTo(map);
		endMarker = L.marker([endLat, endLon], { icon: endIcon, draggable: true }).addTo(map);

		startMarker.on('dragend', () => {
			const pos = startMarker!.getLatLng();
			startLat = pos.lat;
			startLon = pos.lng;
		});

		endMarker.on('dragend', () => {
			const pos = endMarker!.getLatLng();
			endLat = pos.lat;
			endLon = pos.lng;
		});

		fitToMarkers();
	});

	onDestroy(() => {
		map?.remove();
	});

	function fitToMarkers() {
		if (!map || !L) return;
		const bounds = L.latLngBounds([
			[startLat, startLon],
			[endLat, endLon]
		]);
		map.fitBounds(bounds, { padding: [50, 50] });
	}

	// Marker bewegen sich mit, wenn sich die Inputfelder ändern
	$effect(() => {
		startMarker?.setLatLng([startLat, startLon]);
	});

	$effect(() => {
		endMarker?.setLatLng([endLat, endLon]);
	});

	function updateRouteLine() {
		if (!map || !L) return;

		routeLine?.remove();
		routeLine = undefined;

		if (!result) return;

		// Annahme: result enthält eine Geometrie mit [lon, lat]-Paaren (z. B. result.geometry.coordinates).
		// Passe das ggf. an die tatsächliche Struktur von RouteWithShadowResult an.
		const coords = (result as any).geometry?.coordinates as [number, number][] | undefined;

		if (coords?.length) {
			const latLngs = coords.map(([lon, lat]) => [lat, lon] as [number, number]);
			routeLine = L.polyline(latLngs, { color: '#007bff', weight: 5, opacity: 0.75 }).addTo(map);
			map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
		} else {
			// Fallback: Luftlinie zwischen Start und Ende
			routeLine = L.polyline(
				[
					[startLat, startLon],
					[endLat, endLon]
				],
				{ color: '#007bff', weight: 4, opacity: 0.5, dashArray: '8, 8' }
			).addTo(map);
			fitToMarkers();
		}
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

<div class="container">
	<h1>Schatten-Route Planer</h1>

	<div class="form">
		<div>
			<label>Start Lat: <input type="number" bind:value={startLat} step="0.001" /></label>
			<label>Start Lon: <input type="number" bind:value={startLon} step="0.001" /></label>
		</div>
		<div>
			<label>End Lat: <input type="number" bind:value={endLat} step="0.001" /></label>
			<label>End Lon: <input type="number" bind:value={endLon} step="0.001" /></label>
		</div>
		<button onclick={calculateRoute} disabled={loading}>
			{loading ? 'Berechnung...' : 'Route berechnen'}
		</button>
	</div>

	<div bind:this={mapContainer} class="map"></div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if result}
		<div class="result">
			<h2>Ergebnis</h2>
			<p><strong>Distanz:</strong> {(result.distance / 1000).toFixed(2)} km</p>
			<p><strong>Dauer:</strong> {Math.round(result.duration / 60)} min</p>
			<p><strong>Im Schatten:</strong> {result.shadowPercentage}%</p>
			<p><strong>Gebäude gefunden:</strong> {result.buildingCount}</p>
			<p><strong>Mit Schatten:</strong> {result.shadowedBuildingCount}</p>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 20px;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 20px 0;
	}

	.form > div {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	input {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	button {
		padding: 10px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.map {
		width: 100%;
		height: 450px;
		border-radius: 8px;
		margin: 20px 0;
	}

	:global(.custom-marker) {
		font-size: 24px;
		text-align: center;
		line-height: 24px;
	}

	.error {
		color: red;
		padding: 10px;
		background: #ffe6e6;
		border-radius: 4px;
	}

	.result {
		background: #f0f0f0;
		padding: 20px;
		border-radius: 4px;
		margin: 20px 0;
	}
</style>
