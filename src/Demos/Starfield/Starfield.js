/* exported demoSequence */

var demoSequence =
(function ()
{
	"use strict";

	// Set up the parameters for this demo animation.
	const StarCount = 650, MovementSegmentCount = 10, SegmentDurationMS = 2000,
		EasingToUse = Concert.EasingFunctions.QuadInOut;

	function buildAnimation(containingDiv, numStars, numSegmentsPerStar, segmentDuration, easingFunction)
	{
		const backgroundRect = containingDiv.getBoundingClientRect(),
			maxLeft = backgroundRect.right - backgroundRect.left - 1, // right-most left-position that remains inside the background area
			maxTop = backgroundRect.bottom - backgroundRect.top - 1; // bottom-most top position that remains inside the background area

		// Create a sequence object. This is the basic object used for everything.
		let sequence = new Concert.Sequence();

		// All the animation segments added below will use these settings.
		sequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, calculator: Concert.Calculators.Linear, easing: easingFunction });

		// Clear the background.
		containingDiv.innerHTML = "";

		// Build a randomly generated set of placements and movements.
		let transformationSet = [];
		for(let i = 0; i < numStars; i++)
		{
			// Create an element for movement. It is intended to look like one of a field of stars.
			let newStarElement = document.createElement("div");
			newStarElement.setAttribute("class", "Star");

			// Generate an array of keyframe times, enough to create the specified number of movement segments.
			let keyframeTimes = [];
			while(keyframeTimes.length < numSegmentsPerStar + 1)
			{
				// Choose a random moment within the timeline
				let newRandomTime = Math.floor(Math.random() * (MovementSegmentCount * SegmentDurationMS + 1));
				
				// But make sure it is unique before adding it as a keyframe time,
				// since specifying different values for the same keyframe time doesn't make sense.
				if(keyframeTimes.indexOf(newRandomTime) === -1)
					keyframeTimes.push(newRandomTime);
			}
			// Sort the times in ascending order.
			keyframeTimes.sort(function(a,b) { return (a < b) ? -1 : ((a > b) ? 1 : 0)});

			// Generate an array of keyframe positions, enough to create the specified number of movement segments.
			let keyframePositions = [];
			while(keyframePositions.length < numSegmentsPerStar + 1)
			{
				let newLeftPosition = Math.floor(Math.random() * (maxLeft + 1)),
					newTopPosition = Math.floor(Math.random() * (maxTop + 1));
				keyframePositions.push([newLeftPosition, newTopPosition]);
			}

			// Set the starting position of the current "star" to the first keyframe position.
			newStarElement.style.left = keyframePositions[0][0] + "px"; // starting left position
			newStarElement.style.top = keyframePositions[0][1] + "px"; // starting top position
			
			// Add this "star" to the document.
			containingDiv.appendChild(newStarElement);

			// Add the keyframes and values to the array of movements we're going to add to the sequence.
			transformationSet.push(
				{
					target: newStarElement,
					feature: ["left", "top"],
					keyframes: { times: keyframeTimes, values: keyframePositions }
				});
		}

		// Add the now-fully-generated transformation set to the sequence.
		sequence.addTransformations(transformationSet);

		return sequence;
	} // end buildAnimation()


	// Call the above function to build an animation.
	let mainSequence = buildAnimation(
			document.getElementById("Background"),
			StarCount, MovementSegmentCount, SegmentDurationMS, EasingToUse);

	// Wire the "Go" button to the sequence's begin() method.
	document.getElementById("GoButton").onclick = function () { mainSequence.begin(); };

	// There isn't actually any need in this case to return the sequence object and set (as we do above)
	// a global (window) variable to it. We just do this here so that if the user of this demo wants to
	// open a console and play with the sequence object, it will be globally available within its frame.
	return mainSequence;
})();
