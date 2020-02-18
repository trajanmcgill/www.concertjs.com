(function ()
{
	"use strict";

	const BeginButton = document.getElementById("BeginButton"),
		FollowButton = document.getElementById("FollowButton"),
		SyncToButton = document.getElementById("SyncToButton"),
		StopButton =  document.getElementById("StopButton"),
		VideoElement = document.getElementById("MovingBoxVideo"),
		MovingBox = document.getElementById("MovingBox"),
		StatusBox = document.getElementById("StatusBox"),
		SeekInput = document.getElementById("SeekInput"),
		SeekButton =  document.getElementById("SeekButton");

	function showStatus(isRunning)
	{ StatusBox.innerHTML = "Running: " + (isRunning === true); }

	let sequence = new Concert.Sequence();
	sequence.setDefaults({ applicator: Concert.Applicators.Style, unit: "px" });

	let animation =
	{
		target: MovingBox, feature: "left",
		keyframes: { times: [0, 5000], values: [0, 270] }
	};

	let params = { onAutoStop: function() { showStatus(false); } };

	sequence.addTransformations(animation);

	BeginButton.onclick =
		function ()
		{
			showStatus(true);

			sequence.begin(params);
			// equivalent to:
			//   sequence.run(
			//   {
			//     synchronizeTo: null, initialSeek: 0,
			//     timeOffset: null, autoStopAtEnd: true,
			//     [plus whatever properties are set in the params variable]
			//   });
		};

	FollowButton.onclick =
		function ()
		{
			showStatus(true);

			sequence.follow(VideoElement, params);
			// equivalent to:
			//   sequence.run(
			//	 {
			//     synchronizeTo: VideoElement, initialSeek: null,
			//     timeOffset: null, autoStopAtEnd: false,
			//     [plus whatever properties are set in the params variable]
			//   });
		};

	SyncToButton.onclick =
		function ()
		{
			showStatus(true);

			sequence.syncTo(VideoElement, params);
			// equivalent to:
			//   sequence.run(
			//	 {
			//     synchronizeTo: VideoElement, initialSeek: null,
			//     timeOffset: 0, autoStopAtEnd: false,
			//     [plus whatever properties are set in the params variable]
			//   });
		};

	StopButton.onclick = function () { sequence.stop(); showStatus(false); };
	
	SeekButton.onclick =
		function ()
		{
			let position = parseInt(SeekInput.value);
			sequence.seek(isNaN(position) ? 0 : position);
		};
	
	SeekInput.onkeyup =
		function (event)
		{
			if (event.keyCode === 13)
				SeekButton.click();
		};
})();
