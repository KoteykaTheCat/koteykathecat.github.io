function open_gallery(container) {
	document.getElementById("gallery").classList.add("opened");
	document.getElementById("gallery_img").src = get_img(container);
};
function close_gallery() {
	document.getElementById("gallery").classList.remove("opened");
};

function get_img(container) {
	if (!container || !(container instanceof HTMLElement)) return null;
	return container.querySelector('.img').src;
}