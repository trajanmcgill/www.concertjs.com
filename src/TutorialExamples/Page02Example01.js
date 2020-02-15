(function ()
{
	"use strict";

	const LeftPosition = 0, RightPosition = 360, EndTime = 1500;

	let animations =
		[
			{
				target: document.getElementById("Block_ConstantRate"),
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				easing: Concert.EasingFunctions.ConstantRate,
				keyframes: { times: [0, EndTime], values: [LeftPosition, RightPosition] }
			},

			{
				target: document.getElementById("Block_QuadIn"),
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				easing: Concert.EasingFunctions.QuadIn,
				keyframes: { times: [0, EndTime], values: [LeftPosition, RightPosition] }
			},

			{
				target: document.getElementById("Block_QuadInOut"),
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				easing: Concert.EasingFunctions.QuadInOut,
				keyframes: { times: [0, EndTime], values: [LeftPosition, RightPosition] }
			},

			{
				target: document.getElementById("Block_QuadOut"),
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				easing: Concert.EasingFunctions.QuadOut,
				keyframes: { times: [0, EndTime], values: [LeftPosition, RightPosition] }
			},

			{
				target: document.getElementById("Block_Smoothstep"),
				feature: "left",
				unit: "px",
				applicator: Concert.Applicators.Style,
				easing: Concert.EasingFunctions.Smoothstep,
				keyframes: { times: [0, EndTime], values: [LeftPosition, RightPosition] }
			}
		];

	let sequence = new Concert.Sequence();
	sequence.addTransformations(animations);

	document.getElementById("GoButton").onclick = function () { sequence.begin(); };
})();
