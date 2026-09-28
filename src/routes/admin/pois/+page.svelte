<!-- src/routes/admin/pois/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editingId: number | null = $state(null);
	let showForm = $state(false);
</script>

<div class="dashboard">
	<header>
		<h1>POI Verwaltung</h1>
		<button
			onclick={() => {
				showForm = !showForm;
				editingId = null;
			}}
		>
			{showForm ? 'Abbrechen' : '+ Neuer POI'}
		</button>
	</header>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	{#if showForm}
		<form method="POST" action="?/create" use:enhance>
			<div class="grid">
				<label>Name <input name="name" required /></label>
				<label>Kategorie <input name="category" placeholder="general" /></label>
				<label>Breitengrad <input name="latitude" type="number" step="any" required /></label>
				<label>Längengrad <input name="longitude" type="number" step="any" required /></label>
				<label class="full">Adresse <input name="address" /></label>
				<label class="full">Bild-URL <input name="imageUrl" /></label>
				<label class="full">Beschreibung <textarea name="description" rows="3"></textarea></label>
				<label class="checkbox"><input type="checkbox" name="isPublished" /> Veröffentlicht</label>
			</div>
			<button type="submit">Speichern</button>
		</form>
	{/if}

	<table>
		<thead>
			<tr>
				<th>ID</th><th>Name</th><th>Kategorie</th>
				<th>Koordinaten</th><th>Status</th><th>Aktionen</th>
			</tr>
		</thead>
		<tbody>
			{#each data.pois as p (p.id)}
				<tr>
					<td>{p.id}</td>
					<td>{p.name}</td>
					<td>{p.category}</td>
					<td>{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</td>
					<td>
						<form method="POST" action="?/togglePublish" use:enhance>
							<input type="hidden" name="id" value={p.id} />
							<input type="hidden" name="current" value={p.isPublished} />
							<button class="badge" class:published={p.isPublished}>
								{p.isPublished ? 'Live' : 'Entwurf'}
							</button>
						</form>
					</td>
					<td>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={p.id} />
							<button
								class="danger"
								onclick={(e) => {
									if (!confirm('POI löschen?')) e.preventDefault();
								}}>Löschen</button
							>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.dashboard {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 1rem;
		font-family: system-ui;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.error {
		color: #c00;
		background: #fee;
		padding: 0.5rem 1rem;
		border-radius: 4px;
	}
	form {
		margin: 1rem 0;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 8px;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.grid .full {
		grid-column: 1 / -1;
	}
	label {
		display: flex;
		flex-direction: column;
		font-size: 0.85rem;
		gap: 0.25rem;
	}
	.checkbox {
		flex-direction: row;
		align-items: center;
	}
	input,
	textarea {
		padding: 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	th,
	td {
		padding: 0.6rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	.badge {
		background: #ddd;
		border: none;
		padding: 0.25rem 0.6rem;
		border-radius: 12px;
		cursor: pointer;
	}
	.badge.published {
		background: #c6f6d5;
		color: #22543d;
	}
	.danger {
		background: #fed7d7;
		border: none;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
