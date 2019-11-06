/// <reference path="~/components/Concert.js/1.0.0/Concert.js" />

var Index;

(function ()
{
	"use strict";

	var currentDemoScrollSequence = null, demoScrollSequenceTime = 1000,
		demoChoiceMarker, demoChoiceRects, demoFrameArea, demoFrameWidth, demoChoiceListRect, demoChoiceMarkerLeftOffset;

	function scrollToDemoFrame(targetDemoFrame)
	{
		var i, curDemoSequence, demoFrames = window.frames, numDemoFrames = demoFrames.length, curMarkerRect, targetChoiceRect;

		// If any dmeo is running, stop it
		for (i = 0; i < numDemoFrames; i++)
		{
			curDemoSequence = demoFrames[i].demoSequence;
			if (curDemoSequence)
				curDemoSequence.stop();
		}

		// If we're already scrolling from one demo to another, stop
		if (currentDemoScrollSequence)
			currentDemoScrollSequence.stop();

		// Figure out where the marker is moving from and to
		curMarkerRect = demoChoiceMarker.getBoundingClientRect();
		targetChoiceRect = demoChoiceRects[targetDemoFrame];

		// Create the animation to scroll to the selected demo
		currentDemoScrollSequence = new Concert.Sequence();
		currentDemoScrollSequence.setDefaults({ easing: Concert.EasingFunctions.QuadInOut });
		currentDemoScrollSequence.addTransformations(
			[
				{
					target: demoFrameArea,
					feature: "scrollLeft",
					keyframes: { times: [0, demoScrollSequenceTime], values: [demoFrameArea.scrollLeft, demoFrameWidth * targetDemoFrame] }
				},

				{
					target: demoChoiceMarker,
					feature: ["left", "width"],
					unit: "px",
					applicator: Concert.Applicators.Style,
					keyframes:
						{
							times: [0, demoScrollSequenceTime],
							values:
								[
									[curMarkerRect.left - demoChoiceListRect.left, curMarkerRect.right - curMarkerRect.left],
									[targetChoiceRect.left - demoChoiceListRect.left - demoChoiceMarkerLeftOffset, targetChoiceRect.right - targetChoiceRect.left]
								]
						}
				}
			]);

		// Run the animation
		currentDemoScrollSequence.begin({ onAutoStop: function () { currentDemoScrollSequence = null; } });
	}

	document.body.onload =
		function ()
		{
			var demoFrameContainer0 = document.getElementById("DemoFrameContainer0"),
				demoFrameContainer0Rect = demoFrameContainer0.getBoundingClientRect(),
				demoChoice1 = document.getElementById("DemoChoice1"),
				demoChoice2 = document.getElementById("DemoChoice2"),
				demoChoice3 = document.getElementById("DemoChoice3"),
				demoChoice4 = document.getElementById("DemoChoice4"),
				demoChoiceList = document.getElementById("DemoChoiceList"),
				demoChoiceMarkerRect;

			demoChoiceMarker = document.getElementById("DemoChoiceMarker");
			demoChoiceMarkerRect = demoChoiceMarker.getBoundingClientRect();
			demoChoiceListRect = demoChoiceList.getBoundingClientRect();
			demoChoiceRects =
				[
					demoChoiceMarkerRect,
					demoChoice1.getBoundingClientRect(),
					demoChoice2.getBoundingClientRect(),
					demoChoice3.getBoundingClientRect(),
					demoChoice4.getBoundingClientRect()
				];
			demoChoiceMarkerLeftOffset = (demoChoiceMarkerRect.right - demoChoiceMarkerRect.left) / 2;
			demoChoiceMarker.style.height = (demoChoiceRects[1].bottom - demoChoiceRects[1].top) + "px";

			demoFrameArea = document.getElementById("DemoFrameArea");
			demoFrameWidth = demoFrameContainer0Rect.right - demoFrameContainer0Rect.left;

			demoChoice1.onclick = function () { scrollToDemoFrame(1); };
			demoChoice2.onclick = function () { scrollToDemoFrame(2); };
			demoChoice3.onclick = function () { scrollToDemoFrame(3); };
			demoChoice4.onclick = function () { scrollToDemoFrame(4); };

			window.setTimeout(function () { scrollToDemoFrame(Math.floor(Math.random() * 4 + 1)); }, 1000);
		};

	var PublicInterface = {};

	Index = PublicInterface;
})();
