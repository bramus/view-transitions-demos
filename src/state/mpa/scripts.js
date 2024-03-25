window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		sessionStorage.setItem("currentTime", document.querySelector('video').currentTime);
	}
});

window.addEventListener('pagereveal', async (e) => {
	if (e.viewTransition) {
		if (sessionStorage.getItem("currentTime")) {
			try {
				document.querySelector('video').currentTime = sessionStorage.getItem("currentTime");
				document.querySelector('video').play();
			} catch {
				document.querySelector('video').currentTime = 0;
			}
		}
	}
});
