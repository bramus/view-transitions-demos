// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/stack-navigator/mpa';

// Keep track of the last fully completed NavigationEntry as `lastCompletedEntry`
// We’re gonna need this later on to compare things to.
navigation.lastCompletedEntry = null;
try {
	navigation.lastCompletedEntry = JSON.parse(localStorage.getItem("lastCompletedNavigationEntry"));

	// Since we host multiple demos on this same domain, we need to filter out navigations from pages that don’t start with this project’s basePath
	if (!(new URL(navigation.lastCompletedEntry.url)).pathname.startsWith(basePath)) {
		navigation.lastCompletedEntry = null;
	}
} catch (e) {
	// NOOP
}

// Update the lastCompletedEntry value after page has loaded.
document.addEventListener("DOMContentLoaded", (e) => {
	const { id, index, key, sameDocument, url } = navigation.currentEntry;
	localStorage.setItem("lastCompletedNavigationEntry", JSON.stringify({ id, index, key, sameDocument, url }));
});

// Convert all UI back links to a UA back.
//
// If there is no previous navigation entry to go to
// (e.g. user went directly to detail), then redirect to index.html
document.addEventListener('click', (e) => {
	if (e.target.matches('a.back')) {
		e.preventDefault();

		if (navigation.canGoBack) {
			navigation.back();
		} else {
			navigation.navigate('/');
		}
	}
});


// MPA View Transitions!
window.addEventListener("pagereveal", async (e) => {

	// There is an automatic viewTransition, so the user comes from the same origin
	if (e.viewTransition) {

		if (!navigation.lastCompletedEntry) {
			e.viewTransition.skipTransition();
			return;
		}

		const transitionClass = determineTransitionClass(navigation.lastCompletedEntry, navigation.currentEntry);
		document.documentElement.dataset.transition = transitionClass;

		await e.viewTransition.finished;
		delete document.documentElement.dataset.transition;
	}

	// User comes from different origin
	else {
		// @TODO: manually create a “welcome” viewTransition here?
	}
});


// Determine the View Transition class to use based on the old and new navigation entries
// Also take the navigateEvent into account to detect UA back/forward navigations
const determineTransitionClass = (oldNavigationEntry, newNavigationEntry) => {
	const currentURL = new URL(oldNavigationEntry.url);
	const destinationURL = new URL(newNavigationEntry.url);

	const currentPathname = currentURL.pathname.replace(basePath, '').replace("/index.html", "/");
	const destinationPathname = destinationURL.pathname.replace(basePath, '').replace("/index.html", "/");

	if (currentPathname === destinationPathname) {
		return "reload";
	} else if (currentPathname === "/" && destinationPathname.startsWith('/detail')) {
		return "push";
	} else if (currentPathname.startsWith('/detail') && destinationPathname === "/") {
		return "pop";
	} else if (currentPathname.startsWith('/detail') && destinationPathname.startsWith('/detail')) {
		if (isUABackButton(oldNavigationEntry, newNavigationEntry)) {
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

// Determine if the UA back button was used to navigate
const isUABackButton = (oldNavigationEntry, newNavigationEntry) => {
	return (newNavigationEntry.index < oldNavigationEntry.index);
};

// Determine if the UA forward button was used to navigate
const isUAForwardButton = (oldNavigationEntry, newNavigationEntry) => {
	return (newNavigationEntry.index > oldNavigationEntry.index);
};
