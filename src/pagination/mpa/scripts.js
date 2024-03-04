// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/pagination/mpa';

window.addEventListener("pageswap", async (e) => {
	if (e.viewTransition) {

		// @TODO: If destination does not start with basePath, abort the VT

		const transitionClass = determineTransitionClass(e.activation.from, e.activation.entry);
		e.viewTransition.class = transitionClass;
	}
});


// Determine the View Transition class to use based on the old and new navigation entries
// Also take the navigateEvent into account to detect UA back/forward navigations
// @TODO: Check for dead code paths now that reload is triggered manually
const determineTransitionClass = (oldNavigationEntry, newNavigationEntry) => {
	const currentURL = new URL(oldNavigationEntry.url);
	const destinationURL = new URL(newNavigationEntry.url);

	const currentPathname = currentURL.pathname.replace(basePath, '');
	const destinationPathname = destinationURL.pathname.replace(basePath, '');

	if (currentPathname === destinationPathname) {
		return "reload";
	} else {
		let currentPageIndex = currentPathname.replace('/index', '').replace('.html', '');
		let destinationPageIndex = destinationPathname.replace('/index', '').replace('.html', '');

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
