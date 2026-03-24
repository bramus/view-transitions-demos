const randomBetween = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

// Filter
const applyFilter = ({ season = null, type = null }) => {
	const $entries = document.querySelector('#entries');
	if (!season) {
		$entries.removeAttribute('data-filter-season');
	} else {
		$entries.setAttribute('data-filter-season', season);
	}

	if (!type) {
		$entries.removeAttribute('data-filter-type');
	} else {
		$entries.setAttribute('data-filter-type', type);
	}
};

const fetchWeatherData = async (season) => {
	if (!season) {
		return null;
	}

	await new Promise(r => setTimeout(r, randomBetween(500, 1500)));
	return {
		low: randomBetween(35, 60),
		high: randomBetween(65, 90),
	};
};

const createWeatherMarkup = (weatherData) => {
	const $ul = document.createElement('ul');
	$ul.classList.add('weather');

	const $liMin = document.createElement('li');
	$liMin.innerText = `Low: ${weatherData.low}`;

	const $liMax = document.createElement('li');
	$liMax.innerText = `High: ${weatherData.high}`;

	$ul.appendChild($liMin);
	$ul.appendChild($liMax);

	return $ul;
};

const setWeatherData = (weatherData) => {
	const $sidebar = document.querySelector('#sidebar');
	const $sidebarWeatherSlot = document.querySelector('#sidebar .weather');

	if ($sidebarWeatherSlot.hasChildNodes()) {
		$sidebarWeatherSlot.removeChild($sidebarWeatherSlot.firstChild);
	}

	if (weatherData) {
		$sidebarWeatherSlot.appendChild(createWeatherMarkup(weatherData));
	}
};

let selectedSeason = null;
let selectedType = null;

document.querySelector('select[name=seasons]').addEventListener('change', async (e) => {
	selectedSeason = e.target.value || null;

	const $list = document.querySelector('#entries');
	const $sidebar = document.querySelector('#sidebar');

	if ("startViewTransition" in Element.prototype) {
		$list.startViewTransition(() => {
			applyFilter({ season: selectedSeason, type: selectedType });
		});
	} else {
		applyFilter({ season: selectedSeason, type: selectedType });
	}

	// Loading
	if (selectedSeason) {
		const loadingData = { low: 'Loading…', high: 'Loading…' };
		if ("startViewTransition" in Element.prototype) {
			$sidebar.startViewTransition(() => {
				setWeatherData(loadingData);
			});
		} else {
			setWeatherData(loadingData);
		}
	}

	const weatherData = await fetchWeatherData(selectedSeason);
	if ("startViewTransition" in Element.prototype) {
		$sidebar.startViewTransition(() => {
			setWeatherData(weatherData);
		});
	} else {
		setWeatherData(weatherData);
	}
});

document.querySelector('select[name=types]').addEventListener('change', async (e) => {
	selectedType = e.target.value || null;

	const $list = document.querySelector('#entries');

	if ("startViewTransition" in Element.prototype) {
		$list.startViewTransition(() => {
			applyFilter({ season: selectedSeason, type: selectedType });
		});
	} else {
		applyFilter({ season: selectedSeason, type: selectedType });
	}
});

// Selection
document.querySelectorAll('.entry button').forEach($button => {
	$button.addEventListener('click', (e) => {
		const $entry = $button.closest('.entry');

		const { title, photo, duration } = $entry.dataset;
		const id = $entry.getAttribute('id');

		if ($entry.classList.contains('checked')) {
			// Toggle the checked state of the entry itself
			if ("startViewTransition" in Element.prototype) {
				$entry.startViewTransition(() => {
					$entry.classList.remove('checked');
				});
			} else {
				$entry.classList.remove('checked');
			}

			// Remove selected activity
			const $selectedEntry = document.querySelector(`#selected li[data-for="${id}"`);
			if ("startViewTransition" in Element.prototype) {
				document.querySelector('#sidebar').startViewTransition(() => {
					$selectedEntry?.remove();
				});
			} else {
				$selectedEntry?.remove();
			}
		} else {
			// Toggle the checked state of the entry itself
			if ("startViewTransition" in Element.prototype) {
				$entry.startViewTransition(() => {
					$entry.classList.add('checked');
				});
			} else {
				$entry.classList.add('checked');
			}

			// Add selected activity
			const $selectedEntry = document.createElement('li');
			$selectedEntry.dataset.for = id;

			const $selectedEntryImage = document.createElement('img');
			$selectedEntryImage.src = photo;
			$selectedEntryImage.width = 400;
			$selectedEntryImage.height = 200;

			const $selectedEntryTitle = document.createElement('span');
			$selectedEntryTitle.innerText = title;

			$selectedEntry.appendChild($selectedEntryImage);
			$selectedEntry.appendChild($selectedEntryTitle);

			if ("startViewTransition" in Element.prototype) {
				document.querySelector('#sidebar').startViewTransition(() => {
					document.querySelector('#selected').appendChild($selectedEntry);
				});
			} else {
				document.querySelector('#selected').appendChild($selectedEntry);
			}
		}
	});
});
