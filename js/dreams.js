const batch_size = 25;
let dreams_i = [];
let loaded_dreams = [];
let loaded_count = 0;
let loading = false;

let dreams_list;
let dream_panel;
let dream_title;
let dream_date;
let dream_tags;
let dream_text;

const tag_text = {
	"abs": "абсурдный",
	"sus": "подозрительный",
	"prop": "вещий",
	"nm": "кошмар"
};

async function init() {
	const res = await fetch("dreams/index.json");
	dreams_i = await res.json();

	load_dreams();

	const params = new URLSearchParams(window.location.search);
	if (params.has("id")) {
		const id = params.get('id');
		if (id) load_dream(id)
		else not_found()
	}

	window.addEventListener("scroll", on_scroll);
}

window.addEventListener("DOMContentLoaded", () => {
	dreams_list = document.getElementById("dreams");
	dream_panel = document.getElementById("dream");
	dream_title = document.getElementById("dream_title");
	dream_date = document.getElementById("dream_date");
	dream_tags = document.getElementById("dream_tags");
	dream_text = document.getElementById("dream_text");
	init();
});

function on_scroll() {
	if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) load_dreams();
}

async function load_dreams() {
	if (loading) return;
	else loading = true;
	if (loaded_count >= dreams_i.length) return;

	const next_batch = dreams_i.slice(loaded_count, loaded_count + batch_size);
	let to_load = loaded_count + next_batch.length;
	for (const i of next_batch) {
		if (loaded_dreams.indexOf(i) !== -1) continue;
		loaded_dreams.push(i);
		const res = await fetch(`dreams/${i}.json`);
		if (!res.ok) continue;

		const dream = await res.json();
		const card = document.createElement("div");
		card.innerHTML = `
			<div class="dream_p" id=${i} onclick="load_dream(this.id)">
				<div class="title"> ${dream.title} </div>
            		<div class="date"> ${dream.date} </div>
            		<div class="tags">
            			${"tags" in dream ? dream.tags.map(tag => `
            				<div class="tag ${tag}"> ${tag_text[tag] || tag} </div>
            			`).join("") : ""}
            		</div>
			</div>
		`;
		dreams_list.appendChild(card);
		loaded_count += 1;
		if (loaded_count >= to_load) loading = false;
	}
}

async function load_dream(id) {
	const res = await fetch(`dreams/${id}.json`);
	if (!res.ok) {
		not_found();
		return;
	}

	const dream = await res.json();
	dream_title.innerHTML = `${dream.title} </div>`;
	dream_date.innerHTML = `${dream.date} </div>`;
	dream_tags.innerHTML = `${"tags" in dream ? dream.tags.map(tag => `
		<div class="tag ${tag}"> ${tag_text[tag] || tag} </div>
	`).join("") : ""}`;
	dream_text.innerHTML = `${dream.text} </div>`;
	dream_date.classList.remove("hidden");
	dream_tags.classList.remove("hidden");
	dream_text.classList.remove("hidden");
	dream_panel.classList.add("opened");
	const url = new URL(window.location.href);
    url.searchParams.set("id", id);
    history.pushState(null, "", url);
}

function not_found() {
	dream_title.innerHTML = `Сон не найден`;
	dream_date.classList.add("hidden");
	dream_tags.classList.add("hidden");
	dream_text.classList.add("hidden");
	dream_panel.classList.add("opened");
}

function close_dream() {
	document.getElementById("dream").classList.remove("opened");
	const url = new URL(window.location.href);
	if (url.searchParams.has("id")) url.searchParams.delete("id");
	history.replaceState(null, "", url);
};

document.addEventListener("keydown", function(event) {
	if (event.code === "Escape") close_dream();
});