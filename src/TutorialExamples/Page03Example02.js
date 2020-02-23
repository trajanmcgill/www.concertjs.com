(function ()
{
	"use strict";

	function triplePiston(startTime, endTime, currentTime)
	{
		const Segments = 3,
			s = (endTime - startTime) / Segments,
			t = currentTime - startTime,
			distanceFraction =
				(Math.floor(t / s) + ((Math.cos(Math.PI * (s - (t % s)) / s) + 1) / 2)) / Segments;
		return Math.max(Math.min(distanceFraction, 1), 0);
	}
	
	let animation =
		{
			target: document.getElementById("Block_CustomEasing"),
			feature: "left",
			unit: "px",
			applicator: Concert.Applicators.Style,
			easing: triplePiston,
			keyframes: { times: [0, 1500], values: [0, 360] }
		};

	let sequence = new Concert.Sequence();
	sequence.addTransformations(animation);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
