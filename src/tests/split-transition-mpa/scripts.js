// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/tests/split-transition-mpa';

// // Make sure browser has support
// document.addEventListener("DOMContentLoaded", (e) => {
// 	let shouldThrow = false;

// 	if (!window.navigation) {
// 		document.querySelector('.warning[data-reason="navigation-api"]').style.display = "block";
// 		shouldThrow = false;
// 	}

// 	if (!("CSSViewTransitionRule" in window)) {
// 		document.querySelector('.warning[data-reason="cross-document-view-transitions"]').style.display = "block";
// 		shouldThrow = false;
// 	}

// 	if (shouldThrow) {
// 		// Throwing here, to prevent the rest of the code from getting executed
// 		// If only JS (in the browser) had something like process.exit().
// 		throw new Error('Browser is lacking support …');
// 	}
// });

// // Handle .back links
// document.addEventListener('click', (e) => {
// 	if (e.target.matches('a.back')) {
// 		e.preventDefault();

// 		if (navigation.canGoBack) {
// 			navigation.back();
// 		} else {
// 			navigation.navigate(`${basePath}/`);
// 		}
// 	}
// });

// // Start a VT when a navigation begins. Don’t intercept, though
let outgoingViewTransition;
navigation.addEventListener("navigate", async (e) => {
	// Start outgoing View Transition
	outgoingViewTransition = document.startViewTransition({
		update: () => {
			// We retain the page having dipped to black by injecting an overlay onto the page
			document.documentElement.dataset.pendingTransition = 'true';
		},
		types: ['outgoing', 'fade-out'],
	});
});

// When swapping to the next page, note the progress of the VT
window.addEventListener('pageswap', async (e) => {
	if (outgoingViewTransition) {
		const rootGroupAnimation = document.getAnimations().find((anim) => {
			return anim.effect.target === document.documentElement &&
			anim.effect.pseudoElement.startsWith('::view-transition');
		});

		console.log(rootGroupAnimation);

		if (rootGroupAnimation) {
			sessionStorage.setItem("animationProgress", rootGroupAnimation.effect.getComputedTiming().progress);
		} else {
			sessionStorage.setItem("animationProgress", 0);
		}
	} else {
		sessionStorage.removeItem("animationProgress");
	}
});

// When revealing the new page, restore the VT and its progress so that the animation can finish
// If there was none, just undip from black
window.addEventListener("pagereveal", async (e) => {

	// Don’t do anything on a reload
	if (navigation.activation.navigationType === 'reload') {
		delete document.documentElement.dataset.pendingTransition;
		return;
	}

	// Recreate the outgoingViewTransition to where it was, and await it
	const animationProgress = sessionStorage.getItem("animationProgress");
	if (animationProgress) {
		delete document.documentElement.dataset.pendingTransition;

		outgoingViewTransition = document.startViewTransition({
			update: () => {
				// We retain the page having dipped to black by injecting an overlay onto the page
				document.documentElement.dataset.pendingTransition = 'true';
			},
			types: ['outgoing', 'fade-out'],
		});

		const vtAnimations = document.getAnimations().filter((anim) => {
			return anim.effect.target === document.documentElement &&
			anim.effect.pseudoElement.startsWith('::view-transition');
		});

		vtAnimations.forEach((anim) => {
			anim.currentTime = animationProgress * anim.effect.getComputedTiming().duration;
			document.querySelector('p').innerText = anim.currentTime;
		});

		await outgoingViewTransition.finished;
	}

	// Set up an incoming VT and remove the loading overlay
	incomingViewTransition = document.startViewTransition({
		update: () => {
			delete document.documentElement.dataset.pendingTransition;
		},
		types: ['incoming', 'fade-in'],
	});
});
