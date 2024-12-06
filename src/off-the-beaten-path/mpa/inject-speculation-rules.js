if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
  const $script = document.createElement('script');
  $script.type = 'speculationrules';
  $script.textContent = `{
	"prerender": [{
		"source": "document",
		"where": {
			"href_matches": "/*"
		},
		"eagerness": "moderate"
	}]
}`;
  document.body.append($script);
}
