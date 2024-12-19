function shuffleElements($container) {
	const elements = Array.from($container.children);

	// Shuffle the elements randomly
	for (let i = elements.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[elements[i], elements[j]] = [elements[j], elements[i]];
	}

	// Append the shuffled elements back into the $container
	elements.forEach(element => $container.appendChild(element));

	// Note: Because we reshuffle by removing + reinserting,
	// you can’t rely on auto naming. Alternatively you could
	// change the css to use flex layout and alter the `order`
	// property of each li
}

document.querySelector('button').addEventListener('click', (e) => {
	const $container = document.querySelector('ul');

	if (!document.startViewTransition) {
		shuffleElements($container);
		return;
	}

	document.startViewTransition(() => {
		shuffleElements($container);
	});
});

// Disable checkbox if no support
if (!CSS.supports('view-transition-group: contain')) {
	document.querySelector('#nested').setAttribute('disabled', '');
}
