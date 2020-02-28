(function ()
{
	"use strict";

	const FishElement = document.getElementById("Fish"),
		SwimRate = .2, SwimSegmentEasing = Concert.EasingFunctions.QuadInOut,
		RandomSwimInterval_Min = 5000, RandomSwimInterval_Max = 10000,
		Background = document.getElementById("Everything");

	let FishBoundingRect = FishElement.getBoundingClientRect();

	const Fish = (function(fishElement, swimRate)
	{
		const PathType =
			{
				AppendPath: 0,
				ChangeCourse: 1
			};
		
		
		let currentDestination = null, futureDestinations = [],
			movementSequence = null, currentRandomTimer = null;


		function getCurrentPosition()
		{
			let boundingRect = fishElement.getBoundingClientRect();
			return { x: boundingRect.left, y: boundingRect.top };
		} // end getCurrentPosition()


		function calculateDistance(startPosition, endPosition)
		{
			return Math.sqrt(Math.pow(endPosition.x - startPosition.x, 2) + Math.pow(endPosition.y - startPosition.y, 2));
		} // end calculateDistance()


		function doRandomSwim()
		{
			let backgroundRect = Background.getBoundingClientRect(),
				randomX = Math.random() * backgroundRect.width,
				randomY = Math.random() * backgroundRect.height;
			swimTo({ x: randomX, y: randomY }, PathType.AppendPath, null);
		} // end doRandomSwim()


		function generateRandomSwim()
		{
			let randomTimerDuration = RandomSwimInterval_Min + Math.floor((1 + RandomSwimInterval_Max - RandomSwimInterval_Min) * Math.random());
			currentRandomTimer = window.setTimeout(doRandomSwim, randomTimerDuration);
		} // end generateRandomSwim()


		function begin()
		{
			currentRandomTimer = null;
			generateRandomSwim();
		} // end begin()


		function eat(food)
		{
			Fish.swimTo(
				food.position,
				Fish.PathType.AppendPath,
				function() { food.element.parentNode.removeChild(food.element); });
		} // end eat()


		function swimNextSegment()
		{
			if(movementSequence instanceof Concert.Sequence)
			{
				movementSequence.stop();
				movementSequence = null;
			}
			
			if(futureDestinations.length < 1)
			{
				currentDestination = null;
				generateRandomSwim();
				return;
			}
			
			currentDestination = futureDestinations.shift();

			let startingPoint = getCurrentPosition(),
				pathDistance = calculateDistance(startingPoint, currentDestination.position),
				swimTime = pathDistance / swimRate;
			
			movementSequence = new Concert.Sequence();
			movementSequence.addTransformations(
				{
					target: fishElement,
					feature: ["left", "top"],
					unit: "px",
					applicator: Concert.Applicators.Style,
					easing: SwimSegmentEasing,
					segments:
						[{
							t0: 0,
							t1: swimTime,
							v0: [startingPoint.x, startingPoint.y],
							v1: [currentDestination.position.x, currentDestination.position.y]
						}]
				});
			
			movementSequence.begin(
				{
					onAutoStop:
						function()
						{
							if(currentDestination.afterAction)
								currentDestination.afterAction();
							swimNextSegment();
						}
				});
		} // end swimNextSegment()


		function swimTo(endPosition, path, afterAction)
		{
			if(currentRandomTimer !== null)
			{
				window.clearTimeout(currentRandomTimer);
				currentRandomTimer = null;
			}

			let offsetPosition =
				{
					x: endPosition.x - FishBoundingRect.width / 2,
					y: endPosition.y - FishBoundingRect.height / 2
				};
			let newDestination =
				{
					position: offsetPosition,
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


		const publicInterface =
			{
				PathType: PathType,

				begin: begin,
				eat: eat,
				swimTo: swimTo
			};

		return publicInterface;
	})(FishElement, SwimRate); // end Fish singleton


	function FishFood(position, backgroundElement)
	{
		let element = document.createElement("div");
		element.className = "FishFood";
		backgroundElement.appendChild(element);
		let elementRect = element.getBoundingClientRect();
		element.style.left = (position.x - elementRect.width / 2) + "px";
		element.style.top = (position.y - elementRect.height / 2) + "px";

		this.position = position;
		this.element = element;
	} // end FishFood constructor


	Background.onclick =
		function(eventObject)
		{
			let clickLocation = { x: eventObject.clientX, y: eventObject.clientY };
			Fish.eat(new FishFood(clickLocation, Background), Fish.PathType.AppendPath);
		}
	Fish.begin();
})();
