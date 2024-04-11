// Utilities
const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomColor = () => randomInteger(0, 16777215).toString(16);

// Store the last click event
let lastClick;
document.addEventListener('click', (event) => {
	lastClick = event;

	startingPointMarker.style.left = `${event.clientX}px`;
	startingPointMarker.style.top = `${event.clientY}px`;
});

const changeView = () => {
	document.documentElement.style.backgroundColor = `#${randomColor()}`;
	if (thisView.innerText === '1') {
		thisView.innerText = 2;
		nextView.innerText = 1;
	} else {
		thisView.innerText = 1;
		nextView.innerText = 2;
	}
}

document.querySelector('a').addEventListener('click', (e) => {
	e.stopPropagation();
	e.preventDefault();

	// Fallback for browsers that don’t support this API:
	if (!document.startViewTransition) {
		changeView();
		return;
	}

	// Get the click position, or fallback to a random position in the viewport
	const x = lastClick?.clientX ?? randomInteger(0, window.innerWidth);
	const y = lastClick?.clientY ?? randomInteger(0, window.innerHeight);

	// Get the distance to the farthest corner
	const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

	// Create a transition
	const transition = document.startViewTransition(() => {
		changeView();
	});

	// Wait for the pseudo-elements to be created
	transition.ready.then(() => {
		// Animate the root’s new view
		document.documentElement.animate(
			{
				clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
			},
			{
				duration: 500,
				easing: 'ease-in',
				// Specify which pseudo-element to animate
				pseudoElement: '::view-transition-new(root)',
			},
		);
	});
});
