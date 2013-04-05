/// <reference path="~/Source/Components/ConcertJS/Concert.min.js" />

function go()
{
	var sequence = new Concert.Sequence(
		{
			target: document.getElementById("HelloDiv"),
			feature: "left",
			applicator: Concert.Applicators.Style,
			unit: "px",
			keyframes: { times: [0, 2000], values: [0, 360] }
		});

	sequence.begin();
}