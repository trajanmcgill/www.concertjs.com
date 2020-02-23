(function ()
{
	"use strict";

	let sequence = new Concert.Sequence(),
		box1 = document.getElementById("Box1");
	
	let box1Transformations = 
		[
			{
				target: box1,
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				keyframes: { times: [0, 1000], values: [0, 265] }
			},

			{
				target: box1,
				feature: "top",
				unit: "px",
				applicator: Concert.Applicators.Style,
				keyframes: { times: [0, 1000], values: [0, 65] }
			}
		];
	
	sequence.addTransformations(box1Transformations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
