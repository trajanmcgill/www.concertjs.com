(function ()
{
	"use strict";

	const WideningDiv1 = document.getElementById("WideningDiv1"),
		WideningDiv2 = document.getElementById("WideningDiv2"),
		WideningDiv3 = document.getElementById("WideningDiv3");

	let sequence = new Concert.Sequence();

	sequence.setDefaults(
		{
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Linear,
			easing: Concert.EasingFunctions.QuadInOut,
			unit: "px"
		});

	let animations =
	[
		{
			target: WideningDiv1, feature: "width",
			keyframes: { times: [0, 1500], values: [120, 480] }
		},

		{
			target: WideningDiv2, feature: "width",
			keyframes: { times: [0, 1500], values: [120, 480] }
		},

		{
			target: WideningDiv3, feature: "width",
			unit: "%",
			keyframes: { times: [0, 1500], values: [25, 100] }
		}
	];

	sequence.addTransformations(animations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
