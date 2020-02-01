(function ()
{
	"use strict";

	const DemoScrollSequenceTime = 750, // Time taken to shift from one demo frame to another.
		DemoScrollAnimationEasing = Concert.EasingFunctions.QuadInOut; // Easing function that will be used for sliding between demo frames.


	// Assorted values we need to track.
	let currentDemoScrollSequence = null,
		demoChoiceMarker, demoChoiceMarkerLeftOffset, demoChoiceListRect,
		demoChoiceRects, entireDemoFramesArea, demoFrameWidth;

	
	// setUpDemoFrameScrolling(): Initializes everything for shifting between demo frames.
	function setUpDemoFrameScrolling()
	{
		// Get references to all the necessary HTML elements.
		const demoFrameContainer0Rect = document.getElementById("DemoFrameContainer0").getBoundingClientRect(),
			demoChoice1 = document.getElementById("DemoChoice1"),
			demoChoice2 = document.getElementById("DemoChoice2"),
			demoChoice3 = document.getElementById("DemoChoice3"),
			demoChoice4 = document.getElementById("DemoChoice4"),
			demoChoiceList = document.getElementById("DemoChoiceList");
		
		// Store a reference to the whole area containing all the demo frames, for use elsewhere.
		entireDemoFramesArea = document.getElementById("DemoFrameArea");

		// Store the width of an individual demo frame, for use later when shifting between them.
		demoFrameWidth = demoFrameContainer0Rect.right - demoFrameContainer0Rect.left;

		// Grab reference (used in this function and elsewhere) to the moving marker that indicates which tab is selected,
		// and figure out its present size (for use in this function).
		demoChoiceMarker = document.getElementById("DemoChoiceMarker");
		let currentDemoChoiceMarkerRect = demoChoiceMarker.getBoundingClientRect();
		
		// Store a position offset the currently-selected-tab marker, for use later when scrolling between tabs.
		demoChoiceMarkerLeftOffset = (currentDemoChoiceMarkerRect.right - currentDemoChoiceMarkerRect.left) / 2;

		// Store the sizes of each tab, for use later when scrolling between them.
		demoChoiceListRect = demoChoiceList.getBoundingClientRect();
		demoChoiceRects =
			[
				currentDemoChoiceMarkerRect,
				demoChoice1.getBoundingClientRect(),
				demoChoice2.getBoundingClientRect(),
				demoChoice3.getBoundingClientRect(),
				demoChoice4.getBoundingClientRect()
			];

		// Set the selection marker's height to fit the tabs' height.
		demoChoiceMarker.style.height = (demoChoiceRects[1].bottom - demoChoiceRects[1].top) + "px";

		// Wire up event handlers for clicking on each of the tabs for selecting demos.
		demoChoice1.onclick = function () { scrollToDemoFrame(1); };
		demoChoice2.onclick = function () { scrollToDemoFrame(2); };
		demoChoice3.onclick = function () { scrollToDemoFrame(3); };
		demoChoice4.onclick = function () { scrollToDemoFrame(4); };

		// Pick one of the demo tabs at random and initiate scrolling to that one to start with.
		window.setTimeout(function () { scrollToDemoFrame(Math.floor(Math.random() * 4 + 1)); }, 1000);
	} // end setUpDemoFrameScrolling()

	
	// scrollToDemoFrame(): Animates movement shifting from one demo frame to another.
	function scrollToDemoFrame(targetDemoFrame)
	{
		const demoFrames = window.frames;

		// If any demo is running, stop it.
		for (let i = 0; i < demoFrames.length; i++)
		{
			let currentFrameDemoSequence = demoFrames[i].demoSequence;
			if (currentFrameDemoSequence)
				currentFrameDemoSequence.stop();
		}

		// If we're already scrolling from one demo to another, stop
		if (currentDemoScrollSequence)
			currentDemoScrollSequence.stop();

		// Figure out where the current-selection marker is moving from, and where it is moving to.
		let demoChoiceMarkerCurrentRect = demoChoiceMarker.getBoundingClientRect();
		let demoChoiceMarkerTargetRect = demoChoiceRects[targetDemoFrame];

		// Create the animation to scroll to the selected demo.
		currentDemoScrollSequence = new Concert.Sequence();
		currentDemoScrollSequence.setDefaults({ easing: DemoScrollAnimationEasing });
		currentDemoScrollSequence.addTransformations(
			[
				// Animate the frames area to shift the proper frame into view.
				{
					target: entireDemoFramesArea,
					feature: "scrollLeft",
					keyframes:
						{
							times: [0, DemoScrollSequenceTime],
							values: [entireDemoFramesArea.scrollLeft, demoFrameWidth * targetDemoFrame]
						}
				},

				// Over the same amount of time, animate the currently-selected-demo marker
				// to move to the right tab and resize itself to match the newly selected tab.
				{
					target: demoChoiceMarker,
					feature: ["left", "width"],
					unit: "px",
					applicator: Concert.Applicators.Style,
					keyframes:
						{
							times: [0, DemoScrollSequenceTime],
							values:
								[
									// start value (array of left and width values to be applied to the above array of features)
									[
										demoChoiceMarkerCurrentRect.left - demoChoiceListRect.left,
										demoChoiceMarkerCurrentRect.right - demoChoiceMarkerCurrentRect.left
									],

									// end value (array of left and width values to be applied to the above array of features)
									[
										demoChoiceMarkerTargetRect.left - demoChoiceListRect.left - demoChoiceMarkerLeftOffset,
										demoChoiceMarkerTargetRect.right - demoChoiceMarkerTargetRect.left
									]
								]
						}
				}
			]);

		// Run the animation
		currentDemoScrollSequence.begin({ onAutoStop: function () { currentDemoScrollSequence = null; } });
	} // end scrollToDemoFrame()


	// Wire up the initialization function to run upon load.
	document.body.onload = setUpDemoFrameScrolling;
})();
