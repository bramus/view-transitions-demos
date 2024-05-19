const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const createElement = (tag, attributes = {}) => {
	const $el = document.createElement(tag);
	for (const [attr, attrValue] of Object.entries(attributes)) {
		switch (attr) {
			case 'class':
				attrValue.split(' ').forEach(className => {
					$el.classList.add(className);
				});
				break;
			case 'children':
				attrValue.forEach($child => {
					$el.appendChild($child);
				});
				break;
			case 'innerText':
				$el.innerText = attrValue;
				break;
			case 'innerHTML':
				$el.innerHTML = attrValue;
				break;
			default:
				if ([true, false].includes(attrValue)) {
					if (attrValue) {
						$el.setAttribute(attr, '');
					}
				} else {
					$el.setAttribute(attr, attrValue);
				}
		}
	}
	return $el;
};

// Function to generate the markup needed for the pagination
const generatePagination = (currentPageIndex, numPages, pathName = 'index.html') => {
	const $ul = createElement('ul', {
		class: 'pagination',
	});

	// First Page
	if (currentPageIndex == 1) {
		$ul.appendChild(createElement('li', {
			'data-pagination-disabled': true,
			'data-pagination-prev': true,
			children: [
				createElement('span', {
					innerHTML: '&lsaquo;',
				})
			]
		}));
	} else {
		$ul.appendChild(createElement('li', {
			'data-pagination-prev': true,
			children: [
				createElement('a', {
					href: `${pathName}?p=${currentPageIndex - 1}`,
					title: 'Go to Previous Page',
					innerHTML: '&lsaquo;',
				})
			]
		}));
	}

	// Pages themselves
	for (let p = 1; p <= numPages; p++) {
		$ul.appendChild(createElement('li', {
			'data-pagination-current': p == currentPageIndex,
			children: [
				createElement('a', {
					href: `${pathName}?p=${p}`,
					title: `Go to Page ${p}`,
					innerHTML: p,
				})
			]
		}));

	}

	// Last Page
	if (currentPageIndex == numPages) {
		$ul.appendChild(createElement('li', {
			'data-pagination-disabled': true,
			'data-pagination-next': true,
			children: [
				createElement('span', {
					innerHTML: '&rsaquo;',
				})
			]
		}));
	} else {
		$ul.appendChild(createElement('li', {
			'data-pagination-next': true,
			children: [
				createElement('a', {
					href: `${pathName}?p=${currentPageIndex + 1}`,
					title: 'Go to Next Page',
					innerHTML: '&rsaquo;',
				})
			]
		}));
	}

	return $ul;
}

function transitionHelper({
	skipTransition = false,
	types = [],
	update,
}) {

	const unsupported = (error) => {
		const updateCallbackDone = Promise.resolve(update()).then(() => {});

		return {
			ready: Promise.reject(Error(error)),
			updateCallbackDone,
			finished: updateCallbackDone,
			skipTransition: () => {},
			types,
		};
	}

	if (skipTransition || !document.startViewTransition) {
		return unsupported('View Transitions are not supported in this browser');
	}

	try {
		const transition = document.startViewTransition({
			update,
			types,
		});

		return transition;
	} catch (e) {
		return unsupported('View Transitions with types are not supported in this browser');
	}
}

export { clamp, createElement, generatePagination, transitionHelper };
