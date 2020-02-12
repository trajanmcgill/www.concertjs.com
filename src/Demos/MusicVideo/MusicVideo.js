/* exported demoSequence */

var demoSequence =
(function ()
{
	"use strict";

	// Set up the parameters for this demo animation.
	const beatTiming = [1267, 1883, 2533, 3183, 3800, 4450, 5033, 5717, 6333, 6983, 7583, 8283, 8917, 9583, 10200, 10933, 11583, 12300, 12867, 13617, 14233, 14900, 15517, 16200, 16850, 17533, 18150, 18850, 19483, 20150, 20750, 21417, 22050, 22750, 23333, 24000, 24650, 25267, 25967];
	const clapTiming = [1267, 1417, 1883, 2533, 2683, 3183, 3800, 3950, 4450, 5033, 5217, 5717, 6333, 6483, 6983, 7583, 7767, 8283, 8917, 9100, 9583, 10200, 10417, 10933, 11583, 11750, 12300, 12867, 13033, 13617, 14233, 14400, 14900, 15517, 15683, 16200, 16850, 17017, 17533, 18150, 18317, 18850, 19483, 19650, 20150, 20750, 20917, 21417, 22050, 22233, 22750, 23333, 24000, 24650, 25267, 25600, 25967];
	const lyricsTiming = [0, 5683, 6283, 8267, 8600, 8917, 10933, 11583, 12883, 13250, 13600, 16183, 16833, 18133, 18483, 18833, 21333, 21683, 22017, 23683, 24317, 24633, 26450];

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


	function selectionApplicator(target, feature, value)
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


	function getLyricsTransformations()
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

		let lyricsTransformations =
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
		
		return [lyricsTransformations];
	} // end getLyricsTransformations()


	function getBeatTransformations()
	{
		let beatPositions = [[100, 140], [200, 80], [0, 80], [100, 0]],
			animationTimes = [beatTiming[0] - (beatTiming[1] - beatTiming[0])],
			movementValues = [beatPositions[3]],
			textValues = ["0"];
		
		for(let i = 0; i < beatTiming.length; i++)
		{
			let beatNumber = i % beatPositions.length;
			animationTimes.push(beatTiming[i]);
			movementValues.push(beatPositions[beatNumber]);
			textValues.push((beatNumber + 1).toString());
		}

		let movementTransformations =
			{
				target: document.getElementById("Conductor"),
				feature: ["left", "top"],
				unit: "px",
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Linear,
				easing: Concert.EasingFunctions.QuadIn,
				keyframes: { times: animationTimes, values: movementValues }
			};
		
		let textTransformations =
		{
			target: document.getElementById("Conductor"),
			feature: ["innerHTML"],
			unit: null,
			applicator: Concert.Applicators.Property,
			calculator: Concert.Calculators.Discrete,
			easing: Concert.EasingFunctions.ConstantRate,
			keyframes: { times: animationTimes, values: textValues }
		};
	
		return [movementTransformations, textTransformations];
	} // end getBeatTransformations()


	function getClapTransformations()
	{
		const fadeTime = 1000;

		let box0Segments = [], box1Segments = [], box2Segments = [];

		for(let i = 0; i < clapTiming.length; i++)
		{
			let currentClapTime = clapTiming[i],
				currentBox = i % 3,
				currentSegment = { t0: currentClapTime, t1: currentClapTime + fadeTime, v0: "#ffffff", v1: "#000000" };
			if(currentBox === 0)
				box0Segments.push(currentSegment);
			else if(currentBox === 1)
				box1Segments.push(currentSegment);
			else
				box2Segments.push(currentSegment);
		}

		let box0Transformations =
			{
				target: document.getElementById("ClapBox0"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color,
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box0Segments
			};

		let box1Transformations =
			{
				target: document.getElementById("ClapBox1"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color,
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box1Segments
			};
		
		let box2Transformations =
			{
				target: document.getElementById("ClapBox2"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color,
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box2Segments
			};

		return [box0Transformations, box1Transformations, box2Transformations];
	} // end getClapTransformations()


	function buildAnimation()
	{
		const video = document.getElementById("MusicVideo");

		let transformationSet =
			getLyricsTransformations()
			.concat(getBeatTransformations())
			.concat(getClapTransformations());

		// Create a sequence object. This is the basic object used for everything.
		let sequence = new Concert.Sequence();
		
		// All the animation segments added below will use these settings.
		//sequence.setDefaults({ unit: "px", applicator: Concert.Applicators.Style, calculator: Concert.Calculators.Linear, easing: easingFunction });

		// Add the now-fully-generated transformation set to the sequence.
		sequence.addTransformations(transformationSet);

		video.onplay = function() { sequence.syncTo(video); };
		video.onpause = video.onended = function() { sequence.stop(); };
		video.onseeked = function() { sequence.seek(video.currentTime * 1000); };

		return sequence;
	} // end buildAnimation()


	// Call the above function to build an animation.
	let mainSequence = buildAnimation();

	// Wire the "Go" button to the sequence's begin() method.
	//document.getElementById("GoButton").onclick = function () { mainSequence.begin(); };

	// There isn't actually any need in this case to return the sequence object and set (as we do above)
	// a global (window) variable to it. We just do this here so that if the user of this demo wants to
	// open a console and play with the sequence object, it will be globally available within its frame.
	return mainSequence;
})();
