// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/stack-navigator/mpa-to-spa';

// Keep track of the last fully completed NavigationEntry as `lastCompletedEntry`
// We’re gonna need this because we can’t entirely rely on currentEntry
// when intercepting. See next comment for more info.
navigation.lastCompletedEntry = navigation?.currentEntry;

// Update the lastCompletedEntry value only *after* a navigation has
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
// so they perceive it as going form index to index.
//
// Same should happen to the View Transition: transition between index and
// index, not between detail and index.
navigation.addEventListener('navigatesuccess', e => {
	navigation.lastCompletedEntry = e.currentTarget.currentEntry;
});

// Convert all UI back links to a UA back.
// Using the info field, we signal that the UI back button was used.
//
// If there is no previous navigation entry to go to
// (e.g. user went directly to detail), then redirect to index.html
document.addEventListener('click', (e) => {
	if (e.target.matches('a.back')) {
		e.preventDefault();

		if (navigation.canGoBack) {
			navigation.back({
				info: {
					isUIBackButton: true,
				},
			});
		} else {
			navigation.navigate(`${basePath}/`);
		}
	}
});

// Turn our MPA into an SPA … WOOHOOW!
navigation.addEventListener("navigate", (e) => {
	// Don’t intercept when we shouldn’t
	if (shouldNotIntercept(e)) {
		return;
	}

	e.intercept({
		// Since we don’t scroll the rootscroller, scroll restoration will never work.
		// Because of that we can safely disable scroll restoration alltogether
		scroll: 'manual',

		handler: async () => {

			// @TODO: show loading while fetch is running …

			// @TODO: Maybe I should move this whole fetch logic to the outside of e.intercept?
			// Because on slow connections you end up with an updated URL but with the old content still visible …

			// Manual Scroll Restoration: Store scrollOffset of current view
			const $currentView = document.querySelector('.view');
			localStorage.setItem(`view-${$currentView.getAttribute('id')}-scrollTop`, $currentView.scrollTop);
			localStorage.setItem(`view-${$currentView.getAttribute('id')}-scrollLeft`, $currentView.scrollLeft);

			// Get new HTML
			const response = await fetch(e.destination.url, {
				signal: e.signal, // @ref https://developer.chrome.com/docs/web-platform/navigation-api/#abort_signals
			});
			const html = await response.text();
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");
			const $body = doc.querySelector("body");
			const $title = doc.querySelector("head title");

			// Push or Pop? Before we swap the markup, determine which animation to use for the View Transition
			// @note: we can only do this detection here inside intercept as we need the new currentEntry to compare the old one to
			const transitionClass = determineTransitionClass(navigation.lastCompletedEntry, navigation.currentEntry, e);
			document.documentElement.dataset.transition = transitionClass;

			// Update the DOM … with a View Transition
			const t = document.startViewTransition(() => {
				document.title = $title.innerText;
				document.body.replaceWith($body); // You do trust your own markup, right?
			});

			// Manual Scroll Restoration: Restore scrollOffset on new View (but only for certain views)
			await t.updateCallbackDone;
			const $destinationView = document.querySelector('.view');
			if ((document.documentElement.dataset.transition != 'reload') && ['home'].includes($destinationView.getAttribute('id'))) {
				$destinationView.scrollTop = localStorage.getItem(`view-${$destinationView.getAttribute('id')}-scrollTop`) ?? 0;
				$destinationView.scrollLeft = localStorage.getItem(`view-${$destinationView.getAttribute('id')}-scrollLeft`) ?? 0;
			}

			// Clean up
			await t.finished;
			delete document.documentElement.dataset.transition;
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
const determineTransitionClass = (oldNavigationEntry, newNavigationEntry, navigateEvent) => {
	const currentURL = new URL(oldNavigationEntry.url);
	const destinationURL = new URL(newNavigationEntry.url);

	const currentPathname = currentURL.pathname.replace(basePath, '').replace("/index.html", "/");
	const destinationPathname = destinationURL.pathname.replace(basePath, '').replace("/index.html", "/");

	console.log(currentPathname);
	console.log(destinationPathname);

	if (currentPathname === destinationPathname) {
		return "reload";
	} else if (currentPathname === "/" && destinationPathname.startsWith('/detail')) {
		return "push";
	} else if (currentPathname.startsWith('/detail') && destinationPathname === "/") {
		return "pop";
	} else if (currentPathname.startsWith('/detail') && destinationPathname.startsWith('/detail')) {
		if (isUIBackButton(navigateEvent) || isUABackButton(oldNavigationEntry, newNavigationEntry, navigateEvent)) {
			return "pop";
		} else {
			return "push";
		}
	} else {
		console.warn('Unmatched Route Handling!');
		console.log({
			currentPathname,
			destinationPathname,
		});
		return "none";
	}
};

// Determine if the UI back button was used
const isUIBackButton = (navigateEvent) => {
	return navigateEvent.info?.isUIBackButton === true;
};

// Determine if the UA back button was used to navigate
const isUABackButton = (oldNavigationEntry, newNavigationEntry, navigateEvent) => {
	if (navigateEvent.navigationType !== 'traverse') return false;
	return (newNavigationEntry.index < oldNavigationEntry.index);
};

// Determine if the UA forward button was used to navigate
const isUAForwardButton = (oldNavigationEntry, newNavigationEntry, navigateEvent) => {
	if (navigateEvent.navigationType !== 'traverse') return false;
	return (newNavigationEntry.index > oldNavigationEntry.index);
};

// Do a reload View Transition when pressing UA reload
const navigationEntry = window.performance.getEntriesByType("navigation")[0];
if (navigationEntry.type === "reload") {
	(async () => {
		document.documentElement.dataset.transition = "reload";

		const t = document.startViewTransition(() => {
			// NOOP
		});

		try {
			await t.finished;
			delete document.documentElement.dataset.transition;
		} catch (e) {
			console.log(e);
		}
	})();
}
