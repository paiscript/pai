(function (PAI) {
	PAI['ready'](function () {
		PAI.adapter.extend(PAI, {
			"checkSkip": PAI.checkElement,
			"checkLinks": PAI.adapter.noop,
			"checkObjects": PAI.adapter.noop,
			"go": PAI.showPage
		});
	});
}(window['PAI']));