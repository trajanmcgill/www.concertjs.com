/// <reference path="~/components/Concert.js/Concert.js" />
/* exported demoSequence */

var demoSequence =
(function ()
{
	"use strict";

	function buildAnimation(numStars, numSegmentsPerStar, segmentDuration, easingFunction)
	{
		// CHANGECODE: I think I like the look of the original test demo better (stars having independent segment start times and end times)
		var i, j, star, startLeft, startTop,
			background = document.getElementById("Background"),
			backgroundRect = background.getBoundingClientRect(),
			maxLeft = backgroundRect.right - backgroundRect.left,
			maxTop = backgroundRect.bottom - backgroundRect.top,
			times, values, transformationSet = [],
			sequence = new Concert.Sequence();

		sequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, calculator: Concert.Calculators.Linear, easing: easingFunction });

		background.innerHTML = "";
		for(i = 0; i < numStars; i++)
		{
			startLeft = Math.floor((maxLeft + 1) * Math.random());
			startTop = Math.floor((maxTop + 1) * Math.random());

			star = document.createElement("div");
			star.setAttribute("class", "Star");
			star.style.left = startLeft + "px";
			star.style.top = startTop + "px";
			background.appendChild(star);

			times = [0];
			values = [[startLeft, startTop]];
			for (j = 1; j <= numSegmentsPerStar; j++)
			{
				times.push(j * segmentDuration);
				values.push([Math.floor((maxLeft + 1) * Math.random()), Math.floor((maxTop + 1) * Math.random())]);
			}

			transformationSet.push(
				{
					target: star,
					feature: ["left", "top"],
					keyframes: { times: times, values: values }
				});
		}

		sequence.addTransformations(transformationSet);
		return sequence;
	}

	var mainSequence = buildAnimation(500, 10, 2000, Concert.EasingFunctions.Smoothstep);

	document.getElementById("GoButton").onclick = function () { mainSequence.begin(); };

	return mainSequence;
})();
