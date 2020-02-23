(function ()
{
	"use strict";

	let sequence = new Concert.Sequence(),
		box1 = document.getElementById("Box1"),
		box2 = document.getElementById("Box2");
	
	let boxTransformations = 
		[
			{
				target: box1,
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				keyframes: { times: [0, 750, 1500, 2250], values: [0, 90, 180, 270] }
			},

			{
				target: box2,
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				keyframes: { times: [0, 750, null, 1500, 2250], values: [0, 90, null, 180, 270] }
			}
		];
	
	sequence.addTransformations(boxTransformations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
