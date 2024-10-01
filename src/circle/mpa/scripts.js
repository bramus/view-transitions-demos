// Make sure browser has support
document.addEventListener("DOMContentLoaded", (e) => {
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
});

// Utilities
const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomColor = () => randomInteger(0, 16777215).toString(16);

// Determine some random values for further use
// These get cached to make sure the values remain the same when traversing history
const randomX = randomInteger(0, window.innerWidth);
const randomY = randomInteger(0, window.innerHeight);

// Store the last click event on every click
// Move the startingPointMarker to indicate it was stored
let lastClick;
document.addEventListener('click', (event) => {
	if (event.target.tagName.toLowerCase() === 'a') return;

	lastClick = event;

	startingPointMarker.style.left = `${event.clientX}px`;
	startingPointMarker.style.top = `${event.clientY}px`;
});

// Write position to storage before leaving page
window.addEventListener('pageswap', (event) => {
	if (event.viewTransition && lastClick) {
		sessionStorage.setItem('lastClickX', lastClick.clientX);
		sessionStorage.setItem('lastClickY', lastClick.clientY);
	}
});

// Set up a custom View Transition on pagereveal
window.addEventListener('pagereveal', async event => {
	if (!event.viewTransition) return;

	// Set random BG color and take over click position from storage upon navigation push
	if (navigation.activation.navigationType !== 'traverse') {
		document.documentElement.style.backgroundColor = `#${randomColor()}`;
		x = sessionStorage.getItem('lastClickX') ?? randomX;
		y = sessionStorage.getItem('lastClickY') ?? randomY;
	}

	// When traversing the history, take over the locally stored lastClick
	// The BG color already got changed
	else {
		x = lastClick?.clientX ?? randomX;
		y = lastClick?.clientY ?? randomY;
	}

	// Make sure dot is at correct position
	startingPointMarker.style.left = `${x}px`;
	startingPointMarker.style.top = `${y}px`;

	// Get the distance to the farthest corner
	const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

	await event.viewTransition.ready;

	// Animate the new document's view
	document.documentElement.animate(
	  {
		clipPath: [
		  `circle(0 at ${x}px ${y}px)`,
		  `circle(${endRadius}px at ${x}px ${y}px)`,
		],
	  },
	  {
		duration: 500,
		easing: 'ease-in',
		// Specify which pseudo-element to animate
		pseudoElement: '::view-transition-new(root)'
	  }
	);
  })
