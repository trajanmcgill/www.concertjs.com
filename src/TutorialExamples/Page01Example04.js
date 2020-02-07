(function ()
{
	"use strict";

	let sequence = new Concert.Sequence(),
		box1 = document.getElementById("Box1");
	
	let boxTransformations = 
		[
			{
				target: box1,
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				segments:
					[
						{ t0: 0, t1: 1000, v0: 0, v1: 270 },
						{ t0: 3000, t1: 4000, v0: 270, v1: 0 }
					]
			},

			{
				target: box1,
				feature: "top",
				unit: "px",
				applicator: Concert.Applicators.Style,
				keyframes: { times: [1000, 2000, 3000], values: [0, 70, 0] }
			}
		];
	
	sequence.addTransformations(boxTransformations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
