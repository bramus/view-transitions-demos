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

export { clamp, createElement };
