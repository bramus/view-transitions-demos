// Path where this app is deployed. Because we don’t deploy at the root of the domain
// we need to keep track of this and adjust any URL matching using this value.
const basePath = '/profiles/mpa';

const homePagePattern = new URLPattern(`${basePath}/`, window.origin);
const profilePagePattern = new URLPattern(`${basePath}/:profile`, window.origin);

// When going to a detail page, set `profile-name` and `profile-avatar` vt-names
// on the elements that link to that detail page
window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		const url = new URL(e.activation.entry.url);

		// Only transition to same basePath
		// ~> SKIP!
		if (!url.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Extract name from URL
		const match = profilePagePattern.exec(url);
		const profile = match?.pathname.groups.profile;

		// No name extract = not going to a detail page
		// ~> Don’t tweak VT
		if (!profile) return;

		// Set VT-names on clicked name
		document.querySelector(`#${profile} span`).style.viewTransitionName = 'profile-name';
		document.querySelector(`#${profile} img`).style.viewTransitionName = 'profile-avatar';

		// Remove VT-names from currently shown ones when already at a detail page
		if (profilePagePattern.test(window.location.href)) {
			document.querySelector(`main h1`).style.viewTransitionName = 'none';
			document.querySelector(`main img`).style.viewTransitionName = 'none';
		}

		// Restore orig VT names after snapshots have been taken
		// (This to deal with BFCache)
		await e.viewTransition.finished;
		document.querySelector(`#${profile} span`).style.viewTransitionName = 'none';
		document.querySelector(`#${profile} img`).style.viewTransitionName = 'none';
		if (profilePagePattern.test(window.location.href)) {
			document.querySelector(`main h1`).style.viewTransitionName = 'profile-name';
			document.querySelector(`main img`).style.viewTransitionName = 'profile-avatar';
		}
	}
});

// When going from a detail page to the homepage, set `profile-name` and `profile-avatar` vt-names
// on the list item for the profile that was viewed on the detail page.
window.addEventListener('pagereveal', async (e) => {

	if (!navigation.activation.from) return;

	if (e.viewTransition) {
		const fromURL = new URL(navigation.activation.from.url);
		const currentURL = new URL(navigation.activation.entry.url);

		// Only transition to/from same basePath
		// ~> SKIP!
		if (!fromURL.pathname.startsWith(basePath)) {
			e.viewTransition.skipTransition();
		}

		// Went from profile page to homepage
		// ~> Set VT names on the relevant list item
		if (profilePagePattern.test(fromURL) && homePagePattern.test(currentURL)) {
			const match = profilePagePattern.exec(fromURL);
			const profile = match?.pathname.groups.profile;

			document.querySelector(`#${profile} span`).style.viewTransitionName = 'profile-name';
			document.querySelector(`#${profile} img`).style.viewTransitionName = 'profile-avatar';

			// Clean up after snapshots have been taken
			await e.viewTransition.ready;
			document.querySelector(`#${profile} span`).style.viewTransitionName = '';
			document.querySelector(`#${profile} img`).style.viewTransitionName = '';
		}
	}
});
