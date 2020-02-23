(function ()
{
	"use strict";

	const Sun = document.getElementById("Sun"),
		Neptune = document.getElementById("Neptune"),
		OrbitTime = 2000, Orbits = 4,
		CaptionBox = document.getElementById("Caption");

	let animations =
	[
		{
			target: Neptune,
			feature: ["left", "top"],
			unit: "px",
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Rotational,
			keyframes:
			{
				times: [0, Orbits * OrbitTime],
				values:
				[
					{
						centerX: 240, centerY: 130,
						radius: 100, angle: 0,
						offsetX: -10, offsetY: -10
					},
					{
						centerX: 240, centerY: 130,
						radius: 100, angle: Orbits * 2 * Math.PI,
						offsetX: -10, offsetY: -10
					}
				]
			}
		},

		{
			target: Sun,
			feature: ["left", "top", "width", "height"],
			unit: "px",
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Linear,
			keyframes:
			{
				times: [OrbitTime, 2 * OrbitTime, 3 * OrbitTime],
				values:
				[
					[215, 105, 50, 50],
					[220, 110, 40, 40],
					[185, 75, 110, 110]
				]
			}
		},

		{
			target: Sun,
			feature: "background-color",
			unit: null,
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Color,
			keyframes:
			{
				times: [OrbitTime, 2 * OrbitTime, 3 * OrbitTime],
				values: ["#ffff00", "#ffffcc", "#aa0000"]
			}
		},

		{
			target: CaptionBox,
			feature: "innerHTML",
			applicator: Concert.Applicators.Property,
			calculator: Concert.Calculators.Discrete,
			keyframes:
			{
				times: [0, OrbitTime, 3 * OrbitTime],
				values: ["Main Sequence Star", "Transition", "Red Giant"]
			}
		}
	];

	let sequence = new Concert.Sequence();
	sequence.addTransformations(animations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
