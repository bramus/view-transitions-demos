// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/pagination/navigation-api';

// Make sure browser has support
if (!window.navigation || !window.performance) {
	document.addEventListener("DOMContentLoaded", (e) => {
		document.querySelector('.warning[data-reason="navigation-api"]').style.display = "block";
	});

	// Throwing here, to prevent the rest of the code from getting executed
	// If only JS (in the browser) had something like process.exit().
	throw new Error('Browser is lacking support …');
}

// Keep track of the last fully completed NavigationEntry as `lastSuccessfulEntry`
// We’re gonna need this because we can’t entirely rely on currentEntry
// when intercepting. See next comment for more info.
navigation.lastSuccessfulEntry = navigation?.currentEntry;

// Update the lastSuccessfulEntry value only *after* a navigation has
// fully completed. This to cater for race conditions on slow connections.
//
// Consider this scenario:
// You are on index.html and click a link to detail.html, but then
// immediately click the home icon to go to index.html again.
//
// According to the Navigation API you went from index to detail and then
// from detail back to index.
//
// UX wise you didn’t though: the visitor never saw the detail page,
// so they perceive it as going from index to index.
//
// Same should happen to the View Transition: transition between index and
// index, not between detail and index.
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

// Determine the View Transition class to use based on the old and new navigation entries
// Also take the navigateEvent into account to detect UA back/forward navigations
// @TODO: Check for dead code paths now that reload is triggered manually
const determineTransitionType = (oldNavigationEntry, newNavigationEntry) => {
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
