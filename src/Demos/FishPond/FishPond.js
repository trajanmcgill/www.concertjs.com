(function ()
{
	"use strict";

	const FishElement = document.getElementById("Fish"),
		SwimRate = .2, SwimSegmentEasing = Concert.EasingFunctions.QuadInOut,
		Background = document.getElementById("Everything");

	const Fish = (function(fishElement, swimRate)
	{
		const PathType =
			{
				AppendPath: 0,
				ChangeCourse_BrakeAndChange: 1,
				ChangeCourse_Gradual: 2,
				ChangeCourse_Sudden: 3
			};
		
		let currentStartingPoint = null, currentDestination = null,
			futureDestinations = [], movementSequence = null;

		function getCurrentPosition()
		{
			let boundingRect = fishElement.getBoundingClientRect();
			return { x: boundingRect.left, y: boundingRect.top };
		} // end getCurrentPosition()

		function calculateDistance(startPosition, endPosition)
		{
			return Math.sqrt(Math.pow(endPosition.x - startPosition.x, 2) + Math.pow(endPosition.y - startPosition.y, 2));
		} // end calculateDistance()

		function calculatePositionAlongLine(lineStart, linePoint2, distance)
		{

		} // end calculatePositionAlongLine()

		function calculateCurrentRate_QuadInOut(currentTime, startTime, endTime, startPosition, endPosition)
		{
			let halfwayTime = (endTime - startTime) / 2,
				distance = calculateDistance(startPosition, endPosition),
				rate = distance * (1 / (endTime - halfwayTime) + halfwayTime / Math.pow(endTime - halfwayTime, 2)) - currentTime * distance / Math.pow(endTime - halfwayTime, 2);
			return rate;
		} // end calculateCurrentRate_QuadInOut()

		function swimNextSegment()
		{
			if(movementSequence instanceof Concert.Sequence)
				movementSequence.stop();
			
			if(futureDestinations.length < 1)
			{
				movementSequence = null;
				return;
			}
			
			currentDestination = futureDestinations.pop();
			currentStartingPoint = getCurrentPosition();

			let pathDistance = calculateDistance(currentStartingPoint, currentDestination),
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
							v0: [currentStartingPoint.x, currentStartingPoint.y],
							v1: [currentDestination.x, currentDestination.y]
						}]
				});
			movementSequence.begin({ onAutoStop: swimNextSegment });
		} // end swimNextSegment()

		function swimTo(endPosition, path)
		{
			if(path === PathType.AppendPath)
				futureDestinations.push(endPosition);
			else if(path === PathType.ChangeCourse_BrakeAndChange)
			{
				if(movementSequence instanceof Concert.Sequence)
				{
					let movementRate =
						calculateCurrentRate_QuadInOut(
							movementSequence.getCurrentTime(),
							movementSequence.getStartTime(), movementSequence.getEndTime(),
							currentStartingPoint, currentDestination);
					// ADD CODE HERE
				}
				else
					swimTo(endPosition, PathType.ChangeCourse_Sudden);
			}
			else if(path === PathType.ChangeCourse_Gradual)
			{
				// ADD CODE HERE
			}
			else
				futureDestinations = [endPosition];
			
			if(futureDestinations.length === 1)
				swimNextSegment();
		} // end swimTo()

		const publicInterface =
			{
				PathType: PathType,
				swimTo: swimTo
			};

		return publicInterface;
	})(FishElement, SwimRate);

	Background.onclick =
		function(eventObject)
		{
			Fish.swimTo({ x: eventObject.clientX, y: eventObject.clientY }, Fish.PathType.ChangeCourse_Sudden);
		}
})();
