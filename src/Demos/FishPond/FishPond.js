/* exported demoController */
var demoController =
(function ()
{
	"use strict";

	// Set up values and parameters needed for this demo animation.
	const FishOuterElement = document.getElementById("SvgOuterElement"),
		FishGroup = document.getElementById("SvgGroup"),
		PectoralFinElement = document.getElementById("SvgElement_PectoralFin"),
		SwimRate = .2, SwimSegmentEasing = Concert.EasingFunctions.QuadInOut,
		RandomSwimInterval_Min = 5000, RandomSwimInterval_Max = 10000,
		StartingFishWidth = 100, StartingFishHeight = 37, ViewBoxScaleFactor = 0.125,
		StartingFishSizeMultiplier = 0.125, GrowthRate = 0.0125,
		PectoralFinOffsetX = 67, PectoralFinOffsetY = 22, FinFlapTime = 250, FinFlapAngle = 45,
		FinFlapEasing = Concert.EasingFunctions.QuadIn,
		Background = document.getElementById("Pond"),
		ResetButton = document.getElementById("ResetButton");


	// Create a singleton object to represent the swimming fish and its behavior
	const Fish = (function(fishOuterElement, fishGroupElement, pectoralFinElement, swimRate)
	{
		// ===============================================
		// -- Fish Enum Definitions

		// Represents options for ways it can move: after all queued movements, or immediately.
		const PathType =
			{
				AppendPath: 0,
				ChangeCourse: 1
			};
		
		
		// ===============================================
		// -- Fish Internal Variable Definitions
		
		const GroupTransformDefaultValues =
			{
				translateX: 0,
				translateY: 0,
				scaleX: StartingFishSizeMultiplier,
				scaleY: StartingFishSizeMultiplier,
				rotateAngle: 0,
				rotateOffsetX: 0,
				rotateOffsetY: 0
			};


		// Variables representing where the fish is headed, the Concert.js sequence for its animation,
		// a timer variable used for moving at random intervals, the present size of the fish,
		// and an array of food objects queued for eating.
		let currentDestination = null, futureDestinations = [],
			movementSequence = null, currentRandomTimer = null,
			fishSizeMultiplier = StartingFishSizeMultiplier, uneatenFood = [];
		
		
		// ===============================================
		// -- Fish Internal Function Definitions

		// Generate and apply a new SVG transform attribute string value.
		function buildFishTransformString(transformValues)
		{
			let newTransformString =
				"translate(" + transformValues.translateX + transformValues.delineator + transformValues.translateY + ") "
				+ "scale(" + transformValues.scaleX + transformValues.delineator + transformValues.scaleY + ") "
				+ "rotate(" + transformValues.rotateAngle + transformValues.delineator + transformValues.rotateOffsetX + transformValues.delineator + transformValues.rotateOffsetY + ")";
			return newTransformString;
		} // end buildFishTransformString()

		// Calculate the angle needed for the line from the specified start position to the specified end position.
		function calculateAngle(startPosition, endPosition)
		{
			let xDisplacement = endPosition.x - startPosition.x,
				yDisplacement = endPosition.y - startPosition.y,
				angle;
			
			if(yDisplacement === 0)
				angle = (xDisplacement >= 0) ? 0 : 180;
			else if(xDisplacement === 0)
				angle = (yDisplacement > 0) ? 90 : -90;
			else
				angle = ((xDisplacement < 0) ? 180 : 0) + Math.atan(yDisplacement / xDisplacement) * 180 / Math.PI;
			
			return angle;
		} // end calculateAngle()

		// Calculate the distance between the two specified positions.
		function calculateDistance(startPosition, endPosition)
		{
			return Math.sqrt(Math.pow(endPosition.x - startPosition.x, 2) + Math.pow(endPosition.y - startPosition.y, 2));
		} // end calculateDistance()

		// Return the input value if it is defined, the default value if the input value is undefined
		function coalesceUndefined(inputValue, defaultValue)
		{
			return ((typeof inputValue === "undefined") ? defaultValue : inputValue);
		} // end coalesceUndefined()

		// Come up with a random destination in the pond and swim to it.
		function doRandomSwim()
		{
			let backgroundRect = Background.getBoundingClientRect(),
				randomX = Math.random() * backgroundRect.width,
				randomY = Math.random() * backgroundRect.height;
			swimTo({ x: randomX, y: randomY }, PathType.AppendPath, null);
		} // end doRandomSwim()

		// Set a timer to do a random swim after a random interval of time has passed.
		function generateRandomSwim()
		{
			let randomTimerDuration = RandomSwimInterval_Min + Math.floor((1 + RandomSwimInterval_Max - RandomSwimInterval_Min) * Math.random());
			currentRandomTimer = window.setTimeout(doRandomSwim, randomTimerDuration);
		} // end generateRandomSwim()


		// Calculate the current transform attribute values of the fish group element
		function getCurrentGroupTransformValues()
		{
			const TranslateParser = /(?:translate\(([-0123456789.]+)(?:(,|\s+)([-0123456789.]+))?\))/,
				ScaleParser = /(?:scale\(([-0123456789.]+)(?:(,|\s+)([-0123456789.]+))?\))/,
				RotateParser = /(?:rotate\(([-0123456789.]+)(?:(,|\s+)([-0123456789.]+)(,|\s+)([-0123456789.]+))?\))/;

			let valuesToReturn =
				{
					translateX: GroupTransformDefaultValues.translateX,
					translateY: GroupTransformDefaultValues.translateY,
					scaleX: GroupTransformDefaultValues.scaleX,
					scaleY: GroupTransformDefaultValues.scaleY,
					rotateAngle: GroupTransformDefaultValues.rotateAngle,
					rotateOffsetX: GroupTransformDefaultValues.rotateOffsetX,
					rotateOffsetY: GroupTransformDefaultValues.rotateOffsetY,
					delineator: ","
				};

			let currentTransform = fishGroupElement.getAttribute("transform");

			if(typeof currentTransform === "string")
			{
				let parsedTranslateValues = TranslateParser.exec(currentTransform);
				if(parsedTranslateValues !== null)
				{
					valuesToReturn.translateX = parsedTranslateValues[1];
					valuesToReturn.delineator = coalesceUndefined(parsedTranslateValues[2], valuesToReturn.delineator);
					valuesToReturn.translateY = coalesceUndefined(parsedTranslateValues[3], valuesToReturn.translateX); // If only one value is specified, use it for both X and Y.
				}

				let parsedScaleValues = ScaleParser.exec(currentTransform);
				if(parsedScaleValues !== null)
				{
					valuesToReturn.scaleX = parsedScaleValues[1];
					valuesToReturn.delineator = coalesceUndefined(parsedScaleValues[2], valuesToReturn.delineator);
					valuesToReturn.scaleY = coalesceUndefined(parsedScaleValues[3], valuesToReturn.scaleX); // If only one value is specified, use it for both X and Y.
				}

				let parsedRotateValues = RotateParser.exec(currentTransform);
				if(parsedRotateValues !== null)
				{
					valuesToReturn.rotateAngle = parsedRotateValues[1];
					valuesToReturn.delineator = coalesceUndefined(parsedRotateValues[2], valuesToReturn.delineator);
					valuesToReturn.rotateOffsetX = coalesceUndefined(parsedRotateValues[3], valuesToReturn.rotateOffsetX);
					valuesToReturn.rotateOffsetY = coalesceUndefined(parsedRotateValues[5], valuesToReturn.rotateOffsetY);
				}
			}

			return valuesToReturn;
		} // end getCurrentGroupTransformValues()

		// Calculate the present origin position of the fish (position of its upper left corner)
		function getCurrentPosition()
		{
			let currentTransformValues = getCurrentGroupTransformValues(),
				viewBoxCoordinates = { x: currentTransformValues.translateX, y: currentTransformValues.translateY },
				worldCoordinates = { x: viewBoxCoordinates.x / ViewBoxScaleFactor, y: viewBoxCoordinates.y / ViewBoxScaleFactor },
				currentPosition =
					{
						viewBoxCoordinates: viewBoxCoordinates,
						worldCoordinates: worldCoordinates,
						flip: (currentTransformValues.scaleX < 0) ? -1 : 1,
						angle: currentTransformValues.rotateAngle
					};
			return currentPosition;
		} // end getCurrentPosition()

		// Grow the fish a little bit larger.
		function grow()
		{
			// Grow the fish by modifying its SVG transform attribute.

			// Set the new fishSizeMultiplier value to the old one plus the growth amount (truncated to the nearest thousandth).
			fishSizeMultiplier = Math.floor((fishSizeMultiplier + GrowthRate) * 1000) / 1000;

			// Get the current fish transform values, update the scale values, and apply the new set of values.
			let transformValues = getCurrentGroupTransformValues();
			transformValues.scaleX = ((transformValues.scaleX < 0) ? -1 : 1 ) * fishSizeMultiplier;
			transformValues.scaleY = fishSizeMultiplier;
			fishGroupElement.setAttribute("transform", buildFishTransformString(transformValues));
		} // end grow()

		// Set up initial values for the fish.
		function initialize()
		{
			// Set the starting location, scale, and rotation values for the fish.
			fishGroupElement.setAttribute("transform", buildFishTransformString(GroupTransformDefaultValues));
		} // initialize()

		// Generate and kick off a Concert.js animation sequence for swimming to the next destination.
		function swimNextSegment()
		{
			// If the fish is already swimming, stop it.
			if(movementSequence instanceof Concert.Sequence)
			{
				movementSequence.stop();
				movementSequence = null;
			}
			
			// If there is no queued next destination to swim to, set up the fish to do random swims
			// and then return.
			if(futureDestinations.length < 1)
			{
				currentDestination = null;
				generateRandomSwim();
				return;
			}
			
			// Get the next destination in the queue.
			currentDestination = futureDestinations.shift();

			let currentCenter = getCurrentCenter(), // Figure out where we are starting from.
				rawAngle = calculateAngle(currentCenter.worldCoordinates, currentDestination.position), // Figure out the angle from the center of the fish to the new destination.
				newFlip = ((rawAngle > 90 || rawAngle < -90) ? -1 : 1), // Determine if the fish is facing right or needs to be flipped left with a -1 scale value on the x axis.
				finalAngle = Math.abs(rawAngle) <= 90 ? rawAngle : 180 * (rawAngle < 0 ? -1 : 1) - rawAngle, // Rotation angle gets flipped too, if the fish is flipped.
				cumulativeGrowthRatio = fishSizeMultiplier / StartingFishSizeMultiplier,
				presentHalfFishViewBoxWidth = ViewBoxScaleFactor * cumulativeGrowthRatio * StartingFishWidth / 2,
				presentHalfFishViewBoxHeight = ViewBoxScaleFactor * cumulativeGrowthRatio * StartingFishHeight / 2,
				startOriginPoint =
					{
						x: currentCenter.viewBoxCoordinates.x - newFlip * presentHalfFishViewBoxWidth,
						y: currentCenter.viewBoxCoordinates.y - presentHalfFishViewBoxHeight
					},
				destinationOriginPoint =
					{
						x: currentDestination.position.x * ViewBoxScaleFactor - newFlip * presentHalfFishViewBoxWidth,
						y: currentDestination.position.y * ViewBoxScaleFactor - presentHalfFishViewBoxHeight
					},
				pathDistance = calculateDistance(currentCenter.worldCoordinates, currentDestination.position), // Figure out how far the fish is moving.
				swimTime = pathDistance / swimRate,  // Use the distance to figure out how long the animation should take.
				transformDelineator = getCurrentGroupTransformValues().delineator;

			// Flip and rotate the fish as needed to aim it at the new destination.
			fishGroupElement.setAttribute(
				"transform",
				buildFishTransformString(
					{
						translateX: startOriginPoint.x,
						translateY: startOriginPoint.y,
						scaleX: newFlip * fishSizeMultiplier,
						scaleY: fishSizeMultiplier,
						rotateAngle: finalAngle,
						rotateOffsetX: StartingFishWidth / 2,
						rotateOffsetY: StartingFishHeight / 2,
						delineator: transformDelineator
					}));

			// Create a new Concert.js sequence and add the movement to it that was just calculated above.
			movementSequence = new Concert.Sequence();
			movementSequence.addTransformations(
				{
					target: fishGroupElement,
					feature: "transform",
					unit: null,
					applicator: Concert.Applicators.SVG_ElementAttribute,
					easing: SwimSegmentEasing,

					calculator:
						function(distanceFraction, startValue, endValue)
						{
							let currentTransformValues = getCurrentGroupTransformValues(),
								newTransformString = buildFishTransformString(
									{
										translateX: (endValue.x - startValue.x) * distanceFraction + startValue.x,
										translateY: (endValue.y - startValue.y) * distanceFraction + startValue.y,
										scaleX: currentTransformValues.scaleX,
										scaleY: currentTransformValues.scaleY,
										rotateAngle: currentTransformValues.rotateAngle,
										rotateOffsetX: currentTransformValues.rotateOffsetX,
										rotateOffsetY: currentTransformValues.rotateOffsetY,
										delineator: transformDelineator
									});
							return newTransformString;
						},

					segments:
						[{
							t0: 0, t1: swimTime,
							v0: startOriginPoint, v1: destinationOriginPoint
						}]
				});
			
			// Generate transformations that move the pectoral fin, too.
			// Calculate how many flaps of the fin fit into the swim time,
			// then for each one, add a transformation to the sequence that rotates the fin.
			let finFlaps = Math.floor(swimTime / FinFlapTime);
			for(let i = 0; i < finFlaps; i++)
			{
				let finTransformation =
					{
						target: pectoralFinElement,
						feature: "transform",
						unit: null,
						applicator: Concert.Applicators.SVG_ElementAttribute,
						easing: FinFlapEasing,

						// This transformation uses a custom calculator, because the value being applied is not a simple value,
						// but an entire string that needs to be assembled from the calculated numeric value.
						calculator:
							function(distanceFraction, startValue, endValue)
							{
								let angle = startValue + distanceFraction * (endValue - startValue),
									rotateString = "rotate(" + angle + "," + PectoralFinOffsetX + "," + PectoralFinOffsetY + ")";
								return rotateString;
							},
						
						segments: [{ t0: i * FinFlapTime, t1: (i + 1) * FinFlapTime, v0: 0, v1: FinFlapAngle}]
					};
				movementSequence.addTransformations(finTransformation);
			}
			
			// Start the fish's movement.
			movementSequence.begin(
				{
					// When it reaches the end of its movement, it should invoke whatever callback function may have been supplied
					// as an action to perform after the swimming. (Such as removing the fish food after it has swum to it.)
					// Then it swims the next queued segment.
					onAutoStop:
						function()
						{
							if(currentDestination.afterAction)
								currentDestination.afterAction();
							swimNextSegment();
						}
				});
		} // end swimNextSegment()


		// ===============================================
		// -- Fish Public Function Definitions

		// Start the fish's regular behavior. (That is, kick off randomly swimming around.)
		function begin()
		{
			currentRandomTimer = null;
			generateRandomSwim();
		} // end begin()

		// Go eat a piece of fish food.
		function eat(food)
		{
			// Add the food's HTML element to a queue of uneaten food elements.
			uneatenFood.push(food.element);

			// Tell the fish to swim to the position of the specified food object, appending this swim instruction
			// to all other swim paths currently queued, and then when the swimming is done call back a function that
			// removes the food element.
			Fish.swimTo(
				food.position,
				Fish.PathType.AppendPath,
				function()
				{
					let eatenFood = uneatenFood.shift();
					eatenFood.parentNode.removeChild(eatenFood);
					grow();
				});
		} // end eat()

		// Calculate the present center point of the fish.
		function getCurrentCenter()
		{
			let currentPosition = getCurrentPosition(),
				cumulativeGrowthRatio = fishSizeMultiplier / StartingFishSizeMultiplier,
				centerByWorld =
					{
						x: currentPosition.worldCoordinates.x + currentPosition.flip * StartingFishWidth * cumulativeGrowthRatio / 2,
						y: currentPosition.worldCoordinates.y + StartingFishHeight * cumulativeGrowthRatio / 2
					},
				centerByViewBox =
					{
						x: centerByWorld.x * ViewBoxScaleFactor,
						y: centerByWorld.y * ViewBoxScaleFactor
					};
			return { viewBoxCoordinates: centerByViewBox, worldCoordinates: centerByWorld };
		} // end getCurrentCenter()

		// Set everything back to its initial state.
		function reset()
		{
			// Clear any random swimming that is set to occur.
			if(currentRandomTimer !== null)
			{
				window.clearTimeout(currentRandomTimer);
				currentRandomTimer = null;
			}

			// If the fish is in motion, stop it and remove the sequence.
			if(movementSequence instanceof Concert.Sequence)
			{
				movementSequence.stop();
				movementSequence = null;
			}

			// Clear out any swim destinations.
			futureDestinations = [];
			currentDestination = null;

			// Set the fish back to normal size.
			fishSizeMultiplier = StartingFishSizeMultiplier;

			// Remove all food from the pond.
			while(uneatenFood.length > 0)
			{
				let eatenFood = uneatenFood.shift();
				eatenFood.parentNode.removeChild(eatenFood);
			}

			// Set the actual style and SVG attributes back to their original values.
			let scaleParmString = StartingFishSizeMultiplier + "," + StartingFishSizeMultiplier
			fishGroupElement.setAttribute("transform", "scale(" + scaleParmString + ") rotate(0,0,0)");
			fishOuterElement.style.left = "0px";
			fishOuterElement.style.top = "0px";
		} // end reset()

		function swimTo(endPosition, path, afterAction)
		{
			if(currentRandomTimer !== null)
			{
				window.clearTimeout(currentRandomTimer);
				currentRandomTimer = null;
			}

			let newDestination =
				{
					position: endPosition,
					afterAction: afterAction
				};

			if(path === PathType.AppendPath)
			{
				futureDestinations.push(newDestination);
				if(currentDestination === null)
					swimNextSegment();
			}
			else
			{
				futureDestinations = [newDestination];
				swimNextSegment();
			}
		} // end swimTo()


		// Define the public interface for this object.
		const publicInterface =
			{
				PathType: PathType,

				begin: begin,
				eat: eat,
				getCurrentCenter: getCurrentCenter,
				reset: reset,
				swimTo: swimTo
			};

		// Initialize this object.
		initialize();

		return publicInterface;
	})(FishOuterElement, FishGroup, PectoralFinElement, SwimRate); // end Fish singleton


	// FishFood constructor: creates an object representing a single piece of fish food.
	function FishFood(position, backgroundElement)
	{
		// Create, add, and set up the HTML element representing the fish food.
		let element = document.createElement("div");
		element.className = "FishFood";
		backgroundElement.appendChild(element);
		let elementRect = element.getBoundingClientRect();
		// The position passed in is a center position, so the position of the top left corner gets calculated from that.
		element.style.left = (position.x - elementRect.width / 2) + "px";
		element.style.top = (position.y - elementRect.height / 2) + "px";

		// Set the values stored by this object.
		this.position = position;
		this.element = element;
	} // end FishFood constructor


	// Wire up the UI event handlers
	Background.onclick =
		function(eventObject)
		{
			// Background (the pond) got clicked. Figure out where it was clicked.
			// Create a new FishFood object and place it there, and tell the Fish object to eat it.
			let clickLocation = { x: eventObject.clientX, y: eventObject.clientY },
				currentLocation = Fish.getCurrentCenter().worldCoordinates;
			if(clickLocation.x !== Math.round(currentLocation.x) || clickLocation.y !== Math.round(currentLocation.y))
				Fish.eat(new FishFood(clickLocation, Background), Fish.PathType.AppendPath);
		}
	ResetButton.onclick =
		function(e)
		{
			// Reset button got clicked. Set everything back as it was to start with,
			// and tell the fish to begin its normal behavior.
			Fish.reset();
			e.stopPropagation();
			Fish.begin();
		};

	// Object for the main Concert.js page to be able to stop or enable this demo
	// when shifting between demo tabs.
	const controllerObject =
		{
			enable: function () { Fish.begin(); },
			stop: function () { Fish.reset(); }
		}

	return controllerObject;
})();
