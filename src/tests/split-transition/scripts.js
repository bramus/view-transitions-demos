// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/tests/split-transition';

// Make sure browser has support
const hasNavigationAPIPrecommitHandlerSupport = ("NavigationPrecommitController" in window);

document.addEventListener("DOMContentLoaded", (e) => {
	let shouldThrow = false;

	if (!window.navigation) {
		document.querySelector('.warning[data-reason="navigation-api"]').style.display = "block";
		shouldThrow = true;
	}

	if (!hasNavigationAPIPrecommitHandlerSupport) {
		document.querySelector('.warning[data-reason="navigation-api-deferred-commit"]').style.display = "block";
		shouldThrow = true;
	}

	if (shouldThrow) {
		// Throwing here, to prevent the rest of the code from getting executed
		// If only JS (in the browser) had something like process.exit().
		throw new Error('Browser is lacking support …');
	}
});

// Convert all UI back links to a UA back.
//
// If there is no previous navigation entry to go to
// (e.g. user went directly to detail), then redirect to index.html
hasNavigationAPIPrecommitHandlerSupport && document.addEventListener('click', (e) => {
	if (e.target.matches('a.back')) {
		e.preventDefault();

		if (navigation.canGoBack) {
			navigation.back();
		} else {
			navigation.navigate(`${basePath}/`);
		}
	}
});

// The View Transitions
let outgoingViewTransition = null;
let incomingViewTransition = null;

// Data to show on a page
let pageData = null;

// Turn our MPA into an SPA … WOOHOOW!
hasNavigationAPIPrecommitHandlerSupport && navigation.addEventListener("navigate", (e) => {
	// Don’t intercept when we shouldn’t
	if (shouldNotIntercept(e)) {
		return;
	}

	// Determine to/from URLs
	const fromEntry = navigation.currentEntry;
	const toEntry = e.destination;

	console.log(`Navigating from ${fromEntry.url} to ${toEntry.url}`);

	e.intercept({
		precommitHandler: async () => {
			// Start outgoing View Transition
			outgoingViewTransition = document.startViewTransition({
				update: () => {
					// We retain the page having dipped to black by injecting an overlay onto the page
					// @TODO: Remove this once we have Transition.waitUntil
					document.documentElement.dataset.pendingTransition = 'true';
				},
				types: ['outgoing', 'fade-out'],
			});

			// @TODO: outgoingViewTransition.waitUntil(dataHasBeenFetched)

			// Get new HTML
			const response = await fetch(e.destination.url, {
				signal: e.signal, // @ref https://developer.chrome.com/docs/web-platform/navigation-api/#abort_signals
			});
			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");
			const $body = doc.querySelector("body");
			const $title = doc.querySelector("head title");

			// Update the DOM
			pageData = {
				title: $title.innerText,
				$body,
			};
		},

		handler: async () => {

			// Wait for outgoing View Transition to be finished first
			if (outgoingViewTransition) {
				await outgoingViewTransition.finished;
			}

			// Start incoming View Transition
			incomingViewTransition = document.startViewTransition({
				update: () => {
					// Remove overlay
					// @TODO: Remove this once we have Transition.waitUntil
					delete document.documentElement.dataset.pendingTransition;

					// Update page with fetched data
					document.title = pageData.title;
					document.body.replaceWith(pageData.$body);
				},
				types: ['incoming', 'fade-in'],
			});
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
