// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/pagination/mpa-or-navigation-api';

// Make sure browser has support
document.addEventListener("DOMContentLoaded", (e) => {
	let shouldThrow = false;

	if (!window.navigation) {
		document.querySelector('.warning[data-reason="navigation-api"]').style.display = "block";
		shouldThrow = false;
	}

	if (document.startViewTransition && !("types" in ViewTransition.prototype)) {
		document.querySelector('.warning[data-reason="view-transition-types"]').style.display = "block";
		shouldThrow = true;
	}

	if (shouldThrow) {
		// Throwing here, to prevent the rest of the code from getting executed
		// If only JS (in the browser) had something like process.exit().
		throw new Error('Browser is lacking support …');
	}
});

// MPA
// Note: determining the types is typically needed only on the new page (thus: in `pageswap`)
// However, because we set the `view-transition-names` based on the types (see `mpa.css`)
// we also determine it on the outgoing page.
window.addEventListener("pageswap", async (e) => {
	if (e.viewTransition) {

		// @TODO: If destination does not start with basePath, abort the VT

		const transitionType = determineTransitionType(e.activation.from, e.activation.entry);
		console.log(`pageSwap: ${transitionType}`);
		e.viewTransition.types.add(transitionType);

		// Persist transitionType for browsers that don’t have the Navigation API
		if (!window.navigation) {
			localStorage.setItem("transitionType", transitionType);
		}
	}
});

window.addEventListener("pagereveal", async (e) => {
	if (e.viewTransition) {

		// @TODO: If destination does not start with basePath, abort the VT

		// Get transitionType from localStorage or derive it using the NavigationActivationInformation
		let transitionType;
		if (!window.navigation) {
			transitionType = localStorage.getItem("transitionType");
		} else {
			transitionType = determineTransitionType(navigation.activation.from, navigation.activation.entry);
		}

		console.log(`pageReveal: ${transitionType}`);
		e.viewTransition.types.add(transitionType);
	}
});

if (window.navigation) {
	// Keep track of the last fully completed NavigationEntry as `lastSuccessfulEntry`
	// We’re gonna need this because we can’t entirely rely on currentEntry
	// when intercepting. See next comment for more info.
	navigation.lastSuccessfulEntry = navigation?.currentEntry;
	navigation.addEventListener('navigatesuccess', e => {
		navigation.lastSuccessfulEntry = e.currentTarget.currentEntry;
	});

	// Turn our MPA into an SPA … WOOHOOW!
	navigation.addEventListener("navigate", (e) => {

		// Don’t intercept when we shouldn’t
		if (shouldNotIntercept(e)) {
			return;
		}

		e.intercept({
			handler: async () => {

				// @TODO: show loading while fetch is running …

				// @TODO: Maybe I should move this whole fetch logic to the outside of e.intercept?
				// Because on slow connections you end up with an updated URL but with the old content still visible …

				// Get new HTML
				const response = await fetch(e.destination.url, {
					signal: e.signal, // @ref https://developer.chrome.com/docs/web-platform/navigation-api/#abort_signals
				});
				const html = await response.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, "text/html");
				const $main = doc.querySelector("main");
				const $title = doc.querySelector("head title");

				const update = () => {
					document.title = $title.innerText;
					document.querySelector('main').replaceWith($main); // You do trust your own markup, right?
				};

				// The UA already provided us with a Visual Transition,
				// there is no need to do one ourselves.
				if (e.hasUAVisualTransition) {
					update();
				}

				// Go View Transitions, go!
				else {
					// Push or Pop? Before we swap the markup, determine which animation to use for the View Transition
					// @note: We can only do this detection here inside intercept as we need the new currentEntry to compare the old one to
					// @note: While we could get the destination.url from the event, that’s not sufficient.
					//        In some cases we need to compare the indices of each entry to determine the class.
					const transitionType = determineTransitionType(navigation.lastSuccessfulEntry, navigation.currentEntry);

					// Update the DOM … with a View Transition
					const t = document.startViewTransition({
						update,
						types: [transitionType],
					});
				}
			}
		});
	});

	// Helper function to determine if a navigation should be intercepted or not
	// @src https://developer.chrome.com/docs/web-platform/navigation-api/#deciding_how_to_handle_a_navigation
	const shouldNotIntercept = (navigationEvent) => {
		return (
			!navigationEvent.canIntercept ||
			// If this is just a hashChange,
			// just let the browser handle scrolling to the content.
			navigationEvent.hashChange ||
			// If this is a download,
			// let the browser perform the download.
			navigationEvent.downloadRequest ||
			// If this is a form submission,
			// let that go to the server.
			navigationEvent.formData
		);
	};
}


// Determine the View Transition class to use based on the old and new navigation entries
// Also take the navigateEvent into account to detect UA back/forward navigations
// @TODO: Check for dead code paths now that reload is triggered manually
const determineTransitionType = (oldNavigationEntry, newNavigationEntry) => {
	if (!oldNavigationEntry || !newNavigationEntry) {
		return 'unknown';
	}

	const currentURL = new URL(oldNavigationEntry.url);
	const destinationURL = new URL(newNavigationEntry.url);

	const currentPathname = currentURL.pathname.replace(basePath, '');
	const destinationPathname = destinationURL.pathname.replace(basePath, '');

	if (currentPathname === destinationPathname) {
		return "reload";
	} else {
		let currentPageIndex = currentPathname.replace('/index', '').replace('/', '').replace('.html', '');
		let destinationPageIndex = destinationPathname.replace('/index', '').replace('/', '').replace('.html', '');

		// The first page has no number in its path
		currentPageIndex = currentPageIndex ? parseInt(currentPageIndex) : 1;
		destinationPageIndex = destinationPageIndex ? parseInt(destinationPageIndex) : 1;

		if (currentPageIndex > destinationPageIndex) {
			return 'backwards';
		}
		if (currentPageIndex < destinationPageIndex) {
			return 'forwards';
		}

		return 'unknown';
	}
};
