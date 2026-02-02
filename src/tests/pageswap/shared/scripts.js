window.addEventListener('pageswap', (e) => {
	console.log('pageswap');
	window.sessionStorage.setItem('when', +(new Date()))
});

window.addEventListener('pagereveal', (e) => {
	if (document.querySelector('output')) {
		document.querySelector('output').innerText = window.sessionStorage.getItem('when') ?? '<unknown>';
	}
	console.log('pagereveal');
	window.sessionStorage.removeItem('when');
});
