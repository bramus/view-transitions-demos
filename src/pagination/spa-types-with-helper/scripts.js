import { clamp, createElement, generatePagination, transitionHelper } from './../shared/util.js';

// Make sure browser has support
document.addEventListener("DOMContentLoaded", (e) => {
	let shouldThrow = false;

	if (document.startViewTransition && !("types" in ViewTransition.prototype)) {
		document.querySelector('.warning[data-reason="view-transition-types"]').style.display = "block";
		shouldThrow = true;
	}

	if (shouldThrow) {
		// Throwing here, to prevent the rest of the code from getting executed
		// If only JS (in the browser) had something like process.exit().
		throw new Error('Browser is lacking support …');
	}
});

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
		const t = transitionHelper({
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
	}
});
