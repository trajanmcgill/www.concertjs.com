(function ()
{
	"use strict";

	// Define sizes and rates and such.
	const MissileHeight = 15, ShipNoseOffset = 19, ShipWidth = 75,
		ShipMovementDuration = 1500, ShipMovementAmount = 224,
		MissileLeftRightDuration = 1000,
		Directions = { Up: -1, None: 0, Down: 1 };
	
	// Grab references to page elements for use throughout the code.
	const BackgroundArea = document.getElementById("BackgroundArea"),
		Ship = document.getElementById("Ship"),
		GoButton = document.getElementById("GoButton"),
		FireButton = document.getElementById("FireButton"),
		StopButton = document.getElementById("StopButton");

	// Variable to store the present movement direction of the spaceship.
	let currentDirection = Directions.None;

	// Define a sequence which animates the ship moving downward.
	let shipDownSequence = new Concert.Sequence();
	shipDownSequence.addTransformations(
		{
			target: Ship,
			feature: "top",
			applicator: Concert.Applicators.Style,
			unit: "px",
			keyframes: { times: [0, ShipMovementDuration], values: [0, ShipMovementAmount] }
		});
	
	// Define a sequence which animates the ship moving upward.
	let shipUpSequence = new Concert.Sequence();
	shipUpSequence.addTransformations(
		{
			target: Ship,
			feature: "top",
			applicator: Concert.Applicators.Style,
			unit: "px",
			keyframes: { times: [0, ShipMovementDuration], values: [ShipMovementAmount, 0] }
		});
	
	// Define a sequence which animates a missile object with two transformations:
	//    1) A left-to-right movement with a known start and end point
	//    2) An up-or-down movement whose start and end values will have to be generated later
	// Note that this sequence has no target. It will never actually be used; only cloned
	// onto HTML element objects created later.
	let missileSequence = new Concert.Sequence();
	missileSequence.setDefaults({ applicator: Concert.Applicators.Style, unit: "px" });
	missileSequence.addTransformations(
		[
			{
				target: null,
				feature: "left",
				easing: Concert.EasingFunctions.QuadIn,
				keyframes: { times: [0, MissileLeftRightDuration], values: [ShipWidth, 480]}
			},
			{
				target: null,
				feature: "top",
				easing: Concert.EasingFunctions.ConstantRate,
				keyframes:
				{
					times: [0, ShipMovementDuration],

					// Here we see the new thing introduced in this tutorial step.
					// getMissileStartTop and getMissileEndTop are functions defined below.
					// At the moment this sequence is begun, these functions will be called
					// to generate start and end values for the transformation.
					valueGenerators: [getMissileStartTop, getMissileEndTop]
				}
			}
		]);

	// Function which runs the downward-moving ship sequence specifying that upon completion
	// it should run the upward-moving ship sequence.
	function runShipDownSequence()
	{
		currentDirection = Directions.Down;
		shipDownSequence.begin({ onAutoStop: runShipUpSequence });
	}

	// Function which runs the upward-moving ship sequence specifying that upon completion
	// it should run the downward-moving ship sequence.
	function runShipUpSequence()
	{
		currentDirection = Directions.Up;
		shipUpSequence.begin({ onAutoStop: runShipDownSequence });
	}

	// Function which calculates the vertical position at which a new missile should appear,
	// based on the current position of the spaceship.
	function getMissileStartTop()
	{
		let shipBoundingRect = Ship.getBoundingClientRect();
		return Math.round(shipBoundingRect.top + ShipNoseOffset - MissileHeight / 2);
	}

	// Function which calculates the vertical position at which a new missile's animation
	// would end due to the upward or downward momentum imparted by the motion of the
	// ship from which it is fired. If the ship is moving when the missile is fired,
	// we want the missile's end point to reflect vertical movement at the same rate
	// and in the same direction.
	function getMissileEndTop()
	{
		let startTop = getMissileStartTop();
		if (currentDirection === Directions.Up)
			return startTop - ShipMovementAmount;
		else if (currentDirection === Directions.Down)
			return startTop + ShipMovementAmount;
		else
			return startTop;
	}

	// Function to create a new missile, clone the missile movement sequence onto it,
	// and begin its animation.
	// The missile gets removed at the end point of its animation (which is offscreen)
	// to avoid piling up lots of extra useless divs and sequences and wasting memory.
	function fireMissile()
	{
		let missileTopPosition = getMissileStartTop(),
			missileDiv = document.createElement("div");
		missileDiv.className = "Missile";
		missileDiv.style.left = ShipWidth + "px";
		missileDiv.style.top = missileTopPosition + "px";
		BackgroundArea.appendChild(missileDiv);

		let newMissileSequence = missileSequence.clone(function() { return missileDiv; });
		newMissileSequence.begin({ onAutoStop: function() { missileDiv.remove(); } });
	}

	// Wire up the event handlers.
	GoButton.onclick = runShipDownSequence;
	FireButton.onclick = fireMissile;
	StopButton.onclick =
		function()
		{
			shipDownSequence.stop();
			shipUpSequence.stop();
			currentDirection = Directions.None;
		};
})();
