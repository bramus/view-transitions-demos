const randomBetween = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

const LOCAL_STORAGE_KEY = 'my-patagonia-trip-state';

if (!("startViewTransition" in Element.prototype)) {
	document.addEventListener('DOMContentLoaded', () => {
		const $warning = document.querySelector('.warning[data-reason="element-scoped-view-transitions"]');
		if ($warning) $warning.style.display = 'block';
	});
}

const loadState = () => {
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch (e) { }
	return { season: null, type: null, entries: [] };
};

const saveState = (state) => {
	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
};

const THEME_STORAGE_KEY = 'my-patagonia-trip-theme';

const loadTheme = () => {
	return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
};

const saveTheme = (theme) => {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const applyTheme = (theme) => {
	if (theme === 'light' || theme === 'dark') {
		document.documentElement.style.colorScheme = theme;
	} else {
		document.documentElement.style.colorScheme = 'light dark';
	}
	const $input = document.querySelector(`input[name="theme-toggle"][value="${theme}"]`);
	if ($input) $input.checked = true;
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
	const state = loadState();
	state.season = selectedSeason;
	saveState(state);

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
	const state = loadState();
	state.type = selectedType;
	saveState(state);

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
			const state = loadState();
			state.entries = state.entries.filter(eId => eId !== id);
			saveState(state);

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
			const state = loadState();
			if (!state.entries.includes(id)) {
				state.entries.push(id);
			}
			saveState(state);

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

// Theme Toggle
document.querySelectorAll('input[name="theme-toggle"]').forEach($input => {
	$input.addEventListener('change', (e) => {
		const theme = e.target.value;
		saveTheme(theme);
		if ("startViewTransition" in document) {
			document.startViewTransition(() => {
				applyTheme(theme);
			});
		} else {
			applyTheme(theme);
		}
	});
});

// Restore State
(async () => {
	const theme = loadTheme();
	applyTheme(theme);

	const state = loadState();
	selectedSeason = state.season;
	selectedType = state.type;

	if (selectedSeason) {
		const $seasonSelect = document.querySelector('select[name=seasons]');
		if ($seasonSelect) $seasonSelect.value = selectedSeason;
	}
	if (selectedType) {
		const $typeSelect = document.querySelector('select[name=types]');
		if ($typeSelect) $typeSelect.value = selectedType;
	}

	applyFilter({ season: selectedSeason, type: selectedType });

	if (selectedSeason) {
		setWeatherData({ low: 'Loading…', high: 'Loading…' });
		const weatherData = await fetchWeatherData(selectedSeason);
		setWeatherData(weatherData);
	}

	state.entries.forEach(id => {
		const $entry = document.getElementById(id);
		if ($entry) {
			$entry.classList.add('checked');
			const { title, photo } = $entry.dataset;
			
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

			document.querySelector('#selected').appendChild($selectedEntry);
		}
	});
})();
