// URLPattern Polyfill
if (!globalThis.URLPattern) {
	const URLPatternPolyfill = await import("https://esm.sh/urlpattern-polyfill");
	globalThis.URLPattern = URLPatternPolyfill.URLPattern;
}

// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/off-the-beaten-path/mpa';

// Make sure browser has support
(() => {
	let shouldThrow = false;

	if (!window.navigation) {
		document.querySelector('.warning[data-reason="navigation-api"]').style.display = "block";
		shouldThrow = true;
	}

	if (!("CSSViewTransitionRule" in window)) {
		document.querySelector('.warning[data-reason="cross-document-view-transitions"]').style.display = "block";
		shouldThrow = true;
	}

	if (shouldThrow) {
		// Throwing here, to prevent the rest of the code from getting executed
		// If only JS (in the browser) had something like process.exit().
		throw new Error('Browser is lacking support …');
	}
})();

const overviewPagePattern = new URLPattern(`${basePath}(/)(index.html)*`, window.origin);
const isOverviewPage = (url) => {
	return overviewPagePattern.exec(url);
}

const detailPagePattern = new URLPattern(`${basePath}/detail:num.html`, window.origin);
const isDetailPage = (url) => {
	return detailPagePattern.exec(url);
}

// PageSwap:
// - To Overview: Make sure the correct thubmnail has the view-transition name objects
// - To Detail / Overview: Make sure the correct type is set
window.addEventListener('pageswap', async (e) => {
	// There is an automatic viewTransition, so the user comes from the same origin
	if (e.viewTransition) {
		// Where did we come from and where are we going to?
		const currentUrl = e.activation.from?.url ? new URL(e.activation.from.url) : null;
		const targetUrl = new URL(e.activation.entry.url);

		// Only transition to same basePath
		// ~> SKIP!
		if (!targetUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Going from overview page to detail page
		// ~> Set the type to “to-detail”
		// ~> Apply `.last-clicked` on the correct thumbnail so that the CSS can kick in
		if (isOverviewPage(currentUrl) && isDetailPage(targetUrl)) {
			// Set the proper view-transition-type
			e.viewTransition.types.add('to-detail');

			// Transform full path URL to only the filename
			const filename = targetUrl.pathname.replace(`${basePath}/`, '');

			// Find and manipulate the thumbnail
			const $link = document.querySelector(`.offer a[href="${filename}"]`);
			$link.classList.add('last-clicked');

			// Clean up afterwards
			await e.viewTransition.finished;
			$link.classList.remove('last-clicked');

			return;
		}

		// TODO: Going from detail page to overview
		// ~> Set the type to “to-overview
		if (isDetailPage(currentUrl) && isOverviewPage(targetUrl)) {
			e.viewTransition.types.add('to-overview');
			return;
		}
	}
});

// PageReveal
// - To Detail / Overview: Make sure the correct type is set
// - To Detail: Make sure the correct thubmnail has the view-transition name objects
window.addEventListener('pagereveal', async (e) => {

	// We need Navigation Activation Information
	if (!navigation.activation.from) return;

	// There is an automatic viewTransition, so the user comes from the same origin
	if (e.viewTransition) {

		// Where did we come from and where are we going to?
		const fromUrl = new URL(navigation.activation.from.url);
		const currentUrl = new URL(navigation.activation.entry.url);

		// Only transition to/from same basePath
		// ~> SKIP!
		if (!fromUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Going from overview page to detail page
		// ~> Set the type to “to-detail”
		if (isOverviewPage(fromUrl) && isDetailPage(currentUrl)) {
			e.viewTransition.types.add('to-detail');
			return;
		}

		// Going from overview page to detail page
		// ~> Set the type to “to-overview”
		// ~> Apply `.last-clicked` on the correct thumbnail so that the CSS can kick in
		if (isDetailPage(fromUrl) && isOverviewPage(currentUrl)) {
			// Set the proper view-transition-type
			e.viewTransition.types.add('to-overview');

			// Transform full path URL to only the filename
			const filename = fromUrl.pathname.replace(`${basePath}/`, '');

			// Find and manipulate the thumbnail
			const $link = document.querySelector(`.offer a[href="${filename}"]`);
			$link.classList.add('last-clicked');

			// Clean up afterwards
			await e.viewTransition.ready;
			$link.classList.remove('last-clicked');

			return;
		}
	}

	// User comes from different origin or did a reload
	else {

		// Do a reload animation
		if (navigation.activation.navigationType == 'reload') {
			const t = document.startViewTransition({
				update: () => {
					// NOOP
				},
				types: ['reload'],
			});
		}

		// @TODO: manually create a “welcome” viewTransition here?
	}

});
