/// <reference path="~/Components/Concert.js/1.0.0/Concert.js" />

(function ()
{
	"use strict";

	var sequence = new Concert.Sequence(),
		keyFrameTimes = [], keyFrameValues = [],
		wheelRotationsPerSecond = 2,
		spritesPerLoop = 60,
		frameLength_ms = 1000 / (spritesPerLoop * wheelRotationsPerSecond),
		wheelSpriteWidth = 45,
		i, frameStartTime, spriteLocation;

	for (i = 0; i < 60; i++)
	{
		frameStartTime = Math.round(i * frameLength_ms);
		spriteLocation = -1 * i * wheelSpriteWidth;
		
		keyFrameTimes.push(frameStartTime);
		keyFrameValues.push([spriteLocation, spriteLocation]);
	}

	sequence.addTransformations(
		{
			targets: [document.getElementById("RearTireDiv"), document.getElementById("FrontTireDiv")],
			feature: ["background-position-x", "background-position-x"],
			unit: "px",
			applicator: Concert.Applicators.Style,
			calculator: Concert.Calculators.Discrete,
			easing: Concert.EasingFunctions.ConstantRate,
			keyframes: { times: keyFrameTimes, values: keyFrameValues }
		});

	document.getElementById("GoButton").onclick = function () { sequence.begin({ after: Concert.Repeating.Loop(10) }); };
})();
