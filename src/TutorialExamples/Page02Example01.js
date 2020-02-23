(function ()
{
	"use strict";

	let sequence = new Concert.Sequence();

	sequence.addTransformations(
		{
			target: document.getElementById("HelloDiv"),
			feature: "height",
			unit: "px",
			applicator: Concert.Applicators.Style,
			keyframes: { times: [0, 2000], values: [0, 24] }
		});

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
