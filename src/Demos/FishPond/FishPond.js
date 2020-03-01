(function ()
{
	"use strict";

	const FishElement = document.getElementById("SVG_Fish"),
		PectoralFinElement = document.getElementById("PectoralFin"),
		SwimRate = .2, SwimSegmentEasing = Concert.EasingFunctions.QuadInOut,
		RandomSwimInterval_Min = 5000, RandomSwimInterval_Max = 10000,
		FishTotalWidth = 100, FishTotalHeight = 37, GrowthRate = 0.1,
		FishCenterOffsetX = 50, FishCenterOffsetY = 18,
		PectoralFinOffsetX = 80, PectoralFinOffsetY = 62, FinFlapTime = 250, FinFlapAngle = 45,
		FinFlapEasing = Concert.EasingFunctions.QuadIn,
		Background = document.getElementById("Pond"),
		ResetButton = document.getElementById("ResetButton");


	const Fish = (function(fishElement, pectoralFinElement, swimRate)
	{
		const PathType =
			{
				AppendPath: 0,
				ChangeCourse: 1
			};
		
		
		let currentDestination = null, futureDestinations = [],
			movementSequence = null, currentRandomTimer = null,
			fishSizeMultiplier = 1, uneatenFood = [];


		function getCurrentCenter()
		{
			let origin = getCurrentPosition(),
				centerPosition =
					{
						x: origin.x + FishCenterOffsetX,
						y: origin.y + FishCenterOffsetY
					};
			return centerPosition;
		} // end getCurrentCenter()


		function getCurrentPosition()
		{
			let numberMatcher = /[-0123456789.]+/,
				leftPosition = Math.round(fishElement.style.left.match(numberMatcher)[0]),
				topPosition = Math.round(fishElement.style.top.match(numberMatcher)[0]);
			return { x: leftPosition, y: topPosition };
		} // end getCurrentPosition()


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


		function grow()
		{
			let currentTransform = fishElement.getAttribute("transform");
			if(typeof currentTransform === "string")
			{
				let transformParser = /scale\(([-0123456789.]+),([-0123456789.]+)\)\srotate\(([-0123456789.,]+)\)/,
					transformValues = transformParser.exec(currentTransform);
				if(transformValues !== null)
				{
					fishSizeMultiplier = Math.floor((fishSizeMultiplier + GrowthRate) * 10) / 10;
					let newTransform =
						"scale(" + (transformValues[1].charAt(0) === "-" ? "-" : "") + fishSizeMultiplier + "," + fishSizeMultiplier + ") "
						+ "rotate(" + transformValues[3] + ")";
					fishElement.setAttribute("transform", newTransform);
				}
			}
		} // end redraw()


		function initialize()
		{
			fishElement.style.left = "0px";
			fishElement.style.top = "0px";
		} // initialize()


		function begin()
		{
			currentRandomTimer = null;
			generateRandomSwim();
		} // end begin()


		function eat(food)
		{
			uneatenFood.push(food.element);
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


		function reset()
		{
			if(currentRandomTimer !== null)
			{
				window.clearTimeout(currentRandomTimer);
				currentRandomTimer = null;
			}
			if(movementSequence instanceof Concert.Sequence)
			{
				movementSequence.stop();
				movementSequence = null;
			}
			futureDestinations = [];
			currentDestination = null;
			fishSizeMultiplier = 1;
			while(uneatenFood.length > 0)
			{
				let eatenFood = uneatenFood.shift();
				eatenFood.parentNode.removeChild(eatenFood);
			}

			fishElement.setAttribute("transform", "scale(1,1) rotate(0,0,0)");
			fishElement.style.left = "0px";
			fishElement.style.top = "0px";
			begin();
		} // end reset()


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
			let startOriginPoint = getCurrentPosition(),
				rawAngle = calculateAngle(getCurrentCenter(), currentDestination.position),
				flip = ((rawAngle > 90 || rawAngle < -90) ? -1 : 1),
				finalAngle = (flip === 1) ? rawAngle : flip * 180 - rawAngle,
				destinationOriginPoint =
				{
					x: currentDestination.position.x - ((flip === 1) ? FishCenterOffsetX : FishTotalWidth - FishCenterOffsetX),
					y: currentDestination.position.y - ((flip === 1) ? FishCenterOffsetY : FishTotalHeight - FishCenterOffsetY)
				},
				pathDistance = calculateDistance(startOriginPoint, destinationOriginPoint),
				swimTime = pathDistance / swimRate;

			fishElement.setAttribute(
				"transform",
				"scale(" + flip * fishSizeMultiplier + "," + fishSizeMultiplier + ")"
				+ " rotate(" + finalAngle + ",0,0)");

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
							v0: [startOriginPoint.x, startOriginPoint.y],
							v1: [destinationOriginPoint.x, destinationOriginPoint.y]
						}]
				});
			
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


		const publicInterface =
			{
				PathType: PathType,

				begin: begin,
				getCurrentCenter: getCurrentCenter,
				eat: eat,
				reset: reset,
				swimTo: swimTo
			};

		initialize();
		return publicInterface;
	})(FishElement, PectoralFinElement, SwimRate); // end Fish singleton


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
			let clickLocation = { x: eventObject.clientX, y: eventObject.clientY },
				currentLocation = Fish.getCurrentCenter();
			if(clickLocation.x !== currentLocation.x || clickLocation.y !== currentLocation.y)
				Fish.eat(new FishFood(clickLocation, Background), Fish.PathType.AppendPath);
		}
	ResetButton.onclick =
		function(e)
		{
			Fish.reset();
			e.stopPropagation();
		};

	Fish.begin();
})();
