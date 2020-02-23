(function ()
{
	"use strict";

	const GoButton = document.getElementById("GoButton"),
		ResetButton = document.getElementById("ResetButton");

	function doCloning(sequence)
	{
		let newSequence = sequence.clone(
			function (originalTargetObject)
			{
				return document.getElementById(originalTargetObject.id.replace("Dot", "Box"));
			},
			true);
		return newSequence;
	}

	let originalSequence = new Concert.Sequence(),
		clonedSequence = null;
	originalSequence.setDefaults(
		{
			applicator: Concert.Applicators.Style,
			easing: Concert.EasingFunctions.QuadIn,
			unit: "px"
		});
	originalSequence.addTransformations(
		[
			{
				target: document.getElementById("Dot0"),
				feature: "top",
				keyframes: { times: [0, 2000], values: [0, 230] }
			},
			{
				target: document.getElementById("Dot1"),
				feature: "top",
				keyframes: { times: [0, 2000], values: [230, 0] }
			}
		]);
	
	GoButton.onclick =
		function ()
		{
			if (clonedSequence instanceof Concert.Sequence)
				clonedSequence.begin();
			else
			{
				GoButton.disabled = true;
				window.setTimeout(
					function()
					{
						clonedSequence = doCloning(originalSequence);
						GoButton.disabled = false;
					}, 1000);
			}
			originalSequence.begin();
		};
	
	ResetButton.onclick =
		function ()
		{
			originalSequence.stop();
			originalSequence.seek(0);
			if (clonedSequence instanceof Concert.Sequence)
			{
				clonedSequence.stop();
				clonedSequence.seek(0);
				clonedSequence = null;
			}
		};
})();
