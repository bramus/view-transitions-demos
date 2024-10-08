// URLPattern Polyfill
if (!globalThis.URLPattern) {
	const URLPatternPolyfill = await import("https://esm.sh/urlpattern-polyfill");
	globalThis.URLPattern = URLPatternPolyfill.URLPattern;
}

// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/profiles/mpa';

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

const homePagePattern = new URLPattern(`${basePath}(/)*`, window.origin);
const isHomePage = (url) => {
	return homePagePattern.exec(url);
}

const profilePagePattern = new URLPattern(`${basePath}/:profile`, window.origin);
const isProfilePage = (url) => {
	return profilePagePattern.exec(url);
}

const extractProfileNameFromUrl = (url) => {
	const match = profilePagePattern.exec(url);
	return match?.pathname.groups.profile;
}

const setTemporaryViewTransitionNames = async (entries, vtPromise) => {
	for (const [$el, name] of entries) {
		$el.style.viewTransitionName = name;
	}

	await vtPromise;

	for (const [$el, name] of entries) {
		$el.style.viewTransitionName = '';
	}

}

// When going to a detail page, set `profile-name` and `profile-avatar` vt-names
// on the elements that link to that detail page
window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		const currentUrl = e.activation.from?.url ? new URL(e.activation.from.url.replace('.html', '')) : null;
		const targetUrl = new URL(e.activation.entry.url.replace('.html', ''));

		// Only transition to same basePath
		// ~> SKIP!
		if (!targetUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Going from profile page to homepage
		// ~> The big img and title are the ones!
		if (isProfilePage(currentUrl) && isHomePage(targetUrl)) {
			setTemporaryViewTransitionNames([
				[document.querySelector(`#detail main h1`), 'name'],
				[document.querySelector(`#detail main img`), 'avatar'],
			], e.viewTransition.finished);
		}

        // Going to profile page
		// ~> The clicked items are the ones!
        if (isProfilePage(targetUrl)) {
            const profile = extractProfileNameFromUrl(targetUrl);

			setTemporaryViewTransitionNames([
				[document.querySelector(`#${profile} span`), 'name'],
				[document.querySelector(`#${profile} img`), 'avatar'],
			], e.viewTransition.finished);
        }
	}
});

// When going from a detail page to the homepage, set `profile-name` and `profile-avatar` vt-names
// on the list item for the profile that was viewed on the detail page.
window.addEventListener('pagereveal', async (e) => {

	if (!navigation.activation.from) return;

	if (e.viewTransition) {
		const fromUrl = new URL(navigation.activation.from.url.replace('.html', ''));
		const currentUrl = new URL(navigation.activation.entry.url.replace('.html', ''));

		// Only transition to/from same basePath
		// ~> SKIP!
		if (!fromUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Went from profile page to homepage
		// ~> Set VT names on the relevant list item
		if (isProfilePage(fromUrl) && isHomePage(currentUrl)) {
			const profile = extractProfileNameFromUrl(fromUrl);

			setTemporaryViewTransitionNames([
				[document.querySelector(`#${profile} span`), 'name'],
				[document.querySelector(`#${profile} img`), 'avatar'],
			], e.viewTransition.ready);
		}

		// Went to profile page
		// ~> Set VT names on the main title and image
		if (isProfilePage(currentUrl)) {
			setTemporaryViewTransitionNames([
				[document.querySelector(`#detail main h1`), 'name'],
				[document.querySelector(`#detail main img`), 'avatar'],
			], e.viewTransition.ready);
		}
	}
});
