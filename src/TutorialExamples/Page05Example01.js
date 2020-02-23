(function ()
{
	"use strict";

	const WideningDiv = document.getElementById("WideningDiv"),
		WideningSvgRect = document.getElementById("WideningSvgRect"),
		CaptionBox = document.getElementById("Caption");

	let animations =
	[
		{
			target: WideningDiv,
			feature: "width",
			unit: "px",
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Linear,
			keyframes: { times: [0, 1500], values: [100, 480] }
		},

		{
			target: WideningSvgRect,
			feature: "width",
			unit: "px",
			applicator: Concert.Applicators.SVG_ElementAttribute,
			calculator: Concert.Calculators.Linear,
			keyframes: { times: [0, 1500], values: [100, 480] }
		},

		{
			target: CaptionBox,
			feature: "innerHTML",
			unit: null,
			applicator: Concert.Applicators.Property,
			calculator: Concert.Calculators.Discrete,
			keyframes:
			{
				times: [0, 750, 1500],
				values: ["Start Value", "Midpoint Value", "End Value"]
			}
		}
	];

	let sequence = new Concert.Sequence();
	sequence.addTransformations(animations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
