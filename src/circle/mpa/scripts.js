// Utilities
const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomColor = () => randomInteger(0, 16777215).toString(16);

// Store the last click event
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

//
window.addEventListener('pagereveal', async event => {
	if (!event.viewTransition) return;

	// Set random BG color
	document.documentElement.style.backgroundColor = `#${randomColor()}`;

	// Get the click position, or fallback to a random position in the viewport
	const x = sessionStorage.getItem('lastClickX') ?? randomInteger(0, window.innerWidth);
	const y = sessionStorage.getItem('lastClickY') ?? randomInteger(0, window.innerHeight);

	// Make sure dot is at correct position
	if (sessionStorage.getItem('lastClickX')) {
		startingPointMarker.style.left = `${x}px`;
		startingPointMarker.style.top = `${y}px`;
	}

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
