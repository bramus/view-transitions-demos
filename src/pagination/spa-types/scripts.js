import { clamp, createElement, generatePagination } from './../shared/util.js';

// Config
const numPages = 4;
let currentPageIndex = clamp(parseInt(new URL(window.location.href).searchParams.get('p') ?? 1), 1, numPages);

// Write pagination on load
document.querySelector('#app').appendChild(generatePagination(
	currentPageIndex,
	numPages,
	new URL(window.location.href).pathname
));

// Handle Pagination clicks
document.querySelector('#app').addEventListener('click', async e => {
	if (e.target.tagName == 'A') {
		// Extract Destination Page Index
		const destinationPageIndex = parseInt(new URL(e.target.href).searchParams.get('p'));

		// Determine direction
		let direction = 'unknown';
		if (currentPageIndex > destinationPageIndex) {
			direction = 'backwards';
		}
		if (currentPageIndex < destinationPageIndex) {
			direction = 'forwards';
		}

		// Prevent navigation
		e.preventDefault();

		// Inject new Pagination using a VT
		try {
			const t = document.startViewTransition({
				update: () => {
					document.querySelector('#app').innerText = '';
					document.querySelector('#app').appendChild(generatePagination(
						destinationPageIndex,
						numPages,
						new URL(window.location.href).pathname
					));
				},
				types: [direction],
			});

			// Update currentPageIndex to new value for next calculation
			await t.ready;
			currentPageIndex = destinationPageIndex;
		} catch (e) {
			document.querySelector('#app').innerText = '';
			document.querySelector('#app').appendChild(createElement('div', {
				children: [
					createElement('p', { innerText: '⚠️ This demo needs the ViewTransitionTypes runtime flag. '}),
					createElement('p', { innerText: 'Launch Chrome as follows: '}),
					createElement('pre', {
						innerText: '/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --flag-switches-begin --enable-experimental-web-platform --enable-features=ViewTransitionOnNavigation,PageSwapEvent,ViewTransitionTypes --flag-switches-end',
						style: 'box-sizing: border-box; word-break: break-word; white-space: normal;'
					}),
				],
				style: 'width: 80vw;',
			}));
		}
	}
});
