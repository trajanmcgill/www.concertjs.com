/* exported demoSequence */
var demoSequence =
(function ()
{
	"use strict";

	// Set up values and parameters needed for this demo animation.
	const wheelSpriteWidth = 45, wheelFramesPerRotation = 60,
		wheelCircumference = Math.PI * wheelSpriteWidth,
		totalWheelRotations = 57,
		totalDistance = wheelCircumference * totalWheelRotations,
		finalWheelFrame = totalWheelRotations * wheelFramesPerRotation - 1,
		roadSpeed = 1, skylineSpeed = 0.6, skySpeed = 0.15,
		roadRepeatLength = 1007, skylineRepeatLength = 1209,
		totalSequenceTime = 20000,
		lightsSpriteWidth = 28, flashesPerSecond = 1,
		finalLightsFrame = totalSequenceTime / 1000 * flashesPerSecond * 2,
		animationLoopCount = 1;

	let mainSequence = new Concert.Sequence();

	// Most of the animations added below will use these settings.
	mainSequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, easing: Concert.EasingFunctions.QuadInOut });

	mainSequence.addTransformations(
		[
			// Moving road (closest layer of parallax): Simply move the background image (a repeatable tile) over time.
			// The modulo modifier will loop the image back to the start position every time it has gone the roadRepeatLength distance.
			{
				target: document.getElementById("Road"),
				feature: "background-position",
				unit: "px",
				calculatorModifiers: { modulo: roadRepeatLength },
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * roadSpeed] }
			},

			// Moving skyline (second layer of parallax): Works the same as the road above, but the speed is different.
			{
				target: document.getElementById("City"),
				feature: "background-position",
				calculatorModifiers: { modulo: skylineRepeatLength },
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * skylineSpeed] }
			},

			// Moving clouds (furthest layer of parallax): Works just as road and skyline above, but at a third independent rate of motion.
			{
				target: document.getElementById("Clouds"),
				feature: "background-position",
				keyframes: { times: [0, totalSequenceTime], values: [0, -1 * totalDistance * skySpeed] }
			},

			// Spinning tires: Tire rotation frames are defined on a sprite sheet.
			// They are animated by placing the right sprite for the present tire position into the visible area.
			{
				targets: [document.getElementById("RearTireDiv"), document.getElementById("FrontTireDiv")],
				feature: ["background-position", "background-position"],
				calculatorModifiers: { multiply: -1 * wheelSpriteWidth, round: wheelSpriteWidth, modulo: wheelSpriteWidth * wheelFramesPerRotation },
				keyframes: { times: [0, totalSequenceTime], values: [[0, 0], [finalWheelFrame, finalWheelFrame]] }
			},

			// Flashing lights ("on" sprite alternating with "off" sprite)
			{
				target: document.getElementById("Lights"),
				feature: "background-position",
				calculatorModifiers: { multiply: -1 * lightsSpriteWidth, round: lightsSpriteWidth, modulo: lightsSpriteWidth * 2 },
				easing: Concert.EasingFunctions.ConstantRate,
				keyframes: { times: [0, totalSequenceTime], values: [0, finalLightsFrame] }
			}
		]);

	document.getElementById("GoButton").onclick = function () { mainSequence.begin({ after: Concert.Repeating.Loop(animationLoopCount) }); };

	// There isn't actually any need in this case to return the sequence object and set (as we do above)
	// a global (window) variable to it. We just do this here so that if the user of this demo wants to
	// open a console and play with the sequence object, it will be globally available within its frame.
	return mainSequence;
})();
