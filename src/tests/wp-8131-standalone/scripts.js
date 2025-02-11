const setTemporaryViewTransitionNames = async ( entries, vtPromise ) => {
	for ( const [ element, name ] of entries ) {
		if ( ! element ) {
			continue;
		}
		element.style.viewTransitionName = name;
	}

	await vtPromise;

	for ( const [ element, _ ] of entries ) {
		if ( ! element ) {
			continue;
		}
		element.style.viewTransitionName = '';
	}
};

const getParentElement = ($el, selector) => {
	return $el.closest(selector);
}

window.addEventListener('pageswap', async (e) => {
	if (e.viewTransition) {
		const articleLink = document.querySelector( 'article.post a[href="' + (new URL(e.activation.entry.url)).pathname + '"]' );
		if ( ! articleLink ) {
			return;
		}

		const article = getParentElement( articleLink, 'article.post' );

		setTemporaryViewTransitionNames( [
			[ article.querySelector( '.entry-title' ), 'post-title' ],
			[ article.querySelector( '.post-thumbnail' ), 'post-thumbnail' ],
		], e.viewTransition.finished );
	}
});

window.addEventListener( 'pagereveal', ( e ) => {
	if ( ! window.navigation.activation.from ) {
		return;
	}

	if ( e.viewTransition ) {
		const article = document.querySelectorAll( 'article.post' );
		if ( article.length !== 1 ) {
			return;
		}

		setTemporaryViewTransitionNames( [
			[ article[ 0 ].querySelector( '.entry-title' ), 'post-title' ],
			[ article[ 0 ].querySelector( '.post-thumbnail' ), 'post-thumbnail' ],
		], e.viewTransition.ready );
	}
} );
