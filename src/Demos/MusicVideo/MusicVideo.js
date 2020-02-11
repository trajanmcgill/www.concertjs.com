/* exported demoSequence */

var demoSequence =
(function ()
{
	"use strict";

	// Set up the parameters for this demo animation.
	const lyricsTiming =
		[
			0, 5683, 6283, 8267, 8600, 8917, 10933, 11583, 12883, 13250, 13600,
			16183, 16833, 18133, 18483, 18833, 21333, 21683, 22017, 23683, 24317,
			24633, 26450
		];
	// ADD CODE HERE;

	// extractWordPositions: Run a depth-first search on the tree below (and including) the passed-in HTML node,
	// returning an array of all the nodes and start and end positions of all the words within the text nodes in that node tree.
	function extractWordPositions(htmlNode)
	{
		let wordPositions = [],
			extracting = (htmlNode.childNodes.length > 0),
			currentNode = htmlNode;

		while(extracting)
		{
			if(currentNode.nodeType === Node.TEXT_NODE)
			{
				let wordRegEx = /[a-z'-]+/gi,
					textContent = currentNode.textContent,
					currentMatch;
				
				while((currentMatch = wordRegEx.exec(textContent)) !== null)
				{
					wordPositions.push(
						{
							node: currentNode,
							start: wordRegEx.lastIndex - currentMatch[0].length,
							end: wordRegEx.lastIndex
						});
				}
			}
			
			if(currentNode.childNodes.length > 0)
				currentNode = currentNode.childNodes[0];
			else if(currentNode === htmlNode)
				extracting = false;
			else if(currentNode.nextSibling !== null)
				currentNode = currentNode.nextSibling;
			else if(currentNode.parentNode === htmlNode)
				extracting = false;
			else if(currentNode.parentNode.nextSibling === null)
				extracting = false;
			else
				currentNode = currentNode.parentNode.nextSibling;
		} // end while(extracting)

		return wordPositions;
	} // end extractWordPositions()


	function selectionApplicator(target, feature, value, unit)
	{
		let selection = window.getSelection(),
			range = document.createRange();

		selection.removeAllRanges();
		
		if(value.start !== null)
		{
			range.setStart(value.start.node, value.start.position);
			range.setEnd(value.end.node, value.end.position);

			selection.addRange(range);
		}
	} // end selectionApplicator()


	function getLyricsSelectionTransformation()
	{
		const textArea = document.getElementById("TextArea"),
			wordPositions = extractWordPositions(textArea);

		let i, selectionAnimationValues = [{ start: null, end: null }];
		for(i = 0; i < wordPositions.length; i++)
		{
			selectionAnimationValues.push(
				{
					start: { node: wordPositions[i].node, position: wordPositions[i].start },
					end: { node: wordPositions[i].node, position: wordPositions[i].end }
				});
		}
		selectionAnimationValues.push({ start: null, end: null });

		let transformation =
			{
				target: null,
				feature: null,
				unit: null,
				applicator: selectionApplicator,
				calculator: Concert.Calculators.Discrete,
				easing: Concert.EasingFunctions.ConstantRate,
				keyframes:
				{
					times: lyricsTiming,
					values: selectionAnimationValues
				}
			};
		
		return transformation;
	} // end getLyricsSelectionTransformation()


	function buildAnimation()
	{
		const video = document.getElementById("MusicVideo");

		let transformationSet = [];

		transformationSet.push(getLyricsSelectionTransformation());
		
		// Create a sequence object. This is the basic object used for everything.
		let sequence = new Concert.Sequence();
		
		// All the animation segments added below will use these settings.
		//sequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, calculator: Concert.Calculators.Linear, easing: easingFunction });

		// Add the now-fully-generated transformation set to the sequence.
		sequence.addTransformations(transformationSet);

		video.onplay = function() { sequence.syncTo(video); };
		video.onpause = video.onended = function() { sequence.stop(); };
		video.onseeked = function() { sequence.seek(video.currentTime); }; // CHANGE CODE HERE: this isn't working for some reason. Fix it.

		return sequence;
	} // end buildAnimation()


	// Call the above function to build an animation.
	let mainSequence = buildAnimation();

	// Wire the "Go" button to the sequence's begin() method.
	//document.getElementById("GoButton").onclick = function () { mainSequence.begin(); };

	// There isn't actually any need in this case to return the sequence object and set (as we do above)
	// a global (window) variable to it. We just do this here so that if the user of this demo wants to
	// open a console and play with the sequence object, it will be globally available within its frame.
	//return mainSequence;
})();
