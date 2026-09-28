<script lang="ts">
	import type { RouteWithShadowResult } from '$lib/routeWithShadow';

	let startLat = $state(50.9406);
	let startLon = $state(6.9577); // Köln
	let endLat = $state(50.98);
	let endLon = $state(7.05); // Bergheim

	let loading = $state(false);
	let result = $state<RouteWithShadowResult | null>(null);
	let error = $state<string | null>(null);

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
		max-width: 600px;
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
