document.querySelector('.cards').addEventListener('click', e => {
	if (e.target.classList.contains('delete-btn')) {

		if (!document.startViewTransition) {
			e.target.parentElement.remove();
			return;
		}

		e.target.parentElement.id= 'targeted-card';
		document.startViewTransition(() => {
			e.target.parentElement.remove();
		});
	}
})

document.querySelector('.add-btn').addEventListener('click', async (e) => {
	const template = document.getElementById('card');

	const $newCard = template.content.cloneNode(true);
	$newCard.firstElementChild.style.backgroundColor = `#${ Math.floor(Math.random()*16777215).toString(16)}`;

	if (!document.startViewTransition) {
		document.querySelector('.cards').appendChild($newCard);
		return;
	}

	$newCard.firstElementChild.id= 'targeted-card';
	try {
		const transition = document.startViewTransition(() => {
			document.querySelector('.cards').appendChild($newCard);
		});

		await transition.ready;
	} finally {
		document.querySelector('.cards .card[id]').removeAttribute('id');
	}
});
