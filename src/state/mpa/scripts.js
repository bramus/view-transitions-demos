window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		sessionStorage.setItem("currentTime", document.querySelector('video').currentTime);
	}
});

window.addEventListener('pagereveal', async (e) => {
	if (e.viewTransition) {
		document.querySelector('video').currentTime = sessionStorage.getItem("currentTime");
	}
});
