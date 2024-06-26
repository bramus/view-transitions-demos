// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/pagination/mpa';

// Note: determining the types is typically needed only on the new page (thus: in `pageswap`)
// However, because we set the `view-transition-names` based on the types (see `mpa.css`)
// we also determine it on the outgoing page.
window.addEventListener("pageswap", async (e) => {
	if (e.viewTransition) {

		// @TODO: If destination does not start with basePath, abort the VT

		const transitionType = determineTransitionType(e.activation.from, e.activation.entry);
		console.log(`pageSwap: ${transitionType}`);
		e.viewTransition.types.add(transitionType);
	}
});

window.addEventListener("pagereveal", async (e) => {
	if (e.viewTransition) {

		// @TODO: If destination does not start with basePath, abort the VT

		const transitionType = determineTransitionType(navigation.activation.from, navigation.activation.entry);
		console.log(`pageReveal: ${transitionType}`);
		e.viewTransition.types.add(transitionType);
	}
});


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
