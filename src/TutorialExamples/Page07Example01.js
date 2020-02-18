(function ()
{
	"use strict";

	const SegmentDuration = 1250, MovementDistance = 240,
		Box1 = document.getElementById("Box1"),
		Box2 = document.getElementById("Box2"),
		Defaults =
		{
			applicator: Concert.Applicators.Style,
			easing: Concert.EasingFunctions.ConstantRate,
			unit: "px"
		};
	
	let bounceSequence = new Concert.Sequence(),
		loopSequence = new Concert.Sequence();
	
	bounceSequence.setDefaults(Defaults);
	loopSequence.setDefaults(Defaults);
		
	bounceSequence.addTransformations(
		{
			target: Box1,
			feature: "left",
			keyframes: { times: [0, SegmentDuration], values: [0, MovementDistance] }
		});

	loopSequence.addTransformations(
		{
			target: Box2,
			feature: "left",
			keyframes: { times: [0, SegmentDuration], values: [0, MovementDistance] }
		});
	
	document.getElementById("GoButton").onclick =
		function ()
		{
			bounceSequence.begin({ after: Concert.Repeating.Bounce(4) });
			loopSequence.begin({ after: Concert.Repeating.Loop(4) });
		};
})();
