// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/profiles/mpa';

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

// When going to a detail page, set `profile-name` and `profile-avatar` vt-names
// on the elements that link to that detail page
window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		const currentUrl = e.activation.from?.url ? new URL(e.activation.from.url) : null;
		const targetUrl = new URL(e.activation.entry.url);

		// Only transition to same basePath
		// ~> SKIP!
		if (!targetUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Going from profile page to homepage
		// ~> The big img and title are the ones!
		if (isProfilePage(currentUrl) && isHomePage(targetUrl)) {
			document.querySelector(`#detail main h1`).style.viewTransitionName = 'name';
            document.querySelector(`#detail main img`).style.viewTransitionName = 'avatar';

            // Remove view-transition-names after snapshots have been taken
            // (this to deal with BFCache)
            await e.viewTransition.finished;
            document.querySelector(`#detail main h1`).style.viewTransitionName = 'none';
            document.querySelector(`#detail main img`).style.viewTransitionName = 'none';
		}

        // Going to profile page
		// ~> The clicked items are the ones!
        if (isProfilePage(targetUrl)) {
            const profile = extractProfileNameFromUrl(targetUrl);

            // Set view-transition-name values on the clicked row
            document.querySelector(`#${profile} span`).style.viewTransitionName = 'name';
            document.querySelector(`#${profile} img`).style.viewTransitionName = 'avatar';

            // Remove view-transition-names after snapshots have been taken
            // (this to deal with BFCache)
            await e.viewTransition.finished;
            document.querySelector(`#${profile} span`).style.viewTransitionName = 'none';
            document.querySelector(`#${profile} img`).style.viewTransitionName = 'none';
        }
	}
});

// When going from a detail page to the homepage, set `profile-name` and `profile-avatar` vt-names
// on the list item for the profile that was viewed on the detail page.
window.addEventListener('pagereveal', async (e) => {

	if (!navigation.activation.from) return;

	if (e.viewTransition) {
		const fromUrl = new URL(navigation.activation.from.url);
		const currentUrl = new URL(navigation.activation.entry.url);

		// Only transition to/from same basePath
		// ~> SKIP!
		if (!fromUrl.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Went from profile page to homepage
		// ~> Set VT names on the relevant list item
		if (isProfilePage(fromUrl) && isHomePage(currentUrl)) {
			const profile = extractProfileNameFromUrl(fromUrl);

            // Set view-transition-name values on the elements in the list
            document.querySelector(`#${profile} span`).style.viewTransitionName = 'name';
            document.querySelector(`#${profile} img`).style.viewTransitionName = 'avatar';

			// Remove names after snapshots have been taken
			// so that we’re ready for the next navigation
			await e.viewTransition.ready;
			document.querySelector(`#${profile} span`).style.viewTransitionName = 'none';
			document.querySelector(`#${profile} img`).style.viewTransitionName = 'none';
		}

		// Went to profile page
		// ~> Set VT names on the main title and image
		if (isProfilePage(currentUrl)) {
            document.querySelector(`#detail main h1`).style.viewTransitionName = 'name';
            document.querySelector(`#detail main img`).style.viewTransitionName = 'avatar';

			// Remove names after snapshots have been taken
			// so that we’re ready for the next navigation
			await e.viewTransition.ready;
			document.querySelector(`#detail main h1`).style.viewTransitionName = 'none';
			document.querySelector(`#detail main img`).style.viewTransitionName = 'none';
		}
	}
});
