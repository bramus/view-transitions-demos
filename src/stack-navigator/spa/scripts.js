// Manually keep track of a navigation stack
const navigationStack = ['home'];

const activateView = (viewId) => {
	document.querySelectorAll('.view').forEach($view => {
		if ($view.id === viewId) {
			$view.removeAttribute("hidden");
		} else {
			$view.setAttribute("hidden", "hidden");
		}
	});
}

const transitionToView = async (viewId, transitionClass = 'none') => {
		if (!document.startViewTransition) {
			activateView(viewId);
			return;
		}

		try {
			document.documentElement.dataset.transition = transitionClass;
			const t = document.startViewTransition(() => {
				activateView(viewId)
			});
			await t.finished;
		} finally {
			delete document.documentElement.dataset.transition;
		}
}

document.querySelectorAll("ul.messages a").forEach(($a) => {
	$a.addEventListener("click", (e) => {
		e.preventDefault();

		const viewId = $a.getAttribute('href').substring(1);
		navigationStack.push(viewId);

		transitionToView(viewId, 'push');
	});
});

document.querySelectorAll(".back").forEach($back => {
	$back.addEventListener("click", (e) => {
		e.preventDefault();

		navigationStack.pop();
		const viewId = navigationStack.at(-1) ?? 'home';

		transitionToView(viewId, 'pop');
	});
});

document.querySelectorAll('[href="./"]').forEach($link => {
	$link.addEventListener("click", (e) => {
		e.preventDefault();
		transitionToView(navigationStack.at(0), 'reload');
	});
});
