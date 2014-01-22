(function ()
{
	"use strict";

	var sequence = new Concert.Sequence();

	sequence.addTransformations(
		{
			target: document.getElementById("HelloDiv"),
			feature: "height",
			unit: "px",
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Linear,
			easing: Concert.EasingFunctions.ConstantRate,
			keyframes: { times: [0, 1000], values: [0, 24] }
		});

	document.getElementById("GoButton").onclick = function () { sequence.begin(); }
})();
