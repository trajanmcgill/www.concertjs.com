/* exported demoController */
var demoController =
(function ()
{
	"use strict";

	// Set up the parameters for this demo animation.
	const beatTiming = [1267, 1883, 2533, 3183, 3800, 4450, 5033, 5717, 6333, 6983, 7583, 8283, 8917, 9583, 10200, 10933, 11583, 12300, 12867, 13617, 14233, 14900, 15517, 16200, 16850, 17533, 18150, 18850, 19483, 20150, 20750, 21417, 22050, 22750, 23333, 24000, 24650, 25267, 25967],
		clapTiming = [1267, 1417, 1883, 2533, 2683, 3183, 3800, 3950, 4450, 5033, 5217, 5717, 6333, 6483, 6983, 7583, 7767, 8283, 8917, 9100, 9583, 10200, 10417, 10933, 11583, 11750, 12300, 12867, 13033, 13617, 14233, 14400, 14900, 15517, 15683, 16200, 16850, 17017, 17533, 18150, 18317, 18850, 19483, 19650, 20150, 20750, 20917, 21417, 22050, 22233, 22750, 23333, 24000, 24650, 25267, 25600, 25967],
		lyricsTiming = [0, 5683, 6283, 8267, 8600, 8917, 10933, 11583, 12883, 13250, 13600, 16183, 16833, 18133, 18483, 18833, 21333, 21683, 22017, 23683, 24317, 24633, 26450],
		box0StartColor = "#00000000", box0HitColor = "#ffffffff", box0FadeColor = "#ff000000",
		box1StartColor = "#00000000", box1HitColor = "#ffffffff", box1FadeColor = "#00ff0000",
		box2StartColor = "#00000000", box2HitColor = "#ffffffff", box2FadeColor = "#0000ff00",
		fadeTime = 1000,
		beatBatonPositions = [[100, 140], [200, 80], [0, 80], [100, 0]];

	const video = document.getElementById("MusicVideo"); // Get the element to which the animation is being synchronized.

	// getWordPositions: Pull all the individual words out of a text node.
	// Returns an array of objects corresponding to the words found and their locations.
	function getWordPositions(textNode)
	{
		let wordRegEx = /[a-z'-]+/gi,
			textContent = textNode.textContent,
			currentMatch, wordPositions = [];
	
		while((currentMatch = wordRegEx.exec(textContent)) !== null)
		{
			wordPositions.push(
				{
					node: textNode,
					start: wordRegEx.lastIndex - currentMatch[0].length,
					end: wordRegEx.lastIndex
				});
		}

		return wordPositions;
	} // end getWordPositions()


	// extractWordPositions: Run a depth-first search on the tree below (and including) the passed-in HTML node,
	// returning an array of all the nodes and start and end positions of all the words within the text nodes in that node tree.
	function extractWordPositions(rootNode)
	{
		let allWordPositions = [], extracting = true,
			currentNode = rootNode, currentNodeExhausted = false;
		
		while (extracting)
		{
			if (currentNodeExhausted)
			{
				// This node and all its descendents have been searched already.

				if (currentNode === rootNode)
					extracting = false; // If the root node is fully searched, there isn't any more searching to be done. Quit searching.
				else if (currentNode.nextSibling !== null)
				{
					// Otherwise, move on to searching the next sibling if there is one.
					currentNode = currentNode.nextSibling;
					currentNodeExhausted = false;
				}
				else
					currentNode = currentNode.parentNode; // Otherwise, pop back up a level to the parent.
				// Note that since we only move up a level when all the siblings at this level are done, moving up means
				// the immediate parent is done as well, so in that case we leave currentNodeExhausted set to true.
			}
			else
			{
				// This node isn't exhausted yet.

				// Get all the words in the current node if it is a text node, and add them to the array of all word positions.
				if (currentNode.nodeType === Node.TEXT_NODE)
					getWordPositions(currentNode).forEach(function(wordPosition) { allWordPositions.push(wordPosition); });
				
				// Move to the next child level down and continue the search. If there is none, this node is exhausted.
				if (currentNode.childNodes.length > 0)
					currentNode = currentNode.childNodes[0];
				else
					currentNodeExhausted = true;
			}
		} // end while (extracting)

		return allWordPositions;
	} // end extractWordPositions()


	// selectionApplicator: Custom applicator function for use by Concert.js transformations.
	// This one sets the windows's selected text based on the passed in value object,
	// which is expected to contain start and end points for the text to be selected.
	function selectionApplicator(target, feature, value)
	{
		let selection = window.getSelection(),
			range = document.createRange();

		selection.removeAllRanges(); // Remove any present text selections in the window.
		
		if(value.start !== null) // Allow for passing in a null value; treat that as selecting nothing at all.
		{
			// Extract the start and end points for the selection from the value object,
			// define the range based on those, and select that range.

			range.setStart(value.start.node, value.start.position);
			range.setEnd(value.end.node, value.end.position);

			selection.addRange(range);
		}
	} // end selectionApplicator()


	// getLyricsTransformations: Define and return a transformation set for the selection of lyrics in time with the video.
	// Returns an array of transformations ready to add to a Concert.js sequence.
	function getLyricsTransformations()
	{
		// Get all the individual word positions that exist inside the TextArea element on the page.
		const wordPositions = extractWordPositions(document.getElementById("TextArea"));

		// Create an array to store the values that will be applied in the animation.
		// Loop through all the words, for each one adding a value that corresponds
		// to that word's text position.
		// The very first and last selections should be nothing at all, since each word
		// is only being selected while being sung.
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

		// Create the object defining the lyrics selection animation.
		let lyricsTransformations =
			{
				// Target, feature, and unit aren't really applicable to the lyrics animation,
				// and its custom applicator function doesn't need them.
				target: null,
				feature: null,
				unit: null,

				applicator: selectionApplicator, // Use our custom applicator function to set the text selection.
				calculator: Concert.Calculators.Discrete, // Anything other than Discrete wouldn't make sense-- we aren't interpolating values but applying one then another in succession.
				easing: Concert.EasingFunctions.ConstantRate, // With no interpolation happening at all, it doesn't really matter what we use here.
				keyframes:
				{
					times: lyricsTiming, // The selections change at the moments defined in this array, which contains the times when each word is sung.
					values: selectionAnimationValues // Use the array we just constructed of word positions corresponding to the times in lyricsTiming.
				}
			};
		
		return [lyricsTransformations]; // For consistency's sake, all the transformation construction functions return arrays.
	} // end getLyricsTransformations()


	// getBeatTransformations: Define and return a transformation set for the movement of the beat marker.
	// Returns an array of transformations ready to add to a Concert.js sequence.
	function getBeatTransformations()
	{
		let animationTimes = [beatTiming[0] - (beatTiming[1] - beatTiming[0])], // Array of keyframe times. Define the first one so motion starts one beat's worth of time before the initial downbeat. 
			movementValues = [beatBatonPositions[3]], // Array of positional values for the beat marker. Define the first one so that we start in the up-beat position (beat 4, a.k.a. array position 3).
			textValues = ["0"], // Array of text values for the beat marker. Define the first one so it starts by indicating "0" prior to the rhythm and music starting.
			beatMarker = document.getElementById("Conductor");
		
		// Build the full array of keyframe times and values for movement of the beat marker,
		// using the earlier-defined constants beatTiming (the moments in time where the beats occur in the music)
		// and beatBatonPositions (the position values to apply for each of the four beats in each measure).
		// Also build the full array of text values that will show on the beat marker at each of those times.
		for(let i = 0; i < beatTiming.length; i++)
		{
			let beatNumber = i % beatBatonPositions.length; // Figure out which beat of the measure this beat is.
			animationTimes.push(beatTiming[i]); // Add a keyframe time for this beat.
			movementValues.push(beatBatonPositions[beatNumber]); // Add the beat marker position value for this keyframe.
			textValues.push((beatNumber + 1).toString()); // Add the beat marker text value for this keyframe.
		}

		// Create the object defining the beat marker movement animation.
		let movementTransformations =
			{
				target: beatMarker,

				// We're animating two features at once.
				// Note that each position value (as ultimately defined in the constant beatBatonPositions)
				// is also actually an array of two values, so at each frame, the array of values will be
				// applied to the array of features.
				feature: ["left", "top"],

				unit: "px",
				applicator: Concert.Applicators.Style, // "left" and "top" are CSS styles of the beatMarker object, so use the Style applicator.
				calculator: Concert.Calculators.Linear,
				easing: Concert.EasingFunctions.QuadIn,
				keyframes: { times: animationTimes, values: movementValues }
			};
		
		// Create the object defining the beat marker text animation.
		let textTransformations =
		{
			target: beatMarker,
			feature: ["innerHTML"],
			unit: null,
			applicator: Concert.Applicators.Property, // "innerHTML" is a plain javascript property of the beatMarker object, so use the Property applicator.
			calculator: Concert.Calculators.Discrete, // No interpolation; just apply the current value.
			easing: Concert.EasingFunctions.ConstantRate, // With no interpolation happening at all, it doesn't really matter what we use here.
			keyframes: { times: animationTimes, values: textValues }
		};
	
		return [movementTransformations, textTransformations]; // Return both of these objects to add to the sequence.
	} // end getBeatTransformations()


	// getClapTransformations: Define and return a transformation set for the color changes on the clap markers.
	// Returns an array of transformations ready to add to a Concert.js sequence.
	function getClapTransformations()
	{
		// Create three arrays, one for the animation segments of each of the three clap marker boxes.
		// For each one, add a segment at the very beginning to set up the starting color values (as defined in constants above).
		let box0Segments = [{ t0: 0, t1: 0, v0: box0StartColor, v1: box0StartColor }],
			box1Segments = [{ t0: 0, t1: 0, v0: box1StartColor, v1: box1StartColor }],
			box2Segments = [{ t0: 0, t1: 0, v0: box2StartColor, v1: box2StartColor }];

		// Build the full array of animation segment times and start/end values,
		// corresponding to the moments of each clap as defined in the clapTiming constant.
		for(let i = 0; i < clapTiming.length; i++)
		{
			let currentClapTime = clapTiming[i], // Get the time this clap occurs.
				currentBox = i % 3; // Which box indicates the clap rotates, so each box gets every third clap.
			
			// For whichever is the current box, add a segment definition indicating a start and end time (t0 and t1)
			// and a start and end value (v0 and v1).
			if(currentBox === 0)
				box0Segments.push({ t0: currentClapTime, t1: currentClapTime + fadeTime, v0: box0HitColor, v1: box0FadeColor });
			else if(currentBox === 1)
				box1Segments.push({ t0: currentClapTime, t1: currentClapTime + fadeTime, v0: box1HitColor, v1: box1FadeColor });
			else
				box2Segments.push({ t0: currentClapTime, t1: currentClapTime + fadeTime, v0: box2HitColor, v1: box2FadeColor });
		}

		// Create the transformation set definition for the first clap marker box.
		let box0Transformations =
			{
				target: document.getElementById("ClapBox0"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color, // This calculator is used for interpolating color values (including alpha channel)
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box0Segments
			};

		// Create the transformation set definition for the first clap marker box.
		let box1Transformations =
			{
				target: document.getElementById("ClapBox1"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color, // This calculator is used for interpolating color values (including alpha channel)
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box1Segments
			};
		
		// Create the transformation set definition for the first clap marker box.
		let box2Transformations =
			{
				target: document.getElementById("ClapBox2"),
				feature: "background-color",
				unit: null,
				applicator: Concert.Applicators.Style,
				calculator: Concert.Calculators.Color, // This calculator is used for interpolating color values (including alpha channel)
				easing: Concert.EasingFunctions.QuadInOut,
				segments: box2Segments
			};

		return [box0Transformations, box1Transformations, box2Transformations]; // Return the transformation set objects to add to the sequence.
	} // end getClapTransformations()


	// buildAnimation: Assemble the entire video synchronization demo animation from all of its pieces.
	// Returns the Concert.Sequence object, fully set up and wired to events so that it runs and seeks at the appropriate times.
	function buildAnimation()
	{
		// Assemble an array of all the transformations in the entire animation.
		let transformationSet =
			getLyricsTransformations()
			.concat(getBeatTransformations())
			.concat(getClapTransformations());

		// Create a sequence object. This is the basic object used for everything.
		let sequence = new Concert.Sequence();
		
		// Add the transformation set to the sequence.
		sequence.addTransformations(transformationSet);

		// Wire up the event handlers.
		// We want the animation to be running whenever the video is running,
		// stopped whenever the video is stopped (including reeaching its end),
		// and to jump to the appropriate spot whenever the user seeks to a new position.
		video.onplay = function() { sequence.syncTo(video); };
		video.onpause = video.onended = function() { sequence.stop(); };
		video.onseeked = function() { sequence.seek(video.currentTime * 1000); };

		return sequence;
	} // end buildAnimation()


	// Call the above function to build an animation.
	let mainSequence = buildAnimation();


	// Object for the main Concert.js page to be able to stop or enable this demo
	// when shifting between demo tabs.
	const controllerObject =
		{
			enable: function () { },
			
			stop: function ()
			{
				video.pause();
				mainSequence.stop();
				video.currentTime = 0;
				mainSequence.seek(0);
			}
		}

	return controllerObject;
})();
