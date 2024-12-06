let $lastClickedThumbnail = null;

const showDetail = ($link) => {
	const update = () => {
		const title = $link.querySelector('h2').innerHTML;
		const background = getComputedStyle($link).getPropertyValue('background-image');

		document.querySelector('#detail h1').innerHTML = title;
		document.querySelector('#detail .hero').style.backgroundImage = background;

		document.querySelector('#overview').classList.remove('visible');
		document.querySelector('#detail').classList.add('visible');
	};

	if (!document.startViewTransition) {
		update();
		return;
	}

	$link.classList.add('last-clicked');
	const t = document.startViewTransition({
		update,
		types: ['to-detail'],
	});
};

const showOverview = async () => {
	const update = () => {
		document.querySelector('#overview').classList.add('visible');
		document.querySelector('#detail').classList.remove('visible');
	};

	if (!document.startViewTransition) {
		update();
		return;
	}

	const t = document.startViewTransition({
		update,
		types: ['to-overview'],
	});

	await t.ready;
	document.querySelector('.last-clicked')?.classList.remove('last-clicked');
};

document.querySelectorAll('.offer a').forEach($link => {
	$link.addEventListener('click', (e) => {
		showDetail($link);
	});
});

document.querySelectorAll('.back').forEach($backLink => {
	$backLink.addEventListener('click', (e) => {
		showOverview();
	});
});
