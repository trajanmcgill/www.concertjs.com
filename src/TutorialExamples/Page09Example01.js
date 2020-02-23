(function ()
{
	"use strict";

	const Box0 = document.getElementById("Box0"),
		Box1 = document.getElementById("Box1");
	
	function newTargetLookup(oldTarget)
	{
		let newTarget = (oldTarget.id.slice(-1) === "0") ? Box1 : Box0;
		return newTarget;
	}

	let sequence = new Concert.Sequence();
	sequence.addTransformations(
		{
			target: Box0,
			feature: "top",
			applicator: Concert.Applicators.Style,
			easing: Concert.EasingFunctions.QuadInOut,
			unit: "px",
			keyframes: { times: [0, 1000], values: [0, 100] }
		});
	
	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
	document.getElementById("RetargetButton").onclick = function () { sequence.retarget(newTargetLookup); };
})();
