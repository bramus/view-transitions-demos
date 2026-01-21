// Make sure browser has support
document.addEventListener("DOMContentLoaded", (e) => {
	let shouldThrow = false;

	if (!("CSSViewTransitionRule" in window)) {
		document.querySelector('.warning[data-reason="cross-document-view-transitions"]').style.display = "block";
		shouldThrow = true;
	}

	if (shouldThrow) {
		// Throwing here, to prevent the rest of the code from getting executed
		// If only JS (in the browser) had something like process.exit().
		throw new Error('Browser is lacking support …');
	}
});

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

const getViewTransitionAnimations = (t) => {
	// console.log(t.transitionRoot.getAnimations());
	const animations = document.getAnimations().filter((anim) => {
		return (anim.effect.target === (t.transitionRoot ?? document.documentElement)) && anim.effect.pseudoElement?.startsWith("::view-transition");
	});
	// console.log(animations);
	return animations;
}

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

		// Pause the View Transition
		getViewTransitionAnimations(e.viewTransition).forEach((anim) => {
			anim.pause();
		});

		if ($video && videoState) {
			try {
				$video.addEventListener("loadeddata", e => {
					if ($video.readyState == 4) {
						restoreVideoState($video, JSON.parse(videoState));

						// Resume the View Transition
						getViewTransitionAnimations(e.viewTransition).forEach((anim) => {
							anim.play();
						});
					}
				});
			} catch (e) {
				$video.currentTime = 0;

				// Resume the View Transition
				getViewTransitionAnimations(e.viewTransition).forEach((anim) => {
					anim.play();
				});
			}
		}
	}
});
