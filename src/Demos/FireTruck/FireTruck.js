/// <reference path="~/components/Concert.js/1.0.0/Concert.js" />
/* exported demoSequence */

var demoSequence =
(function ()
{
	"use strict";

	var wheelSpriteWidth = 45, wheelFramesPerRotation = 60,
		wheelCircumference = Math.PI * wheelSpriteWidth,
		totalWheelRotations = 57,
		totalDistance = wheelCircumference * totalWheelRotations,
		finalWheelFrame = totalWheelRotations * wheelFramesPerRotation - 1,
		roadSpeed = 1, skylineSpeed = 0.6, skySpeed = 0.15,
		roadRepeatLength = 1007, skylineRepeatLength = 1209,
		totalSequenceTime = 20000,
		lightsSpriteWidth = 28, flashesPerSecond = 1,
		finalLightsFrame = totalSequenceTime / 1000 * flashesPerSecond * 2;

	var mainSequence = new Concert.Sequence();

	mainSequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, easing: Concert.EasingFunctions.QuadInOut });

	mainSequence.addTransformations(
		[
			// Spinning tires (tire rotation frames defined on sprite sheet)
			{
				targets: [document.getElementById("RearTireDiv"), document.getElementById("FrontTireDiv")],
				feature: ["background-position", "background-position"],
				userProperties: { multiply: -1 * wheelSpriteWidth, round: wheelSpriteWidth, modulo: wheelSpriteWidth * wheelFramesPerRotation },
				keyframes: { times: [0, totalSequenceTime], values: [[0, 0], [finalWheelFrame, finalWheelFrame]] }
			},

			// Flashing lights ("on" sprite alternating with "off" sprite)
			{
				target: document.getElementById("Lights"),
				feature: "background-position",
				userProperties: { multiply: -1 * lightsSpriteWidth, round: lightsSpriteWidth, modulo: lightsSpriteWidth * 2 },
				easing: Concert.EasingFunctions.ConstantRate,
				keyframes: { times: [0, totalSequenceTime], values: [0, finalLightsFrame] }
			},

			// Moving road (closest layer of parallax)
			{
				target: document.getElementById("Road"),
				feature: "background-position",
				unit: "px",
				userProperties: { modulo: roadRepeatLength },
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * roadSpeed] }
			},

			// Moving skyline (second layer of parallax)
			{
				target: document.getElementById("City"),
				feature: "background-position",
				userProperties: { modulo: skylineRepeatLength },
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * skylineSpeed] }
			},

			// Moving clouds (furthest layer of parallax)
			{
				target: document.getElementById("Clouds"),
				feature: "background-position",
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * skySpeed] }
			}
		]);

	document.getElementById("GoButton").onclick = function () { mainSequence.begin({ after: Concert.Repeating.Loop(4) }); };

	return mainSequence;
})();
