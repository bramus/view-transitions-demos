const getVideoState = ($video) => {
	return {
		currentTime: $video.currentTime,
		paused: $video.paused,
		muted: $video.muted,
	};
};

const restoreVideoState = ($video, state) => {
	$video.currentTime = state.currentTime;
	$video.muted = state.muted;
	if (state.paused === false) $video.play();
};

window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		const $video = document.querySelector('video');
		const videoState = getVideoState($video);
		sessionStorage.setItem("videoState", JSON.stringify(videoState));
	}
});

window.addEventListener('pagereveal', async (e) => {
	if (e.viewTransition) {
		const $video = document.querySelector('video');
		const videoState = sessionStorage.getItem("videoState");
		if ($video && videoState) {
			try {
				$video.addEventListener("loadeddata", e => {
					if ($video.readyState >= 2) {
						restoreVideoState($video, JSON.parse(videoState));
					}
				});
			} catch (e) {
				$video.currentTime = 0;
			}
		}
	}
});
