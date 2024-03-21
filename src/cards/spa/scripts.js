document.querySelector('.cards').addEventListener('click', e => {
	if (e.target.classList.contains('delete-btn')) {

		if (!document.startViewTransition) {
			e.target.parentElement.remove();
			return;
		}

		e.target.parentElement.style.viewTransitionName = 'targeted-card';
		document.startViewTransition(() => {
			e.target.parentElement.remove();
		});
	}
})

document.querySelector('.add-btn').addEventListener('click', async (e) => {
	const template = document.getElementById('card');

	const $newCard = template.content.cloneNode(true);

	if (!document.startViewTransition) {
		document.querySelector('.cards').appendChild($newCard);
		return;
	}

	$newCard.firstElementChild.style.viewTransitionName = 'targeted-card';
	$newCard.firstElementChild.style.backgroundColor = `#${ Math.floor(Math.random()*16777215).toString(16)}`;
	const transition = document.startViewTransition(() => {
		document.querySelector('.cards').appendChild($newCard);
	});

	await transition.finished;

	const rand = window.performance.now().toString().replace('.', '_') + Math.floor(Math.random() * 1000);
	document.querySelector('.cards .card:last-child').style.viewTransitionName = `card-${rand}`;

});
