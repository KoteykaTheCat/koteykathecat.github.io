const batch_size = 25;
let dreams_i = [];
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

	const id = new URLSearchParams(window.location.search).get("id");
	if (id) show_dream(id);

	window.addEventListener("scroll", on_scroll);

	window.addEventListener("popstate", () => {
		const id = new URLSearchParams(window.location.search).get("id");
		if (id) show_dream(id);
		else hide_dream();
	});
}

window.addEventListener("DOMContentLoaded", () => {
	dreams_list = document.getElementById("dreams");
	dream_panel = document.getElementById("dream");
	dream_title = document.getElementById("dream_title");
	dream_date = document.getElementById("dream_date");
	dream_tags = document.getElementById("dream_tags");
	dream_text = document.getElementById("dream_text");

	document.querySelector("#dream .dream_panel").addEventListener("click", event => {
    	event.click_on_panel = true;
    });
    document.getElementById("dream").addEventListener("click", event => {
    	if (event.click_on_panel) return;
    	close_dream()
    });

	init();
});

function on_scroll() {
	if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) load_dreams();
}

async function load_dreams() {
	if (loading || loaded_count >= dreams_i.length) return;
	loading = true;

	try {
		const next_batch = dreams_i.slice(loaded_count, loaded_count + batch_size);
		for (const i of next_batch) {
			loaded_count += 1;

			const res = await fetch(`dreams/${i}.json`);
			if (!res.ok) continue;

			const dream = await res.json();
			const card = document.createElement("div");
			card.innerHTML = `
				<div class="dream_p" id="${i}">
					<div class="title">${dream.title}</div>
					<div class="date">${dream.date}</div>
					<div class="tags">${render_tags(dream)}</div>
				</div>
			`;
			card.querySelector(".dream_p").addEventListener("click", () => open_dream(i));
			dreams_list.appendChild(card);
		}
	} finally {
		loading = false;
	}
}

function render_tags(dream) {
	if (!("tags" in dream)) return "";
	return dream.tags.map(tag => `
		<div class="tag ${tag}">${tag_text[tag] || tag}</div>
	`).join("");
}

function open_dream(id) {
	const current = new URLSearchParams(window.location.search).get("id");
	if (current !== String(id)) {
		const url = new URL(window.location.href);
		url.searchParams.set("id", id);
		history.pushState({ dream: id }, "", url);
	}
	show_dream(id);
}

async function show_dream(id) {
	const res = await fetch(`dreams/${id}.json`);
	if (!res.ok) {
		not_found();
		return;
	}

	const dream = await res.json();
	dream_title.innerHTML = dream.title;
	dream_date.innerHTML = dream.date;
	dream_tags.innerHTML = render_tags(dream);
	dream_text.innerHTML = dream.text;
	dream_date.classList.remove("hidden");
	dream_tags.classList.remove("hidden");
	dream_text.classList.remove("hidden");
	dream_panel.classList.add("opened");
}

function not_found() {
	dream_title.innerHTML = "Сон не найден";
	dream_date.classList.add("hidden");
	dream_tags.classList.add("hidden");
	dream_text.classList.add("hidden");
	dream_panel.classList.add("opened");
}

function hide_dream() {
	dream_panel.classList.remove("opened");
}

function close_dream() {
	if (!dream_panel.classList.contains("opened")) return;

	if (history.state && history.state.dream !== undefined) history.back();
	else {
		const url = new URL(window.location.href);
		url.searchParams.delete("id");
		history.replaceState(null, "", url);
		hide_dream();
	}
}

document.addEventListener("keydown", function (event) {
	if (event.code === "Escape") close_dream();
});