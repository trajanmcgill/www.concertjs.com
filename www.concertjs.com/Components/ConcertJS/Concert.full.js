/**
 * @file Concert.js: Easy synchronized animation with JavaScript.
 * @version 1.0.0
 * @author Trajan McGill <code@trajanmcgill.com>
 */

/** @namespace */
var Concert = (function ()
{
	"use strict";


	// Save any prior value of the global variable Concert, so the
	// user can revert to it with revertNameSpace() if there is a collision.
	var previousNameSpaceValue = Concert;


	var BaseObject = (function(){function C(){var c=this;c.thisPublic=this;var d={thisPublic:c};c.___accessProtectedMembers=function(){b = d;};}function g(){this.___accessProtectedMembers();return b;}function B(){}var b;C.extend=function(h){var c=h(g, this);B.prototype=this.prototype;c.prototype=new B();c.prototype.constructor=c;c.extend=this.extend;return c;};return C;})();


	var _Concert =
	{
		nextSequenceID: 0,

		// "Constants", things worth gathering together to avoid using magic numbers throughout the code.
		Definitions:
			{
				FallbackAutoPollerInterval: 16,

				IterationRoundTimeHalfBound: 50,

				StartingIterationsPerAsynchProcessingRound:
					{
						buildBreakPointList: 1,
						consolidateDistinctValues: 1,
						buildSortedArray: 1,
						buildDistinctSegmentList: 1,
						indexTargetSequences: 1
					}
			}, // end Definitions object definition


		// Some utility functions for use throughout.
		Util:
			{
				arraysShallowlyEqual: function (array1, array2)
				{
					var i, arrayLength = array1.length;

					if (array2.length !== arrayLength)
						return false;

					for (i = 0; i < arrayLength; i++)
					{
						if (array1[i] !== array2[i])
							return false;
					}

					return true;
				}, // end arraysShallowlyEqual()


				isArray: function (testVar)
				{
					return ((typeof testVar === "object") && (Object.prototype.toString.call(testVar) === "[object Array]"));
				}, // end isArray()


				loadObjectData: function (newPublicData, newProtectedData, publicContext, protectedContext)
				{
					var propertyName;

					for (propertyName in newPublicData) if (newPublicData.hasOwnProperty(propertyName))
						publicContext[propertyName] = newPublicData[propertyName];

					for (propertyName in newProtectedData) if (newProtectedData.hasOwnProperty(propertyName))
						protectedContext[propertyName] = newProtectedData[propertyName];
				}, // end loadObjectData()


				round: function (input, roundFactor)
				{
					return (roundFactor * Math.round(input / roundFactor));
				} // end round()
			}, // end Util singleton definition


		/**
		 * Commonly used functions for applying a value to the target of a transformation.
		 * @public
		 * @namespace
		 * @memberof Concert
		 * @property {function} Property - Applies a value to <b>any</b> target object, treating the feature as a <strong>property</strong> of the target object.
		 * @property {function} Style - Applies a value to a target <b>DOM element</b>, treating the feature as a <strong>style</strong> of the target object.
		 * @property {function} SVG_ElementAttribute - Applies a value to a target <b>SVG element</b>, treating the feature as an <strong>attribute</strong> of the target object.
		 */
		Applicators:
			{
				Property:
					function (target, feature, value)
					{
						target[feature] = value;
					},

				Style:
					function (target, feature, value, unit)
					{
						target.style[feature] = (unit === null) ? value : (value.toString() + unit);
					},

				SVG_ElementAttribute:
					function (target, feature, value, unit)
					{
						target.setAttribute(feature, (unit === null) ? value : (value.toString() + unit));
					}
			}, // end Applicator singleton / namespace definition


		/**
		 * Commonly used functions for calculating the current value to apply in the middle of a transformation based on the start and end values defined in the transformation.
		 * @public
		 * @namespace
		 * @memberof Concert
		 * @property {function} Color - Calculates a color in between the colors specified as start and end values.<br><br><em>Expected start / end values</em>: <strong>CSS color style value strings</strong>, specified in any of hex, rgb, rgba, hsl, or hsla format (start and end values must be in the same format as each other).<br><br><em>Returns</em>: <strong>A CSS color style value string</strong> in the same format as the start and end values.
		 * @property {function} Discrete - Used when output needed should jump directly from one value to another rather than gradually moving from the start value to the end value.<br><br><em>Expected start / end values</em>: <strong>(Any type)</strong><br><br><em>Returns</em>: Either the start value (if the transformation is not yet complete) or the end value (if the transformation is complete).<br><br>If the transformation has a property called <code>round</code> whose value is X the value will be treated as numeric and the return value will be rounded to the nearest multiple of X.
		 * @property {function} Linear - Calculates a value based on linear interpolation between the start and end values.<br><br><em>Expected start / end values</em>: <strong>Numeric</strong><br><br><em>Returns</em>: <strong>Numeric</strong>.<br><br>If the transformation has a property called <code>round</code> whose value is X the value will be treated as numeric and the return value will be rounded to the nearest multiple of X.<br><br><em>Note: This should not be confused with the [ConstantRate easing function]{@link Concert.EasingFunctions}. The easing function is used to determine what fraction of the transformation is complete (i.e., it affects the <em>rate</em> of the transformation), whereas the selected calculator function determines the method by which the values are calculated (i.e., numeric interpolation vs. discrete values, vs. specialized calculations such as determining what color is partway between two other colors).</em>
		 * @property {function} Rotational - Calculates a set of coordinates resulting from rotational motion.<br><br><em>Expected start / end values</em>: <strong>Numeric Array</strong>, in the form <code>[radius, angle]</code>. Additionally, the transformation must have properties called <code>center</code>, an array of the form <code>[left, top]</code> defining the center point around which the rotation takes place, and <code>offset</code>, an array of the form <code>[horizontalOffset, verticalOffset]</code> defining an offset to be added to the resulting coordinates (for instance, a center of [100, 100] with an offset of [0, 0] would rotate the upper left corner of the target object around the point [100, 100]).</code><br><br><em>Returns</em>: <strong>Numeric Array</strong> determined from calculating the current rotational position and converting it to resulting coordinates in the form <code>[left, top]</code>.
		 */
		Calculators:
			{
				Color:
					function (distanceFraction, startValue, endValue)
					{
						var i, valueLength, returnValue;

						function hexColorToDecimal(hexStr)
						{
							if (hexStr.length === 1)
								hexStr += hexStr;
							return parseInt(hexStr, 16);
						} // end hexColorToDecimal()

						function interpolateColor(color1, color2, distanceFraction)
						{
							var color1Pieces, color2Pieces, calculatedValues, i, curVal1, tempVal, interpolatedValueStr;
							var hexColors1, hexColors2;
							var rgbFunctionPattern = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$|^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i;
							var hslFunctionPattern = /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$|^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/i;
							var hexRGBPattern = /^#([0-9a-f])([0-9a-f])([0-9a-f])$|^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
							var rgbFunctionMatch = false, hslFunctionMatch = false;

							if ((color1Pieces = rgbFunctionPattern.exec(color1)) !== null)
							{
								color2Pieces = rgbFunctionPattern.exec(color2);
								rgbFunctionMatch = true;
							}
							else if ((color1Pieces = hslFunctionPattern.exec(color1)) !== null)
							{
								color2Pieces = hslFunctionPattern.exec(color2);
								hslFunctionMatch = true;
							}

							if (rgbFunctionMatch || hslFunctionMatch)
							{
								calculatedValues = [];
								for (i = 1; i < 8; i++) // skip the first element, it contains the full string match
								{
									curVal1 = color1Pieces[i];
									if (typeof curVal1 !== "undefined")
									{
										curVal1 = parseInt(curVal1, 10);
										tempVal = curVal1 + distanceFraction * (parseInt(color2Pieces[i], 10) - curVal1);
										calculatedValues.push((i < 7) ? _Concert.Util.round(tempVal, 1) : tempVal);
									}
								}

								if (rgbFunctionMatch)
									interpolatedValueStr = "rgb" + ((calculatedValues.length === 4) ? "a" : "") + "(" + calculatedValues.join() + ")";
								else
								{
									tempVal = calculatedValues[0].toString() + "," + calculatedValues[1].toString() + "%," + calculatedValues[2].toString() + "%";
									if (calculatedValues.length === 4)
										interpolatedValueStr = "hsla(" + tempVal + "," + calculatedValues[3].toString() + ")";
									else
										interpolatedValueStr = "hsl(" + tempVal + ")";
								}
							}
							else
							{
								color1Pieces = hexRGBPattern.exec(color1);
								color2Pieces = hexRGBPattern.exec(color2);
								hexColors1 = [];
								hexColors2 = [];

								for (i = 1; i < 7; i++)
								{
									tempVal = color1Pieces[i];
									if (typeof tempVal !== "undefined")
										hexColors1.push(tempVal);
									tempVal = color2Pieces[i];
									if (typeof tempVal !== "undefined")
										hexColors2.push(tempVal);
								}

								interpolatedValueStr = "#";
								for (i = 0; i < 3; i++)
								{
									curVal1 = hexColorToDecimal(hexColors1[i]);
									tempVal = _Concert.Util.round(curVal1 + distanceFraction * (hexColorToDecimal(hexColors2[i]) - curVal1), 1);
									interpolatedValueStr += ((tempVal < 16) ? "0" : "") + tempVal.toString(16);
								}
							} // end if/else on (rgbFunctionMatch || hslFunctionMatch)

							return interpolatedValueStr;
						} // end interpolateColor()

						if (_Concert.Util.isArray(startValue))
						{
							returnValue = [];
							for (i = 0, valueLength = startValue.length; i < valueLength; i++)
								returnValue.push(interpolateColor(startValue[i], endValue[i], distanceFraction));
						}
						else
							returnValue = interpolateColor(startValue, endValue, distanceFraction);

						return returnValue;
					}, // end Color Calculator function

				Discrete:
					function (distanceFraction, startValue, endValue, additionalProperties)
					{
						var i, curReturnValue, returnValue, valueLength, roundFactor, doRounding = (typeof additionalProperties.round !== "undefined");
						if (doRounding)
							roundFactor = additionalProperties.round;

						if (_Concert.Util.isArray(startValue))
						{
							returnValue = [];
							for (i = 0, valueLength = startValue.length; i < valueLength; i++)
							{
								curReturnValue = ((distanceFraction < 1) ? startValue[i] : endValue[i]);
								returnValue.push(doRounding ? _Concert.Util.round(curReturnValue, roundFactor) : curReturnValue);
							}
						}
						else
						{
							curReturnValue = ((distanceFraction < 1) ? startValue : endValue);
							returnValue = doRounding ? _Concert.Util.round(curReturnValue, roundFactor) : curReturnValue;
						}

						return returnValue;
					}, // end Discrete Calculator function

				Linear:
					function (distanceFraction, startValue, endValue, additionalProperties)
					{
						var i, valueLength, curStartValue, curCalcValue, returnValue, roundFactor, doRounding = (typeof additionalProperties.round !== "undefined");
						if (doRounding)
							roundFactor = additionalProperties.round;

						if (_Concert.Util.isArray(startValue))
						{
							returnValue = [];
							for (i = 0, valueLength = startValue.length; i < valueLength; i++)
							{
								curStartValue = startValue[i];
								curCalcValue = curStartValue + distanceFraction * (endValue[i] - curStartValue);
								returnValue.push(doRounding ? _Concert.Util.round(curCalcValue, roundFactor) : curCalcValue);
							}
						}
						else
						{
							curCalcValue = startValue + distanceFraction * (endValue - startValue);
							returnValue = doRounding ? _Concert.Util.round(curCalcValue, roundFactor) : curCalcValue;
						}

						return returnValue;
					}, // end Linear Calculator function

				Rotational:
					function (distanceFraction, startValue, endValue, additionalProperties)
					{
						var roundFactor, doRounding = (typeof additionalProperties.round !== "undefined");
						if (doRounding)
							roundFactor = additionalProperties.round;
						var centerX = additionalProperties.center[0];
						var centerY = additionalProperties.center[1];
						var offsetX = additionalProperties.offset[0];
						var offsetY = additionalProperties.offset[1];
						var startRadius = startValue[0], endRadius = endValue[0];
						var startAngle = startValue[1], endAngle = endValue[1];
						var newRadius = startRadius + distanceFraction * (endRadius - startRadius);
						var newAngle = startAngle + distanceFraction * (endAngle - startAngle);
						var resultX = centerX + newRadius * Math.cos(newAngle) + offsetX;
						var resultY = centerY + newRadius * Math.sin(newAngle) + offsetY;
						if (doRounding)
						{
							resultX = _Concert.Util.round(resultX, roundFactor);
							resultY = _Concert.Util.round(resultY, roundFactor);
						}
						return [resultX, resultY];
					} // end Rotational Calculator function
			}, // end Calculator singleton / namespace definition


		/**
		 * Pre-defined functions for calculating the current effective distance traveled (represented as a fractional value from 0 to 1) along a transformation time path.
		 * @public
		 * @namespace
		 * @memberof Concert
		 * @property {function} ConstantRate - Returns a value that increases linearly from 0 to 1 as the current time moves from the start time to the end time; or 0 if the current time is before the start time; or 1 if the current time is after the end time.
		 * @property {function} QuadIn - Return value is 0 at or before the start time, changes slowly at first, then accelerates as the current time moves closer to the end time, returning 1 at or after the end time. Specifically, uses the formula: <br><code>([currentTime - startTime] / [endTime - startTime])<sup>2</sup></code>
		 * @property {function} QuadInOut - Return value is 0 at or before the start time, changes slowly at first, then accelerates to reach the halfway point, then decelerates again at the same rate as the current time moves closer to the end time, returning 1 at or after the end time. Effectively is the same as breaking the transformation in half, applying QuadIn to the first half, and QuadOut to the second half.
		 * @property {function} QuadOut - Return value is 0 at or before the start time, changes quickly at first, then decelerates as the current time moves closer to the end time, returning 1 at or after the end time. Specifically, uses the formula: <br><code>(1 - (1 - ((currentTime - startTime) / (endTime - startTime))<sup>2</sup>))</code>
		 * @property {function} Smoothstep - Another function which starts slowly, accelerates to the mid-point, then decelerates, returning 0 at or before the start time and 1 at or after the end time (See {@link http://en.wikipedia.org/wiki/Smoothstep}).
		 */
		EasingFunctions:
			{
				ConstantRate:
					function (startTime, endTime, currentTime)
					{
						if (currentTime >= endTime)
							return 1;
						else if (currentTime < startTime)
							return 0;
						else
							return ((currentTime - startTime) / (endTime - startTime));
					},

				QuadIn:
					function (startTime, endTime, currentTime)
					{
						if (currentTime >= endTime)
							return 1;
						else if (currentTime < startTime)
							return 0;
						else
							return Math.pow((currentTime - startTime) / (endTime - startTime), 2);
					},

				QuadInOut:
					function (startTime, endTime, currentTime)
					{
						var halfway;

						if (currentTime >= endTime)
							return 1;
						else if (currentTime < startTime)
							return 0;
						else
						{
							halfway = (startTime + endTime) / 2;
							if (currentTime < halfway)
								return (Math.pow((currentTime - startTime) / (halfway - startTime), 2) / 2);
							else
								return (0.5 + (1 - Math.pow(1 - (currentTime - halfway) / (endTime - halfway), 2)) / 2);
						}
					},

				QuadOut:
					function (startTime, endTime, currentTime)
					{
						if (currentTime >= endTime)
							return 1;
						else if (currentTime < startTime)
							return 0;
						else
							return (1 - Math.pow(1 - ((currentTime - startTime) / (endTime - startTime)), 2));
					},

				Smoothstep:
					function (startTime, endTime, currentTime)
					{
						var linearPosition;

						if (currentTime >= endTime)
							return 1;
						else if (currentTime < startTime)
							return 0;
						else
						{
							linearPosition = ((currentTime - startTime) / (endTime - startTime));
							return (linearPosition * linearPosition * (3 - 2 * linearPosition));
						}
					}
			}, // end EasingFunctions singleton / namespace definition


		/**
		 * Pre-defined functions for controlling the behavior of a sequence when the current time exceeds the end time or moves before the start time of the sequence. When running a sequence, any of these can be applied to the <code>before</code> or <code>after</code> properties of the parameters object passed into the [run]{@link Concert.Sequence#run}, [begin]{@link Concert.Sequence#begin}, [follow]{@link Concert.Sequence#follow}, or [syncTo]{@link Concert.Sequence#syncTo} methods.
		 * @public
		 * @namespace
		 * @memberof Concert
		 * @property {function} Bounce(bounceCount) - The <strong>result of calling this function</strong> with a specified number of times to bounce is a function object that can be passed into [setBefore]{@link Concert.Sequence#setBefore} or [setAfter]{@link Concert.Sequence#setAfter}, or into one of the run methods as the value of the <code>before</code> or <code>after</code> property. It results in the sequence bouncing (that is, alternating directions to play forward and backward) the specified number of times when it reaches that time boundary. A <code>bounceCount</code> value of <code>0</code> is the same as using <code>Concert.Repeating.None</code>, <code>1</code> means add a single extra run-through in the reverse direction, and so on.
		 * @property {function} Loop(loopbackCount) - The <strong>result of calling this function</strong> with a specified number of times to loop is a function object that can be passed into [setBefore]{@link Concert.Sequence#setBefore} or [setAfter]{@link Concert.Sequence#setAfter}, or into one of the run methods as the value of the <code>before</code> or <code>after</code> property. It results in the sequence looping the specified number of times when it reaches that time boundary. A <code>loopbackCount</code> value of <code>0</code> is the same as using <code>Concert.Repeating.None</code>, <code>1</code> means play through twice (that is, loop back to the beginning 1 time), and so on.
		 * @property {function} None - This function should be <strong>passed directly into</strong> the [setBefore]{@link Concert.Sequence#setBefore} or [setAfter]{@link Concert.Sequence#setAfter} method or into one of the run methods as the value of the <code>before</code> or <code>after</code> property. It results in the sequence halting when it reaches that time boundary.
		 */
		Repeating:
			{
				Bounce:
					function (bounceCount)
					{
						var infinite = ((typeof bounceCount) === "undefined" || bounceCount === null);

						function bounceFunction(sequenceStart, sequenceEnd, unadjustedTime)
						{
							var distanceOut, bounceNum, curBounceOffset, duration = sequenceEnd - sequenceStart;

							if (unadjustedTime < sequenceStart)
							{
								distanceOut = sequenceStart - unadjustedTime;
								bounceNum = Math.floor(distanceOut / duration) + 1;

								if (infinite || bounceNum <= bounceCount)
								{
									curBounceOffset = distanceOut % duration;
									return { adjustedTime: (((bounceNum % 2) === 0) ? (sequenceEnd - curBounceOffset) : curBounceOffset), hitFinalBoundary: false };
								}
								else
									return { adjustedTime: (((bounceCount % 2) === 0) ? sequenceStart : sequenceEnd), hitFinalBoundary: true };
							}
							else
							{
								distanceOut = unadjustedTime - sequenceEnd;
								bounceNum = Math.floor(distanceOut / duration) + 1;

								if (infinite || bounceNum <= bounceCount)
								{
									curBounceOffset = distanceOut % duration;
									return { adjustedTime: (((bounceNum % 2) === 0) ? curBounceOffset : sequenceEnd - curBounceOffset), hitFinalBoundary: false };
								}
								else
									return { adjustedTime: (((bounceCount % 2) === 0) ? sequenceEnd : sequenceStart), hitFinalBoundary: true };
							}
						} // end inner bounceFunction()

						return bounceFunction;
					},

				Loop:
					function (loopbackCount)
					{
						var infinite = ((typeof loopbackCount) === "undefined" || loopbackCount === null);

						function loopFunction(sequenceStart, sequenceEnd, unadjustedTime)
						{
							var distanceOut, duration = sequenceEnd - sequenceStart;

							if (unadjustedTime < sequenceStart)
							{
								distanceOut = sequenceStart - unadjustedTime;

								if (infinite || (distanceOut / duration) <= loopbackCount)
									return { adjustedTime: (sequenceEnd - (distanceOut % duration)), hitFinalBoundary: false };
								else
									return { adjustedTime: sequenceStart, hitFinalBoundary: true };
							}
							else
							{
								distanceOut = unadjustedTime - sequenceEnd;

								if (infinite || (distanceOut / duration) <= loopbackCount)
									return { adjustedTime: (sequenceStart + (distanceOut % duration)), hitFinalBoundary: false };
								else
									return { adjustedTime: sequenceEnd, hitFinalBoundary: true };
							}
						} // end inner loopFunction()

						return loopFunction;
					},

				None:
					function (sequenceStart, sequenceEnd, unadjustedTime)
					{
						return ((unadjustedTime < sequenceStart) ? { adjustedTime: sequenceStart, hitFinalBoundary: true } : { adjustedTime: sequenceEnd, hitFinalBoundary: true });
					}
			},


		Pollers:
			{
				Auto:
					BaseObject.extend(function (_getProtectedMembers, BaseConstructor)
					{
						function AutoConstructor()
						{
							if (!window.cancelAnimationFrame)
								return new _Concert.Pollers.FixedInterval(_Concert.Definitions.FallbackAutoPollerInterval);

							// Initialize object:
							BaseConstructor.call(this);
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							// Protected data members
							thisProtected.frameRequestID = null;

							// Public methods
							thisPublic.run = __run;
							thisPublic.stop = __stop;
						} // end AutoConstructor()


						function __run(callbackFunction)
						{
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							var doNextFrame;

							if (thisProtected.frameRequestID === null)
							{
								doNextFrame =
									function ()
									{
										thisProtected.frameRequestID = window.requestAnimationFrame(doNextFrame);
										callbackFunction();
									};
								doNextFrame();
							}
						} // end __run()


						function __stop()
						{
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							if (thisProtected.frameRequestID !== null)
							{
								window.cancelAnimationFrame(thisProtected.frameRequestID);
								thisProtected.frameRequestID = null;
							}
						} // end __stop()


						return AutoConstructor;
					}), // end Auto definition

				FixedInterval:
					BaseObject.extend(function (_getProtectedMembers, BaseConstructor)
					{
						function FixedIntervalConstructor(interval)
						{
							// Initialize object:
							BaseConstructor.call(this);
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							// Protected data members
							thisProtected.interval = interval;
							thisProtected.intervalID = null;

							// Public methods
							thisPublic.run = __run;
							thisPublic.stop = __stop;
						} // end FixedIntervalConstructor()


						function __run(callbackFunction)
						{
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							if (thisProtected.intervalID === null)
								thisProtected.intervalID = setInterval(callbackFunction, thisProtected.interval);
						} // end __run()


						function __stop()
						{
							var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

							if (thisProtected.intervalID !== null)
							{
								clearInterval(thisProtected.intervalID);
								thisProtected.intervalID = null;
							}
						} // end __stop()


						return FixedIntervalConstructor;
					}) // end FixedInterval definition
			}, // end Pollers singleton / namespace definition


		Transformation:
			(function ()
			{
				var nextTransformationID = 0;

				// ===============================================
				// -- Transformation Constructor

				function TransformationConstructor(properties)
				{
					var propertyName;

					// Initialize data members
					this.transformationID = nextTransformationID++;

					// Initialize data members
					this.additionalProperties = {};
					for (propertyName in properties)
					{
						if (propertyName === "target"
						    || propertyName === "feature"
						    || propertyName === "applicator"
						    || propertyName === "calculator"
						    || propertyName === "t0"
						    || propertyName === "t1"
						    || propertyName === "v0"
						    || propertyName === "v1"
							|| propertyName === "v0Generator"
							|| propertyName === "v1Generator"
						    || propertyName === "unit"
						    || propertyName === "easing")
						{
							this[propertyName] = properties[propertyName];
						}
						else if (properties.hasOwnProperty(propertyName))
							this.additionalProperties[propertyName] = properties[propertyName];
					}
					this.lastFrameID = null;
					this.lastCalculatedValue = null;
					this.lastAppliedValueContainer =
						{
							value: (_Concert.Util.isArray(this.feature) ? new Array(this.feature.length) : null),
							unit: (_Concert.Util.isArray(this.unit) ? new Array(this.unit.length) : null)
						};

					// Methods
					this.clone = __clone;
					this.generateValues = __generateValues;
					this.hasDynamicValues = __hasDynamicValues;
					this.retarget = __retarget;
					this.seek = __seek;
				} // end TransformationConstructor()



				// ===============================================
				// -- Transformation Internal Function Definitions

				function _applyValue(applicator, target, transformationFeatures, seekFeature, newValueContainer, lastAppliedValueContainer, forceApplication)
				{
					var i, newValue, newUnit, lastValue, lastUnit, applyForSure, numTransformationFeatures,
						curTransformationFeature, unitIsArray, currentIndividualValue, currentIndividualUnit;

					newValue = newValueContainer.value;
					newUnit = newValueContainer.unit;
					lastValue = lastAppliedValueContainer.value;
					lastUnit = lastAppliedValueContainer.unit;

					applyForSure = (forceApplication || lastValue === null);

					if (_Concert.Util.isArray(transformationFeatures))
					{
						unitIsArray = _Concert.Util.isArray(newUnit);

						for (i = 0, numTransformationFeatures = transformationFeatures.length; i < numTransformationFeatures; i++)
						{
							curTransformationFeature = transformationFeatures[i];
							if (curTransformationFeature === seekFeature)
							{
								currentIndividualValue = newValue[i];
								currentIndividualUnit = unitIsArray ? newUnit[i] : newUnit;
								if (applyForSure || currentIndividualValue !== lastValue[i] || currentIndividualUnit !== (unitIsArray ? lastUnit[i] : lastUnit))
								{
									applicator(target, curTransformationFeature, currentIndividualValue, currentIndividualUnit);
									lastValue[i] = currentIndividualValue;
									if (unitIsArray)
										lastUnit[i] = currentIndividualUnit;
									else
										lastAppliedValueContainer.unit = currentIndividualUnit;
								}
								break;
							}
						}
					}
					else
					{
						if (applyForSure || newValue !== lastValue || newUnit !== lastUnit)
						{
							applicator(target, transformationFeatures, newValue, newUnit);
							lastAppliedValueContainer.value = newValue;
							lastAppliedValueContainer.unit = newUnit;
						}
					}
				} // end _applyValue()



				// ===============================================
				// -- Transformation Public Method Definitions

				function __clone(newTarget)
				{
					var newTransformation, propertyName, additionalProperties = this.additionalProperties, newAdditionalProperties,
						propertiesNotToCopy =
						{
							transformationID: true, additionalProperties: true, target: true, lastAppliedValueContainer: true, lastFrameID: true, lastCalculatedValue: true,
							clone: true, generateValues: true, hasDynamicValues: true, retarget: true, seek: true
						};

					newTransformation = new _Concert.Transformation();

					for (propertyName in this) if (this.hasOwnProperty(propertyName) && !propertiesNotToCopy[propertyName])
						newTransformation[propertyName] = this[propertyName];
					newTransformation.target = newTarget;
					newTransformation.lastAppliedValueContainer =
						{
							value: (_Concert.Util.isArray(this.feature) ? new Array(this.feature.length) : null),
							unit: (_Concert.Util.isArray(this.unit) ? new Array(this.unit.length) : null)
						};
					newTransformation.lastFrameID = null;
					newTransformation.lastCalculatedValue = null;

					newAdditionalProperties = newTransformation.additionalProperties;
					for (propertyName in additionalProperties) if (additionalProperties.hasOwnProperty(propertyName))
						newAdditionalProperties[propertyName] = additionalProperties[propertyName];

					return newTransformation;
				} // end __clone()


				function __generateValues(sequence)
				{
					var v0Generator = this.v0Generator, v1Generator = this.v1Generator;

					if (typeof v0Generator === "function")
						this.v0 = v0Generator(sequence);
					if (typeof v1Generator === "function")
						this.v1 = v1Generator(sequence);
				} // end __generateValues()


				function __hasDynamicValues()
				{
					return ((typeof this.v0Generator === "function") || (typeof this.v1Generator === "function"));
				} // end _hasDynamicValues()


				function __retarget(newTarget)
				{
					this.target = newTarget;
					this.lastAppliedValueContainer =
						{
							value: (_Concert.Util.isArray(this.feature) ? new Array(this.feature.length) : null),
							unit: (_Concert.Util.isArray(this.unit) ? new Array(this.unit.length) : null)
						};
				} // end _retarget()


				function __seek(time, frameID, seekFeature, forceApplication)
				{
					var newValue =
						(frameID === this.lastFrameID)
						? this.lastCalculatedValue
						: this.calculator(this.easing(this.t0, this.t1, time), this.v0, this.v1, this.additionalProperties);

					_applyValue(this.applicator, this.target, this.feature, seekFeature,
					            { value: newValue, unit: this.unit },
								this.lastAppliedValueContainer, forceApplication);
				} // end __seek()

				// ===============================================

				return TransformationConstructor;
			})(), // end Transformation definition


		FeatureSequence:
			(function ()
			{
				// ===============================================
				// -- FeatureSequence Constructor

				function FeatureSequenceConstructor(target, feature)
				{
					// Data members
					this.target = target;
					this.feature = feature;
					this.transformations = [];
					this.transformationIndexBySegment = null;

					// Public methods
					this.clone = __clone;
					this.indexTransformations = __indexTransformations;
					this.retarget = __retarget;
					this.seek = __seek;
				} // end FeatureSequenceConstructor()



				// ===============================================
				// -- FeatureSequence Public Method Definitions

				function __clone(newTarget)
				{
					var i, j, numSegments, curIndexedTransformation,
						transformations = this.transformations,
						numTransformations = transformations.length,
						newTransformations = new Array(numTransformations),
						transformationIndexBySegment = this.transformationIndexBySegment,
						newTransformationIndexBySegment = null,
						newFeatureSequence = new _Concert.FeatureSequence(newTarget, this.feature),
						returnVal = { featureSequence: newFeatureSequence, transformations: newTransformations };

					for (i = 0; i < numTransformations; i++)
						newTransformations[i] = transformations[i].clone(newTarget);
					newFeatureSequence.transformations = newTransformations;

					if (transformationIndexBySegment)
					{
						numSegments = transformationIndexBySegment.length;
						newTransformationIndexBySegment = new Array(numSegments);

						for (i = 0; i < numSegments; i++)
						{
							curIndexedTransformation = transformationIndexBySegment[i];
							for (j = 0; j < numTransformations; j++)
							{
								if (curIndexedTransformation === transformations[j])
								{
									newTransformationIndexBySegment[i] = newTransformations[j];
									break;
								}
							}
						}
					}
					newFeatureSequence.transformationIndexBySegment = newTransformationIndexBySegment;

					return returnVal;
				} // end __clone()


				function __indexTransformations(overallSequenceSegments)
				{
					var transformations = this.transformations, finalTransformationNumber = transformations.length - 1,
						currentTransformationNumber, beforeLastTransformation, numSegments = overallSequenceSegments.length,
						transformationIndexBySegment, currentSegmentNumber, currentTransformation, nextTransformation,
						nextTransformationStartTime, currentSegmentStartTime;

					if (finalTransformationNumber < 0)
						return;

					transformations.sort(
						function (a, b)
						{
							var aStartTime = a.t0;
							var bStartTime = b.t0;
							return ((aStartTime === bStartTime) ? 0 : ((aStartTime < bStartTime) ? -1 : 1));
						});

					transformationIndexBySegment = this.transformationIndexBySegment = new Array(numSegments);

					currentSegmentNumber = 0;
					currentSegmentStartTime = overallSequenceSegments[0].startTime;
					currentTransformationNumber = 0;
					currentTransformation = transformations[0];
					if (finalTransformationNumber > 0)
					{
						nextTransformation = transformations[1];
						nextTransformationStartTime = nextTransformation.t0;
						beforeLastTransformation = true;
					}
					else
						beforeLastTransformation = false;
					while (currentSegmentNumber < numSegments)
					{
						if (beforeLastTransformation && currentSegmentStartTime >= nextTransformationStartTime)
						{
							currentTransformationNumber++;
							currentTransformation = nextTransformation;
							if (currentTransformationNumber < finalTransformationNumber)
							{
								nextTransformation = transformations[currentTransformationNumber + 1];
								nextTransformationStartTime = nextTransformation.t0;
							}
							else
								beforeLastTransformation = false;
						}
						else
						{
							transformationIndexBySegment[currentSegmentNumber] = currentTransformation;
							currentSegmentNumber++;
							if (currentSegmentNumber < numSegments)
								currentSegmentStartTime = overallSequenceSegments[currentSegmentNumber].startTime;
							else
								break;
						}
					}
				} // end __indexTransformations()


				function __retarget(newTarget)
				{
					var i, transformations = this.transformations, numTransformations = transformations.length;
					for (i = 0; i < numTransformations; i++)
						transformations[i].retarget(newTarget);

					this.target = newTarget;
				} // end _retarget()


				function __seek(sequenceSegmentNumber, time, frameID, forceApplication)
				{
					return this.transformationIndexBySegment[sequenceSegmentNumber].seek(time, frameID, this.feature, forceApplication);
				} // end _seek()

				// ===============================================

				return FeatureSequenceConstructor;
			})(), // end FeatureSequence definition


		TargetSequence:
			BaseObject.extend(function (_getProtectedMembers, BaseConstructor)
			{
				// ===============================================
				// -- TargetSequence Constructor

				function TargetSequenceConstructor(target)
				{
					// Initialize object:
					BaseConstructor.call(this);
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					// Protected data members
					thisProtected.target = target;
					thisProtected.featureSequences = [];

					// Public methods
					thisPublic.addFeatureSequence = __addFeatureSequence;
					thisPublic.clone = __clone;
					thisPublic.findFeatureSequenceByFeature = __findFeatureSequenceByFeature;
					thisPublic.getTarget = __getTarget;
					thisPublic.indexTransformations = __indexTransformations;
					thisPublic.retarget = __retarget;
					thisPublic.seek = __seek;
				} // end TargetSequenceConstructor()



				// ===============================================
				// -- TargetSequence Public Method Definitions

				function __addFeatureSequence(featureSequence)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					thisProtected.featureSequences.push(featureSequence);
				} // end __addFeatureSequence()


				function __clone(newTarget)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, featureSequenceCloneReturn, allNewTransformations = [],
						featureSequences = thisProtected.featureSequences, numFeatureSequences = featureSequences.length,
						newTargetSequence = new _Concert.TargetSequence(newTarget),
						returnVal = { targetSequence: newTargetSequence, transformations: allNewTransformations };

					for (i = 0; i < numFeatureSequences; i++)
					{
						featureSequenceCloneReturn = featureSequences[i].clone(newTarget);
						newTargetSequence.addFeatureSequence(featureSequenceCloneReturn.featureSequence);
						allNewTransformations.push.apply(allNewTransformations, featureSequenceCloneReturn.transformations);
					}

					return returnVal;
				} // end __clone()


				function __findFeatureSequenceByFeature(feature)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, curFeatureSequence, featureSequences = thisProtected.featureSequences, numFeatureSequences = featureSequences.length;

					for (i = 0; i < numFeatureSequences; i++)
					{
						curFeatureSequence = featureSequences[i];
						if (curFeatureSequence.feature === feature)
							return curFeatureSequence;
					}

					return null;
				} // end __findFeatureSequenceByFeature()


				function __getTarget()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.target;
				} // end __getTarget()


				function __indexTransformations(overallSequenceSegments)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, numFeatureSequences;
					var featureSequences = thisProtected.featureSequences;
					for (i = 0, numFeatureSequences = featureSequences.length; i < numFeatureSequences; i++)
						featureSequences[i].indexTransformations(overallSequenceSegments);
				} // end __indexTransformations()


				function __retarget(newTarget)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, featureSequences = thisProtected.featureSequences, numFeatureSequences = featureSequences.length;
					for(i = 0; i < numFeatureSequences; i++)
						featureSequences[i].retarget(newTarget);
					thisProtected.target = newTarget;
				} // end _retarget()


				function __seek(sequenceSegmentNumber, time, frameID, forceApplication)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var numFeatureSequences, i, featureSequences = thisProtected.featureSequences;
					for (i = 0, numFeatureSequences = featureSequences.length; i < numFeatureSequences; i++)
						featureSequences[i].seek(sequenceSegmentNumber, time, frameID, forceApplication);
				} // end __seek()

				// ===============================================

				return TargetSequenceConstructor;
			}), // end TargetSequence definition


		TimelineSegment:
			function TimelineSegmentConstructor(startTime, endTime)
			{
				this.startTime = startTime;
				this.endTime = endTime;
			}, // end TimelineSegment definition


		Sequence:
			BaseObject.extend(function (_getProtectedMembers, BaseConstructor)
			{
				// ===============================================
				// -- Sequence Constructor

				/**
				 * Represents an animation sequence, or, more broadly, a series of changes which are applied to a collection of objects over time.
				 * A sequence contains a set of transformations that are applied to DOM Elements, JavaScript objects, or anything else that can be manipulated with JavasScript.
				 * It contains methods that allow defining those transformations, seeking to any point in the sequence timeline, and running the sequence in various ways.
				 * @name Sequence
				 * @public
				 * @memberof Concert
				 * @constructor
				 * @param {Object} [transformationSet] An object defining an initial set of transformations to add to the sequence. The layout of this object is the same as used in the [addTransformations method]{@link Concert.Sequence#addTransformations}.
				 * @returns {Object} A new Sequence object.
				 */
				function SequenceConstructor(transformationSet)
				{
					// Initialize object:
					BaseConstructor.call(this);
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					// Protected data members
					thisProtected.ID = _Concert.nextSequenceID; _Concert.nextSequenceID++;
					thisProtected.nextFrameID = 0;
					thisProtected.targetSequences = [];
					thisProtected.timelineSegments = [];
					thisProtected.lastUsedTimelineSegmentNumber = 0;
					thisProtected.allTransformations = [];
					thisProtected.dynamicValueTransformations = [];
					thisProtected.indexCompletionCallbacks = [];
					thisProtected.indexed = false;
					thisProtected.indexingInProgress = false;
					thisProtected.indexTimerID = null;
					thisProtected.indexingProcessData = {};
					thisProtected.running = false;
					thisProtected.currentTime = null;
					thisProtected.unadjustedTime = null;
					thisProtected.sequenceStartTime = null;
					thisProtected.sequenceEndTime = null;
					thisProtected.poller = null;
					thisProtected.synchronizer = null;
					thisProtected.initialSyncSourcePoint = null;
					thisProtected.lastSegmentNumber = null;

					thisProtected.defaults =
						{
							unit: null,
							applicator: Concert.Applicators.Property,
							easing: Concert.EasingFunctions.ConstantRate,
							calculator: Concert.Calculators.Linear
						};

					thisProtected.synchronizeTo = null;
					thisProtected.speed = 1;
					thisProtected.timeOffset = 0;
					thisProtected.pollingInterval = 0;
					thisProtected.after = _Concert.Repeating.None;
					thisProtected.before = _Concert.Repeating.None;
					thisProtected.autoStopAtEnd = true;
					thisProtected.onAutoStop = null;
					thisProtected.stretchStartTimeToZero = true;
					thisProtected.soleControlOptimizationDuringRun = true;

					// Protected methods
					thisProtected.advanceIndexingToNextStep = __advanceIndexingToNextStep;
					thisProtected.findSequenceSegmentNumberByTime = __findSequenceSegmentNumberByTime;
					thisProtected.findSequenceSegmentNumberInRange = __findSequenceSegmentNumberInRange;
					thisProtected.findTargetSequenceByTarget = __findTargetSequenceByTarget;
					thisProtected.resetIndexing = __resetIndexing;
					thisProtected.runIndexing = __runIndexing;

					// Public methods
					thisPublic.addTransformations = __addTransformations;
					thisPublic.begin = __begin;
					thisPublic.clone = __clone;
					thisPublic.follow = __follow;
					thisPublic.generateValues = __generateValues;
					thisPublic.getCurrentTime = __getCurrentTime;
					thisPublic.getEndTime = __getEndTime;
					thisPublic.getID = __getID;
					thisPublic.getStartTime = __getStartTime;
					thisPublic.index = __index;
					thisPublic.isRunning = __isRunning;
					thisPublic.retarget = __retarget;
					thisPublic.run = __run;
					thisPublic.seek = __seek;
					thisPublic.setAfter = __setAfter;
					thisPublic.setBefore = __setBefore;
					thisPublic.setDefaults = __setDefaults;
					thisPublic.stop = __stop;
					thisPublic.syncTo = __syncTo;

					// Add transformations if any were specified
					if (transformationSet)
						thisPublic.addTransformations(transformationSet);
				} // end SequenceConstructor()



				// ===============================================
				// -- Sequence Internal Function Definitions

				function _getCombinedParams(initialParams, overrides)
				{
					var paramName, combined = {};

					if (initialParams)
					{
						for (paramName in initialParams) if (initialParams.hasOwnProperty(paramName))
							combined[paramName] = initialParams[paramName];
					}

					if (overrides)
					{
						for (paramName in overrides) if (overrides.hasOwnProperty(paramName))
							combined[paramName] = overrides[paramName];
					}

					return combined;
				} // end _overrideParams()


				function _getParamValue(parameters, paramName, defaultValue)
				{
					return ((parameters && (typeof parameters[paramName] !== "undefined")) ? parameters[paramName] : defaultValue);
				} // end _getParamValue


				function _loadObjectData(newPublicData, newProtectedData)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					_Concert.Util.loadObjectData(newPublicData, newProtectedData, thisPublic, thisProtected);
				} // end _loadObjectData()


				function _sortSingleValue (distinctVal, workingArray)
				{
					var searchStart = 0, searchEnd = workingArray.length - 1, middle;

					if (searchEnd < 0 || distinctVal > workingArray[searchEnd])
						workingArray.push(distinctVal);
					else if (distinctVal < workingArray[0])
						workingArray.unshift(distinctVal);
					else
					{
						while (searchStart + 1 < searchEnd)
						{
							middle = Math.floor((searchStart + searchEnd) / 2);
							if (distinctVal < workingArray[middle])
								searchEnd = middle;
							else
								searchStart = middle;
						}

						workingArray.splice(searchEnd, 0, distinctVal);
					}
				} // end _sortSingleValue()


				// ===============================================
				// -- Sequence Protected Method Definitions

				function __advanceIndexingToNextStep()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var distinctValuesObject, distinctValStr, distinctValuesArray, timelineSegments,
						indexingProcessData = thisProtected.indexingProcessData, indexingComplete = false;

					indexingProcessData.step++;
					indexingProcessData.startingIndex = 0;

					switch (indexingProcessData.step)
					{
						case 1:
							indexingProcessData.inputData = indexingProcessData.outputData;
							indexingProcessData.iterationsPerRound = _Concert.Definitions.StartingIterationsPerAsynchProcessingRound.consolidateDistinctValues;
							indexingProcessData.totalIterationsThisStep = indexingProcessData.inputData.length;
							indexingProcessData.outputData = {};
							break;

						case 2:
							indexingProcessData.iterationsPerRound = _Concert.Definitions.StartingIterationsPerAsynchProcessingRound.buildSortedArray;
							if (indexingProcessData.isAsynchronous)
							{
								distinctValuesObject = indexingProcessData.outputData;
								distinctValuesArray = [];
								for (distinctValStr in distinctValuesObject) if (distinctValuesObject.hasOwnProperty(distinctValStr))
									distinctValuesArray.push(distinctValuesObject[distinctValStr]);
								indexingProcessData.inputData = distinctValuesArray;
								indexingProcessData.totalIterationsThisStep = distinctValuesArray.length;
							}
							else
							{
								indexingProcessData.inputData = indexingProcessData.outputData;
								indexingProcessData.totalIterationsThisStep = 1;
							}
							indexingProcessData.outputData = [];
							break;

						case 3:
							indexingProcessData.inputData = indexingProcessData.outputData;
							indexingProcessData.iterationsPerRound = _Concert.Definitions.StartingIterationsPerAsynchProcessingRound.buildDistinctSegmentList;
							indexingProcessData.totalIterationsThisStep = indexingProcessData.inputData.length - 1;
							indexingProcessData.outputData = new Array(indexingProcessData.totalIterationsThisStep);
							break;

						case 4:
							indexingProcessData.inputData = indexingProcessData.outputData;
							indexingProcessData.iterationsPerRound = _Concert.Definitions.StartingIterationsPerAsynchProcessingRound.indexTargetSequences;
							indexingProcessData.totalIterationsThisStep = thisProtected.targetSequences.length;
							indexingProcessData.outputData = null;
							break;

						case 5:
							indexingComplete = true;

							thisProtected.timelineSegments = timelineSegments = indexingProcessData.inputData;
							thisProtected.sequenceStartTime = ((!timelineSegments || timelineSegments.length < 1) ? null : timelineSegments[0].startTime);
							thisProtected.sequenceEndTime = ((!timelineSegments || timelineSegments.length < 1) ? null : timelineSegments[timelineSegments.length - 1].endTime);

							thisProtected.indexed = true;
							thisProtected.indexingInProgress = false;

							indexingProcessData.inputData = null;
							indexingProcessData.iterationsPerRound = 1;
							indexingProcessData.totalIterationsThisStep = 0;
							indexingProcessData.outputData = null;

							while (thisProtected.indexCompletionCallbacks.length)
								(thisProtected.indexCompletionCallbacks.shift())(thisPublic);
					} // end switch (indexingProcessData.step)

					return indexingComplete;
				} // end __setIndexingCurrentStep()


				function __findSequenceSegmentNumberByTime(time)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var match, currentSegmentNumber, currentSegment, currentSegmentEnd;

					var timelineSegments = thisProtected.timelineSegments;
					var numSegments = timelineSegments.length;

					if (numSegments > 0)
					{
						currentSegmentNumber = thisProtected.lastUsedTimelineSegmentNumber;
						currentSegment = timelineSegments[currentSegmentNumber];
						currentSegmentEnd = currentSegment.endTime;

						if (time >= currentSegment.startTime)
						{
							if (time < currentSegmentEnd)
								match = { segmentNumber: currentSegmentNumber, timeMatchType: 0 };
							else if (currentSegmentNumber === numSegments - 1)
								match = { segmentNumber: currentSegmentNumber, timeMatchType: 1 };
							else
							{
								currentSegmentNumber++;
								currentSegment = timelineSegments[currentSegmentNumber];
								currentSegmentEnd = currentSegment.endTime;

								if (time < currentSegmentEnd)
									match = { segmentNumber: currentSegmentNumber, timeMatchType: 0 };
								else if (currentSegmentNumber === numSegments - 1)
									match = { segmentNumber: currentSegmentNumber, timeMatchType: 1 };
								else
									match = thisProtected.findSequenceSegmentNumberInRange(time, currentSegmentNumber + 1, numSegments - 1);
							}
						}
						else
						{
							if (currentSegmentNumber === 0)
								match = { segmentNumber: 0, timeMatchType: -1 };
							else
								match = thisProtected.findSequenceSegmentNumberInRange(time, 0, currentSegmentNumber - 1);
						}
						thisProtected.lastUsedTimelineSegmentNumber = match.segmentNumber;
					}
					else
						match = null;

					return match;
				} // end __findSequenceSegmentNumberByTime()


				function __findSequenceSegmentNumberInRange(time, rangeStart, rangeEnd)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var currentSegmentNumber, currentSegment, currentTimeMatchType;

					do
					{
						currentSegmentNumber = Math.floor((rangeStart + rangeEnd) / 2);
						currentSegment = thisProtected.timelineSegments[currentSegmentNumber];

						if (time < currentSegment.startTime)
						{
							rangeEnd = currentSegmentNumber - 1;
							currentTimeMatchType = -1;
						}
						else
						{
							if (time >= currentSegment.endTime)
							{
								rangeStart = currentSegmentNumber + 1;
								currentTimeMatchType = 1;
							}
							else
							{
								currentTimeMatchType = 0;
								break;
							}
						}
					} while (rangeStart < rangeEnd);

					return { segmentNumber: currentSegmentNumber, timeMatchType: currentTimeMatchType };
				} // end __findSequenceSegmentNumberInRange()


				function __findTargetSequenceByTarget(target)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, targetSequences = thisProtected.targetSequences, numTargetSequences = targetSequences.length;

					for (i = 0; i < numTargetSequences; i++)
					{
						if (targetSequences[i].getTarget() === target)
							return targetSequences[i];
					}

					return null;
				} // end _findTargetSequenceByTarget()


				function __resetIndexing()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var indexingProcessData = thisProtected.indexingProcessData;
					indexingProcessData.step = 0;
					indexingProcessData.startingIndex = 0;
					indexingProcessData.iterationsPerRound = _Concert.Definitions.StartingIterationsPerAsynchProcessingRound.buildBreakPointList;
					indexingProcessData.inputData = thisProtected.allTransformations;
					indexingProcessData.totalIterationsThisStep = thisProtected.allTransformations.length;
					indexingProcessData.outputData = new Array(indexingProcessData.totalIterationsThisStep * 2);
				} // end __resetIndexing()


				function __runIndexing()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var indexingProcessData = thisProtected.indexingProcessData, indexingComplete;


					function doProcessing()
					{
						var step = indexingProcessData.step, isAsynchronous = indexingProcessData.isAsynchronous,
							startTime, endTime, inputData = indexingProcessData.inputData,
							curIndex = indexingProcessData.startingIndex, totalItemsToProcessThisStep = indexingProcessData.totalIterationsThisStep,
							maxItemsToProcessThisRound = isAsynchronous ? indexingProcessData.iterationsPerRound : totalItemsToProcessThisStep,
							stoppingPoint = Math.min(totalItemsToProcessThisStep, curIndex + maxItemsToProcessThisRound),
							outputData = indexingProcessData.outputData, indexingComplete = false,
							curTransformation, curBreakpointIndex = ((step === 0) ? curIndex * 2 : null),
							curBreakpointValue, distinctValStr, nextBreakpointValue, targetSequences;

						if (isAsynchronous)
							startTime = (new Date()).getTime();

						if (step === 2 && !isAsynchronous && !_Concert.Util.isArray(inputData))
						{
							// If we're doing this synchronously, we skip a step of copying object properties into an array.
							// This is faster, but doesn't work in asynchronous mode, because there's no good way to break up
							// the below loop into multiple rounds. We also can't do this if we've already started processing
							// this step asynchronously and switched to synchronous mode in between rounds, so we also check
							// whether the input data is an array (in which case we've already skipped the opimization and can
							// just continue by means of the normal while/switch loop below).
							for (distinctValStr in inputData) if (inputData.hasOwnProperty(distinctValStr))
								_sortSingleValue(inputData[distinctValStr], outputData);
						}
						else
						{
							if (step === 3)
								curBreakpointValue = inputData[curIndex];
							else if (step === 4)
								targetSequences = thisProtected.targetSequences;

							while (curIndex < stoppingPoint)
							{
								switch (step)
								{
									case 0: // Building breakpoint list
										curTransformation = inputData[curIndex];
										outputData[curBreakpointIndex++] = curTransformation.t0;
										outputData[curBreakpointIndex++] = curTransformation.t1;
										break;
									case 1: // Consolidating distinct breakpoint values
										curBreakpointValue = inputData[curIndex];
										outputData[curBreakpointValue] = curBreakpointValue;
										break;
									case 2: // Building a sorted array of distinct breakpoint values
										_sortSingleValue(inputData[curIndex], outputData);
										break;
									case 3: // Building a sorted array of distinct timeline segments
										nextBreakpointValue = inputData[curIndex + 1];
										outputData[curIndex] = new _Concert.TimelineSegment(curBreakpointValue, nextBreakpointValue);
										curBreakpointValue = nextBreakpointValue;
										break;
									case 4: // Indexing the target sequences to the timeline segment list
										targetSequences[curIndex].indexTransformations(inputData);
										break;
								}

								curIndex++;
							} // end while (curIndex < stoppingPoint)
						} // end if/else on (step === 2 && !isAsynchronous && !_Concert.Util.isArray(inputData))

						if (stoppingPoint === totalItemsToProcessThisStep)
							indexingComplete = thisProtected.advanceIndexingToNextStep();
						else
						{
							endTime = (new Date()).getTime();
							indexingProcessData.startingIndex = curIndex;
							if ((endTime - startTime) < _Concert.Definitions.IterationRoundTimeHalfBound)
								indexingProcessData.iterationsPerRound *= 2;
						}

						if (isAsynchronous && !indexingComplete)
							thisProtected.indexTimerID = window.setTimeout(doProcessing, 0);

						return indexingComplete;
					} // end doProcessing()


					if (indexingProcessData.isAsynchronous)
					{
						thisProtected.indexingInProgress = true;
						thisProtected.indexTimerID = window.setTimeout(doProcessing, 0);
					}
					else
					{
						if (thisProtected.indexTimerID !== null) // This is the "join thread" case, where we're already indexing asynchronously but have been instructed to index synchronously.
						{
							window.clearTimeout(thisProtected.indexTimerID);
							thisProtected.indexTimerID = null;
						}
						while (!indexingComplete)
							indexingComplete = doProcessing();
					}
				} // end __startIndexing()



				// ===============================================
				// -- Sequence Public Method Definitions

				/**
				 * Adds a set of transformations (i.e., changes applied to objects over time) to the sequence.<br>
				 * <p class="ExplanationParagraph"><strong>Terminology:</strong></p>
				 * <p class="ExplanationParagraph">-A <em>transformation</em> is a single change applied over time to a single feature of a single object. Its properties include which object to modify and what feature of it will be altered, a start time and starting value, and end time and ending value. For instance, a transformation may represent changing the "width" style of a DIV element from "100px" at time 1000 to "200px" at time 2000.</p>
				 * <p class="ExplanationParagraph">-A <em>sequence</em> is a collection of transformations that are to be applied together as a group.</p>
				 * <p class="ExplanationParagraph">-A <em>target object</em> is anything that will be modified by a transformation (e.g., a DOM element or a JavaScript object).</p>
				 * <p class="ExplanationParagraph">-A <em>target feature</em> is the aspect of the target object that will be modified (e.g., for a DOM element this might be "width").</p>
				 * <p class="ExplanationParagraph">-A <em>unit</em> is an optional (initially defaults to <code>null</code>) string appended to a calculated value when applying it to a target feature
				 * (e.g., for a DOM style property this might be "px").</p>
				 * <p class="ExplanationParagraph">-A <em>calculator</em> is a function that looks at the start and end values of a target feature and calculates a current value to apply
				 * based on the current distance along the timeline. Ordinarily this is set to one of the pre-defined calculator functions in the [Concert.Calculators]{@link Concert.Calculators} namespace
				 * (initially defaulting to <code>Concert.Calculators.Linear</code>), but can also be a custom function, as explained further below.</p>
				 * <p class="ExplanationParagraph">-An <em>applicator</em> is a function that takes the values computed by the calculator function and applies them to the target feature.
				 * For instance, different applicators would be used for setting JavaScript object properties, DOM element styles, or SVG element attributes.
				 * Ordinarily this is set to one of the pre-defined applicator functions in the [Concert.Applicators]{@link Concert.Applicators} namespace
				 * (initially defaulting to <code>Concert.Applicators.Property</code>), but can also be a custom function, as explained further below.</p>
				 * <p class="ExplanationParagraph">-An <em>easing</em> is a function which modifies the rate at which a transformation moves from beginning to end.
				 * For instance, it may progress steadily from the start time to the end time, or it may accelerate and decelerate to make motion appear smoother.
				 * Ordinarily this is set to one of the pre-defined easing functions in the [Concert.EasingFunctions]{@link Concert.EasingFunctions} namespace
				 * (initially defaulting to <code>Concert.EasingFunctions.ConstantRate</code>) but can also be a custom function, as explained further below.</p>
				 * <p class="ExplanationParagraph">Note: The easing function could easily be confused with the calculator function, because many animation libraries combine these two concepts.
				 * Here, however, they can be set independently. Essentially, a calculator function, given a start value, an end value, and the current time (in the form of a fractional distance
				 * between the start time and end time of the transformation), calculates a current value to apply. The easing function is what computes the current time that will be passed into
				 * the calculator function, allowing the rate at which a transformation proceeds to change over time. The reason for separating these becomes apparent when we consider that different
				 * types of calculation are necessary for different types of features. A function calculating an animated transition from one RGB color value to another uses a different algorithm than
				 * one calculating the animation of a simple, numeric value, for instance, or a complex calculator function that takes multiple inputs and calculates rotational movement.
				 * Because ConcertJS allows anything at all to be animated, it supports the ability to choose any method of calculating values, and then (regardless of which one is used)
				 * specifying any easing function to alter the rate at which the animation takes place. Easing functions are specified at the level of the transformation (not the full sequence,
				 * although it is possible to set a default easing function for a sequence), so a single sequence can contain different transformations using a different easing functions.</p>
				 * @name addTransformations
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} transformationSet An object or array describing a set of changes which will be applied at specified times to specified target objects.
				 * (A target object being anything that will be modified by the sequence, such as a DOM element or a JavaScript object.)
				 * The <code>transformationSet</code> parameter is either a single object whose properties define a set of transformations, or an array of such objects.
				 * Certain of the properties (as indicated below) are optional, and each sequence maintains its own settings for what default values will be applied to transformations
				 * when the optional properties are not defined. (Note: these defaults are applied at the time the transformations are added, not at run-time, so changing the defaults
				 * for a sequence will never alter transformations which have already been added to that sequence.)<br><br>
				 * The expected layout of the object passed into this method is defined as follows (also see examples below):<pre>
				 * <strong>transformationSet</strong> = <em>TransformationObject</em>
				 * OR
				 * <strong>transformationSet</strong> = [<em>TransformationObject<sub>1</sub></em>, <em>TransformationObject<sub>2</sub></em>, ...]
				 * 
				 * <strong><em>TransformationObject</em></strong> =
				 *   {
				 *       target: <em>TargetObjectDefinition</em>,
				 *       AND/OR
				 *       targets: [<em>TargetObjectDefinition<sub>1</sub></em>, <em>TargetObjectDefinition<sub>2</sub></em>, ...]
				 *
				 *       feature: <em>FeatureDefinition</em>,
				 *       [unit: <em>UnitDefinition</em>,] // If absent, uses sequence's default value
				 *       [applicator: <em>ApplicatorFunction</em>,] // If absent, uses sequence's default value
				 *       [calculator: <em>CalculatorFunction</em>,] // If absent, uses sequence's default value
				 *       [easing: <em>EasingFunction</em>,] // If absent, uses sequence's default value
				 *
				 *       keyframes: <em>KeyframesDefinition</em>
				 *       OR
				 *       segments: <em>SegmentDefinition</em> OR [<em>SegmentDefinition<sub>1</sub></em>, <em>SegmentDefinition<sub>2</sub></em>, ...]
				 *   };
				 * 
				 * <strong><em>TargetObjectDefinition</em></strong> = The object to be modified by this transformation.
				 * Often this will be a DOM object, but it can be anything at all. Multiple targets can
				 * be specified, by using the <code>targets</code> (plural) property, as a shorthand method of
				 * duplicating the transformation definitions to target all the included target objects.
				 *
				 * <strong><em>FeatureDefinition</em></strong> = The feature of the target object which will be modified, OR an
				 * array of such features. In most cases, this will be a string (for example, when
				 * animating a DOM style, this might be "width") or an array of strings. Arrays are
				 * allowed as a shorthand method of defining multiple features, values, and units
				 * together in a more compact notation. The first feature in the array will be
				 * matched with the first unit and the first value in those arrays, and so on. See
				 * below samples for an example of using arrays in this way.
				 *
				 * <strong><em>UnitDefinition</em></strong> = A string to be appended to calculated values before they are applied
				 * to the target (for example, when animating a DOM style, this might be "px"), OR an
				 * array of such strings. Arrays are allowed as a shorthand method of defining multiple
				 * features, values, and units together in a more compact notation. The first unit in
				 * the array will be matched with the first feature and the first value in those arrays,
				 * and so on. See below samples for an example of using arrays in this way. Use <em>null</em>
				 * if nothing should be appended to the calculated values for this transformation.
				 *
				 * <strong><em>ApplicatorFunction</em></strong> = Function used to apply the calculated current value to the
				 * feature. Because different types of features (e.g., DOM element styles as contrasted
				 * to plain JavaScript object properties) are applied in different ways, different
				 * applicator functions are needed. This can be set to one of the functions defined in
				 * the [Concert.Applicators]{@link Concert.Applicators} namespace, or to any function with the signature:
				 *   <em>function applicatorFunction(target, feature, value, unit)</em>
				 * See below examples for a sample of a custom applicator.
				 *
				 * <strong><em>CalculatorFunction</em></strong> = Function used to calculate a current value to apply to the target
				 * feature. This can be set to one of the functions defined in the [Concert.Calculators]{@link Concert.Calculators}
				 * namespace, or to any function returning an approprate value for this transformation's
				 * target feature and having the signature:
				 *   <em>function calculatorFunction(distanceFraction, startValue, endValue, addlProperties)</em>
				 * See below examples for a sample of a custom calculator.
				 *
				 * <strong><em>EasingFunction</em></strong> = Function used to compute the current time (as a fractional
				 * proportion of the distance traversed, from 0 to 1, between the start time and
				 * end time of the transformation). This can be set to one of the functions defined
				 * in the [Concert.EasingFunctions]{@link Concert.EasingFunctions} namespace, or to
				 * any function returning a value from 0 to 1 and having the signature:
				 *   <em>function easingFunction(startTime, endTime, currentTime)</em>
				 * See below examples for a sample of a custom easing function.
				 *
				 * <strong><em>KeyframesDefinition</em></strong> =
				 *   {
				 *       times: <em>KeyframeTimesArray</em>,
				 *
				 *       [values: <em>KeyframeValuesArray</em>,]
				 *       OR
				 *       [valueGenerators: <em>ValueGeneratorsArray</em>]
				 *   };
				 *
				 * <strong><em>SegmentDefinition</em></strong> = 
				 *   {
				 *       t0: <em>TimeDefinition</em>, // Start time of this transformation
				 *       t1: <em>TimeDefinition</em>, // End time of this transformation
				 *
				 *       v0: <em>ValueDefinition</em>, // Value applied at the start time
				 *       v1: <em>ValueDefinition</em>, // Value applied at the end time
				 *       OR
				 *       v0Generator: <em>ValueGenerator</em>, // Function to calculate v0
				 *       v1Generator: <em>ValueGenerator</em>, // Function to calculate v1
				 *
				 *       [calculator: <em>CalculatorFunction</em>,] // If absent, falls back to the calculator
				 *       // defined at the <em>TransformationObject</em> level; if also absent there, to the
				 *       // sequence's default calculator.
				 *
				 *       [easing: <em>EasingFunction</em>,] // If absent, falls back to the easing function
				 *       // defined at the <em>TransformationObject</em> level; if also absent there, to the
				 *       // sequence's default easing.
				 *
				 *       [unit: <em>UnitDefinition</em>,] // If absent, falls back to the unit defined at the
				 *       // <em>TransformationObject</em> level; if also absent there, to the sequence's
				 *       // default unit.
				 *   };
				 *
				 * <strong><em>KeyframeTimesArray</em></strong> = An array of the form [<em>TimeDefinition<sub>1</sub></em>, <em>TimeDefinition<sub>2</sub></em>, ...].
				 * This defines the timeline points used as keyframes for this transformation series,
				 * to be matched up with the values in the corresponding <em>KeyframeValuesArray</em>. A null
				 * element has the effect of breaking the keyframe string into two segments. For example,
				 * the array [0, 100, 1000, 2000] defines a constant flow of transition with four
				 * keyframes. The array [0, 100, null, 1000, 2000], on the other hand, defines a flow
				 * that is broken in two pieces: one animated segment with keyframes at time 0 and 100,
				 * then no further animation at all until until time 1000, followed by another period
				 * of animation between the keyframes at times 1000 and 2000.
				 *
				 * <strong><em>KeyframeValuesArray</em></strong> = An array of the form [<em>ValueDefinition<sub>1</sub></em>, <em>ValueDefinition<sub>2</sub></em>, ...].
				 * This defines the values applied at each keyframe point, as matched up with the keyframe
				 * points defined in the corresponding <em>KeyframeTimesArray</em>. Note that null values
				 * appearing in this array work exactly the same way (and should match up with) null
				 * values in the <em>KeyframeTimesArray</em>. Both arrays must have the same number of elements.
				 *
				 * <strong><em>ValueGeneratorsArray</em></strong> = An array of the form [<em>ValueGenerator<sub>1</sub></em>, <em>ValueGenerator<sub>2</sub></em>, ...].
				 * This defines the functions that calculate values applied at each keyframe point, as
				 * matched up with the keyframe points defined in the corresponding <em>KeyframeTimesArray</em>.
				 *
				 * <strong><em>TimeDefinition</em></strong> = A number indicating a point along the sequence timeline. When
				 * synchronizing to a media object or running by the system clock, this should ordinarily
				 * be specified as a number of milliseconds (1/1000's of a second). Otherwise, there is no
				 * restriction; it simply indicates a numeric point on the overall timeline, with no
				 * particular unit implied. For instance, a sequence could be synchronized to the value
				 * of a slider or other user control, in which case this number would just be anything
				 * from the minimum to the maximum values of that control.
				 *
				 * <strong><em>ValueDefinition</em></strong> = A value to be applied to the target object feature, or an array of
				 * such values. This value can be of any type, although it needs to be one appropriate to
				 * the target feature, calculator, and applicator being used. If a unit is specified, the
				 * value will be treated as a string and the unit will be appended to it before
				 * application. Arrays are allowed as a shorthand method of defining multiple features,
				 * values, and units together in a more compact notation. The first value in the array
				 * will be matched with the first unit and the first feature in those arrays, and so on.
				 * See below samples for an example of using arrays in this way.
				 *
				 * <strong><em>ValueGenerator</em></strong> = A function which returns a valid <em>ValueDefinition</em> and has the signature:
				 *   <em>function generatorFunction(sequence)</em>
				 * This is a mechanism that allows specifying functions that will calculate start and end
				 * values for a transformation, instead of using fixed values determined at the time the
				 * transformation is initially specified. This can be helpful if the same transformation
				 * will be run more than once with different start and end values, such as a motion that
				 * might be repeated in more than one place on the screen at different times, or if the
				 * transformation is being added to the sequence before the actual start and end values
				 * are yet known. This is not to be confused with a Calculator function. A Calculator
				 * takes a start and end value along with the current time and calculates the current
				 * value. This function, by contrast, is called prior to running the sequence and
				 * determines what the start and end values are that the Calculator will look at during
				 * run-time of the sequence. All of the value generator functions for an entire sequence
				 * are called at once, either manually by calling the sequence's [generateValues]{@link Concert.Sequence#generateValues} method,
				 * or at the time the sequence is run, by specifying <code>true</code> for the <code>generateValues</code> option
				 * when calling the [run]{@link Concert.Sequence#run}, [begin]{@link Concert.Sequence#begin}, [follow]{@link Concert.Sequence#follow}, or [syncTo]{@link Concert.Sequence#syncTo} methods.
				 * The generator function will be passed a reference to the sequence object containing the
				 * transformation whose values are currently being generated.
				 *
				 *</pre>
				 * @example <caption>Example 1 Below: Single target object and feature, using keyframes, not relying on defaults. This would move a DOM object with id "someObject"
				 * by changing its "left" style value from "0px" to "60px" over the timeline period from time 1000 to 2000.</caption>
				 * sequence.addTransformations({
				 *     target: document.getElementById("someObject"),
				 *     feature: "left",
				 *     unit: "px",
				 *     applicator: Concert.Applicators.Style,
				 *     calculator: Concert.Calculators.Linear,
				 *     easing: Concert.EasingFunctions.ConstantRate,
				 *     keyframes: { times: [1000, 2000], values: [0, 60] }
				 *   });
				 *     
				 * @example <caption>Example 2 Below: This example demonstrates adding transformations for more than one target at a time, using both the
				 * "keyframes" and "segments" styles of definition, and using arrays for the target features and values. (An array could also have been
				 * specified for the "unit" property, but that isn't necessary if the same unit is being used for all the features as it is here.) Also
				 * note that the setDefaults method is being used to avoid having to specify common properties over and over again.
				 * This code would move the DOM object with id "someObject1" from position (0, 0) to (100, 200) from time 0 to 1000,
				 * and would change the width on the object with id "someObject2" from 75 to 150 and back to 75 again over the same time period.</caption>
				 * sequence.setDefaults(
				 *   {
				 *     applicator: Concert.Applicators.Style,
				 *     calculator: Concert.Calculators.Linear,
				 *     easing: Concert.EasingFunctions.ConstantRate,
				 *     unit: "px"
				 *   });
				 *
				 * sequence.addTransformations(
				 *   [
				 *     {
				 *       target: document.getElementById("someObject1"),
				 *       feature: ["left", "top"],
				 *       keyframes: { times: [0, 1000], values: [[0, 0], [100, 200]] }
				 *     },
				 *
				 *     {
				 *       target: document.getElementById("someObject2"),
				 *       feature: "width",
				 *       segments:
				 *         [
				 *           { t0:   0, t1:  500,    v0:  75, v1: 150 },
				 *           { t0: 500, t1: 1000,    v0: 150, v1:  75 },
				 *         ]
				 *     }
				 *   ]);
				 *     
				 * @example <caption>Example 3 Below: This example demonstrates using value generator functions instead of fixed values.
				 * This could would create a single transformation that animates the "left" property of the DOM element with ID "PhotonTorpedoBox".
				 * The animation runs from time 0 to time 1000, but the actual values are not yet known. Imagining that we're animating the firing
				 * of a torpedo from a ship whose location at the time the torpedo will be fired is not yet known, we set up functions that can
				 * determine the proper start and end locations later. Then, whenever it is appropriate to determine and fix the actual numbers,
				 * we would call generateValues(), which calls the generator functions and stores the values returned to be used when the sequence
				 * is run. (Or, if the generateValues option is specified with a value of true when running the sequence, generateValues() will be
				 * called automatically at that time.) Also note, the QuadIn easing function is used here, which will cause the motion to speed
				 * up as it proceeds from beginning to end.</caption>
				 * sequence.setDefaults(
				 *   {
				 *     applicator: Concert.Applicators.Style,
				 *     calculator: Concert.Calculators.Linear,
				 *     easing: Concert.EasingFunctions.QuadIn,
				 *     unit: "px"
				 *   });
				 * 
				 * sequence.addTransformations(
				 *   {
				 *     target: document.getElementById("PhotonTorpedoBox"),
				 *     feature: "left",
				 *     segments:
				 *       [{
				 *         t0: 0,
				 *         t1: 1000,
				 *         v0Generator:
				 *           function ()
				 *           {
				 *             var ship = document.getElementById("SpaceshipBox");
				 *             return (ship.offsetLeft + ship.offsetWidth);
				 *           },
				 *         v1Generator:
				 *           function ()
				 *           {
				 *             var ship = document.getElementById("SpaceshipBox");
				 *             return (ship.offsetLeft + ship.offsetWidth + 1000);
				 *           }
				 *       }]
				 *   });
				 * // ... sometime later:
				 * sequence.generateValues();
				 * 
				 * @example <caption>Example 3b Below: Shown here is the relevant portion of the last example modified to use keyframes notation instead of
				 * segments notation.</caption>
				 * sequence.addTransformations(
				 *   {
				 *     target: document.getElementById("PhotonTorpedoBox"),
				 *     feature: "left",
				 *     keyframes:
				 *       {
				 *         times: [0, 1000],
				 *         valueGenerators:
				 *         [
				 *           function ()
				 *           {
				 *             var ship = document.getElementById("SpaceshipBox");
				 *             return (ship.offsetLeft + ship.offsetWidth);
				 *           },
				 *
				 *           function ()
				 *           {
				 *             var ship = document.getElementById("SpaceshipBox");
				 *             return (ship.offsetLeft + ship.offsetWidth + 1000);
				 *           }
				 *         ]
				 *       }
				 *   });
				 *
				 * @example <caption>Example 4 Below: This example demonstrates using custom applicator, calculator, and easing functions
				 * to manipulate the width of a DOM object. The code shows a custom applicator function that could be used if we wanted to
				 * use a jQuery object containing multiple elements as a target object. <strong>Note that ConcertJS does NOT depend in any
				 * way on jQuery; this example merely shows
				 * using the two libraries in conjunction.</strong> The custom calculator function also makes use of jQuery, and shows how
				 * a custom calculator could be used to generate truly dynamic values- in this case, it keeps the calculated value locked
				 * to the width of a particular DOM element. The custom easing function shown here causes the animation to proceed at
				 * half-speed for two thirds of the time, then double-speed for the final third of the time.
				 * </caption>
				 * function customApplicator(target, feature, value, unit)
				 * {
				 *   target.each(function () { $(this).css(feature, value + unit); });
				 * }
				 * 
				 * function customCalculator(distanceFraction, startValue, endValue, addlProperties)
				 * {
				 *   var outerBoxWidth = $("#OuterBox").innerWidth();
				 *   return (distanceFraction * (endValue - startValue) * outerBoxWidth);
				 * }
				 * 
				 * function customEasing(startTime, endTime, currentTime)
				 * {
				 *   var fractionComplete = (currentTime - startTime) / (endTime - startTime);
				 *   if (fractionComplete < 2 / 3)
				 *     return (fractionComplete / 2);
				 *   else
				 *     return (1 / 3 + 2 * (fractionComplete - 2 / 3));
				 * }
				 * 
				 * sequence.addTransformations(
				 *   {
				 *     target: $(".InnerBox"),
				 *     feature: "width",
				 *     applicator: customApplicator,
				 *     calculator: customCalculator,
				 *     easing: customEasing,
				 *     unit: "px",
				 *     keyframes:
				 *     {
				 *       times: [0, 1000],
				 *       values: [0, 0.5]
				 *     }
				 *   });
				 */
				function __addTransformations(transformationSet)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, j, k, numTransformationGroups, curTransformationGroup, curGroupTarget, curGroupTargets, numCurGroupTargets, singleTargetVersion,
						curGroupFeatures, curGroupUnit, curGroupCalculator, curGroupEasing, curGroupApplicator, curGroupKeyFrames, curGroupSegments,
						numSegments, curSegment, propertyName, newTransformationProperties, newTransformation, singleFeatureSequence, curFeatureSequences,
						existingTargetSequences = thisProtected.targetSequences, curTargetSequence = null, defaults = thisProtected.defaults, numKeyFrames, times,
						values, valueGenerators, curKeyFrameTime, curKeyFrameValue, curKeyFrameValueGenerator, lastKeyFrameTime, lastKeyFrameValue, lastKeyFrameValueGenerator,
						createSegment, allTransformations = thisProtected.allTransformations, dynamicValueTransformations = thisProtected.dynamicValueTransformations;

					if (thisProtected.indexingInProgress)
						thisProtected.resetIndexing();
					else
						thisProtected.indexed = false;

					if (!(_Concert.Util.isArray(transformationSet)))
						transformationSet = [transformationSet];

					for (i = 0, numTransformationGroups = transformationSet.length; i < numTransformationGroups; i++)
					{
						curTransformationGroup = transformationSet[i];

						curGroupTarget = curTransformationGroup.target;

						curGroupTargets = curTransformationGroup.targets;
						if (_Concert.Util.isArray(curGroupTargets))
						{
							if ((typeof curGroupTarget !== "undefined") && (curGroupTarget !== null))
								curGroupTargets = [curGroupTarget].concat(curGroupTargets);

							for (j = 0, numCurGroupTargets = curGroupTargets.length; j < numCurGroupTargets; j++)
							{
								singleTargetVersion = {};
								for (propertyName in curTransformationGroup) if (curTransformationGroup.hasOwnProperty(propertyName))
									singleTargetVersion[propertyName] = curTransformationGroup[propertyName];
								singleTargetVersion.targets = null;
								singleTargetVersion.target = curGroupTargets[j];
								thisPublic.addTransformations(singleTargetVersion);
							}

							continue;
						}

						curTargetSequence = thisProtected.findTargetSequenceByTarget(curGroupTarget);
						if (curTargetSequence === null)
						{
							curTargetSequence = new _Concert.TargetSequence(curGroupTarget);
							existingTargetSequences.push(curTargetSequence);
						}

						curGroupFeatures = _Concert.Util.isArray(curTransformationGroup.feature) ? curTransformationGroup.feature : [curTransformationGroup.feature];
						curGroupApplicator = curTransformationGroup.applicator;
						if (typeof curGroupApplicator === "undefined")
							curGroupApplicator = defaults.applicator;
						curGroupUnit = curTransformationGroup.unit;
						if (typeof curGroupUnit === "undefined")
							curGroupUnit = defaults.unit;
						curGroupCalculator = curTransformationGroup.calculator;
						if (typeof curGroupCalculator === "undefined")
							curGroupCalculator = defaults.calculator;
						curGroupEasing = curTransformationGroup.easing;
						if (typeof curGroupEasing === "undefined")
							curGroupEasing = defaults.easing;

						curFeatureSequences = new Array(curGroupFeatures.length);
						for (j = 0; j < curGroupFeatures.length; j++)
						{
							singleFeatureSequence = curTargetSequence.findFeatureSequenceByFeature(curGroupFeatures[j]);
							if (singleFeatureSequence === null)
							{
								singleFeatureSequence = new _Concert.FeatureSequence(curGroupTarget, curGroupFeatures[j]);
								curTargetSequence.addFeatureSequence(singleFeatureSequence);
							}
							curFeatureSequences[j] = singleFeatureSequence;
						}

						curGroupKeyFrames = curTransformationGroup.keyframes;
						if (typeof curGroupKeyFrames !== "undefined")
						{
							times = curGroupKeyFrames.times;
							values = curGroupKeyFrames.values;
							valueGenerators = curGroupKeyFrames.valueGenerators;

							lastKeyFrameTime = lastKeyFrameValue = lastKeyFrameValueGenerator = curKeyFrameValue = curKeyFrameValueGenerator = null;
							for (j = 0, numKeyFrames = times.length; j < numKeyFrames; j++)
							{
								curKeyFrameTime = times[j];
								if (values)
									curKeyFrameValue = values[j];
								if (valueGenerators)
									curKeyFrameValueGenerator = valueGenerators[j];

								if (lastKeyFrameTime === null)
								{
									lastKeyFrameTime = curKeyFrameTime;
									lastKeyFrameValue = curKeyFrameValue;
									lastKeyFrameValueGenerator = curKeyFrameValueGenerator;

									createSegment = ((curKeyFrameTime !== null) && (j === numKeyFrames - 1)); // If this is the last keyframe, preceded by a null keyframe, create a segment out of just this one keyframe.
								}
								else if (curKeyFrameTime === null)
								{
									lastKeyFrameTime = lastKeyFrameValue = lastKeyFrameValueGenerator = null;
									createSegment = false;
								}
								else
									createSegment = true;

								if (createSegment)
								{
									newTransformationProperties =
										{
											target: curGroupTarget,
											feature: (curGroupFeatures.length === 1) ? curGroupFeatures[0] : curGroupFeatures,
											applicator: curGroupApplicator,
											unit: curGroupUnit,
											calculator: curGroupCalculator,
											easing: curGroupEasing,
											t0: lastKeyFrameTime,
											t1: curKeyFrameTime,
											v0: lastKeyFrameValue,
											v1: curKeyFrameValue,
											v0Generator: lastKeyFrameValueGenerator,
											v1Generator: curKeyFrameValueGenerator
										};
									newTransformation = new _Concert.Transformation(newTransformationProperties);
									allTransformations.push(newTransformation);
									if (lastKeyFrameValueGenerator || curKeyFrameValueGenerator)
										dynamicValueTransformations.push(newTransformation);
									for(k = 0; k < curFeatureSequences.length; k++)
										curFeatureSequences[k].transformations.push(newTransformation);

									lastKeyFrameTime = curKeyFrameTime;
									lastKeyFrameValue = curKeyFrameValue;
								} // end if (createSegment)
							} // end for loop iterating through keyframes
						} // end if (typeof curGroupKeyFrames != "undefined")
						else
						{
							curGroupSegments = curTransformationGroup.segments;
							if (!(_Concert.Util.isArray(curGroupSegments)))
								curGroupSegments = [curGroupSegments];

							for (j = 0, numSegments = curGroupSegments.length; j < numSegments; j++)
							{
								curSegment = curGroupSegments[j];

								newTransformationProperties =
									{
										target: curGroupTarget,
										feature: (curGroupFeatures.length === 1) ? curGroupFeatures[0] : curGroupFeatures,
										applicator: curGroupApplicator
									};

								for (propertyName in curSegment) if (curSegment.hasOwnProperty(propertyName))
									newTransformationProperties[propertyName] = curSegment[propertyName];
								if (typeof newTransformationProperties.unit === "undefined")
									newTransformationProperties.unit = curGroupUnit;
								if (typeof newTransformationProperties.calculator === "undefined")
									newTransformationProperties.calculator = curGroupCalculator;
								if (typeof newTransformationProperties.easing === "undefined")
									newTransformationProperties.easing = curGroupEasing;

								newTransformation = new _Concert.Transformation(newTransformationProperties);
								allTransformations.push(newTransformation);
								if ((typeof newTransformationProperties.v0Generator !== "undefined") || (typeof newTransformationProperties.v1Generator !== "undefined"))
									dynamicValueTransformations.push(newTransformation);
								for (k = 0; k < curFeatureSequences.length; k++)
									curFeatureSequences[k].transformations.push(newTransformation);
							} // end loop through segments
						} // end if/else on (typeof curGroupKeyFrames != "undefined")
					} // end for loop iterating through transformation groups
				} // end __addTransformations()


				/**
				 * Runs a transformation starting from the beginning, locked to the system clock and automatically stopping upon reaching the end.
				 * This is really just a shortcut method provided for a common usage scenario; it is exactly the same as calling the [run]{@link Concert.Sequence#run} method with the parameters
				 * <code>{ synchronizeTo: null, initialSeek: 0, timeOffset: null, autoStopAtEnd: true }</code>. Note that these parameter values can still be overridden, or any of the other parameters
				 * accepted by the [run]{@link Concert.Sequence#run} method can be specified in the <code>parameters</code> argument passed into this method.
				 * @name begin
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} [parameters] An object with property values setting options for how to run the sequence.
				 * See the [run]{@link Concert.Sequence#run} method for information on allowable properties and values in this object.
				 */
				function __begin(parameters)
				{
					var thisPublic = this.thisPublic; //, thisProtected = _getProtectedMembers.call(thisPublic); // Can save a few bytes in the minified version since thisProtected isn't used in this function

					thisPublic.run(_getCombinedParams({ synchronizeTo: null, initialSeek: 0, timeOffset: null, autoStopAtEnd: true }, parameters));
				} // end __begin()


				/**
				 * Creates a duplicate of a sequence, allowing a sequence to be defined once and then cloned to apply to any number of different sets of target objects.
				 * For example, the same series of animated motions might be applied to numerous on-screen elements.
				 * Since each sequence may contain transformations targeting numerous different objects, this is accomplished by passing in a function that,
				 * when passed a transformation target from the original sequence, returns the corresponding object to be targeted in the new sequence.
				 * (Note that one useful way of doing this easily is to set the targets of the original sequence to be strings or integers instead of actual objects. The original sequence then just becomes essentially a dummy sequence with placeholder targets that your function can easily identify and use for looking up substitute target objects.)
				 * This method is capable of duplicating nearly every aspect of the original sequence, including jumping to the same current point in time and even
				 * cloning its running or non-running status if desired. (To change the target objects of a sequence without creating a new one, see the [retarget]{@link Concert.Sequence#retarget} method.)
				 * @name clone
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} targetLookupFunction A function taking a single parameter. The value passed in will be one of the transformation targets of the original sequence. The function must return the equivalent object which should be targeted by the equivalent transformation in the new sequence.
				 * @param {boolean} [matchRunningStatus=false] If <code>true</code>, and the sequence being cloned is currently running, the new sequence will jump to the same point on the timeline and run as well. Otherwise, the new sequence will not automatically start running.
				 * @param {boolean} [doInitialSeek=false] If <code>true</code>, the new sequence will immediately seek to the same point on the timeline as the original sequence. Otherwise, the new sequence will merely be created, but will not immediately perform any action (unless the matchRunningStatus parameter is <code>true</code>).
				 * @returns {Object} A new [Sequence]{@link Concert.Sequence} object, with the same properties and duplicates of all the same transformations that were in the original sequence, but with new target objects of those transformations substituted in as controlled by the <code>targetLookupFunction</code> parameter.
				 * @example <caption>One possible method of using this function easily for replicating a sequence definition onto any number of targets is shown below. The initial sequence here is defined with two transformations that are given strings ("UpperElement" and "LowerElement") as targets. The initial sequence is thus just a dummy from which we can clone easily and repeatedly, and the strings make helpful placeholders for the function passed into the clone method to use for matching up to real DOM elements or other intended target objects which we may have created dynamically at a later time. Note further that if you index a sequence before cloning it, resulting cloned sequences will already be indexed and can be run instantly without any indexing lag.</caption>
				 * var originalSequence = new Concert.Sequence();
				 * originalSequence.setDefaults(
				 *   {
				 *     applicator: Concert.Applicators.Style,
				 *     calculator: Concert.Calculators.Linear,
				 *     easing: Concert.EasingFunctions.ConstantRate,
				 *     unit: "px"
				 *   });
				 * originalSequence.addTransformations(
				 *   [
				 *     {
				 *       target: "UpperElement", feature: "left",
				 *       keyframes: { times: [0, 1000], values: [100, 200] }
				 *     },
				 *     {
				 *       target: "LowerElement", feature: "left",
				 *       keyframes: { times: [0, 1000], values: [100, 200] }
				 *     }
				 *   ]);
				 * 
				 * //...some time later, having creating DOM elements with id values
				 * // like "UpperElement1", "LowerElement1", "UpperElement2", ...
				 * var newSequence1 = originalSequence.clone(
				 *     function (originalTarget)
				 *     { return document.getElementById(originalTarget + "1"); });
				 * var newSequence2 = originalSequence.clone(
				 *     function (originalTarget)
				 *     { return document.getElementById(originalTarget + "2"); });
				 */
				function __clone(targetLookupFunction, matchRunningStatus, doInitialSeek)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, j, propertyName, curTargetTransformations, curTargetNumTransformations, newPoller,
						newRunning = (matchRunningStatus && thisProtected.running), newCurrentTime = thisProtected.currentTime,
						newSynchronizer = thisProtected.synchronizer, newSpeed = thisProtected.speed,
						newTimeOffset = thisProtected.timeOffset, newPollingInterval = thisProtected.pollingInterval,
						newInitialSyncSourcePoint = thisProtected.initialSyncSourcePoint,
						numAllTransformations = thisProtected.allTransformations.length,
						newTransformationsAdded = 0, newDynamicValueTransformationsAdded = 0,
						curNewTransformation, allNewTransformations = new Array(numAllTransformations),
						newDynamicValueTransformations = new Array(thisProtected.dynamicValueTransformations.length),
						targetSequences = thisProtected.targetSequences, numTargetSequences = targetSequences.length,
						newTargetSequences = new Array(numTargetSequences), curTargetSequence, targetSequenceCloneReturn,
						timelineSegments = thisProtected.timelineSegments, numTimelineSegments = timelineSegments.length,
						newTimelineSegments = new Array(numTimelineSegments), curTimelineSegment,
						defaults = thisProtected.defaults, newDefaults = {},
						newSequence = new _Concert.Sequence(), newPublicData = {}, newProtectedData,
						newSoleControlOptimizationDuringRun = thisProtected.soleControlOptimizationDuringRun;

					for (i = 0; i < numTargetSequences; i++)
					{
						curTargetSequence = targetSequences[i];
						targetSequenceCloneReturn = curTargetSequence.clone(targetLookupFunction(curTargetSequence.getTarget()));

						newTargetSequences[i] = targetSequenceCloneReturn.targetSequence;

						curTargetTransformations = targetSequenceCloneReturn.transformations;
						for (j = 0, curTargetNumTransformations = curTargetTransformations.length; j < curTargetNumTransformations; j++)
						{
							curNewTransformation = curTargetTransformations[j];
							allNewTransformations[newTransformationsAdded] = curNewTransformation;
							newTransformationsAdded++;
							if (curNewTransformation.hasDynamicValues())
							{
								newDynamicValueTransformations[newDynamicValueTransformationsAdded] = curNewTransformation;
								newDynamicValueTransformationsAdded++;
							}
						}
					}

					for (i = 0; i < numTimelineSegments; i++)
					{
						curTimelineSegment = timelineSegments[i];
						newTimelineSegments[i] = new _Concert.TimelineSegment(curTimelineSegment.startTime, curTimelineSegment.endTime);
					}

					for (propertyName in defaults)
					{
						if (defaults.hasOwnProperty(propertyName))
							newDefaults[propertyName] = defaults[propertyName];
					}

					newPoller = newRunning ? (newPoller = (newPollingInterval < 1) ? (new _Concert.Pollers.Auto()) : (new _Concert.Pollers.FixedInterval(newPollingInterval))) : null;

					newProtectedData =
						{
							targetSequences: newTargetSequences,
							timelineSegments: newTimelineSegments,
							lastUsedTimelineSegmentNumber: thisProtected.lastUsedTimelineSegmentNumber,
							allTransformations: allNewTransformations,
							dynamicValueTransformations: newDynamicValueTransformations,
							indexCompletionCallbacks: [],
							indexed: thisProtected.indexed,
							indexingInProgress: false,
							indexTimerID: null,
							indexingProcessData: {},
							running: newRunning,
							currentTime: newCurrentTime,
							unadjustedTime: thisProtected.unadjustedTime,
							sequenceStartTime: thisProtected.sequenceStartTime,
							sequenceEndTime: thisProtected.sequenceEndTime,
							poller: newPoller,
							synchronizer: newSynchronizer,
							initialSyncSourcePoint: newInitialSyncSourcePoint,

							defaults: newDefaults,

							synchronizeTo: thisProtected.synchronizeTo,
							speed: newSpeed,
							timeOffset: newTimeOffset,
							pollingInterval: newPollingInterval,
							after: thisProtected.after,
							before: thisProtected.before,
							autoStopAtEnd: thisProtected.autoStopAtEnd,
							onAutoStop: thisProtected.onAutoStop,
							stretchStartTimeToZero: thisProtected.stretchStartTimeToZero,
							soleControlOptimizationDuringRun: newSoleControlOptimizationDuringRun
						};

					_loadObjectData.call(newSequence, newPublicData, newProtectedData);

					if (doInitialSeek)
						newSequence.seek(newCurrentTime, newSoleControlOptimizationDuringRun);

					if (newRunning)
						newPoller.run(function () { newSequence.seek(newInitialSyncSourcePoint + newSpeed * (newSynchronizer() - newInitialSyncSourcePoint) + newTimeOffset, newSoleControlOptimizationDuringRun); });

					return newSequence;
				} // end __clone()


				/**
				 * Runs a transformation starting from the current timeline position, locked to the specified synchronization source. This differs from the [syncTo]{@link Concert.Sequence#syncTo} method
				 * in that <code>follow</code> causes the sequence to run exactly in time with the synchronization source and in the same direction, but starting at the current timeline position, whereas
				 * with [syncTo]{@link Concert.Sequence#syncTo} the sequence will first jump to a timeline position matching the current value of the synchronization source and then do the same.
				 * This is really just a shortcut method provided for a common usage scenario; it is exactly the same as calling the [run]{@link Concert.Sequence#run} method with the parameters
				 * <code>{ synchronizeTo: <em>syncSource</em>, initialSeek: null, timeOffset: null }</code>. Note that these parameter values can still be overridden, or any of the other parameters
				 * accepted by the [run]{@link Concert.Sequence#run} method can be specified in the <code>parameters</code> argument passed into this method.
				 * @name follow
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Varies} syncSource A synchronization source. Can take any of the following different types of values:<pre>
				 *   null: locks sequence to the system clock.
				 *   function object: the passed-in function is called every time the polling
				 *       interval is reached, and the return value is used as the seek time.
				 *       Using a custom function here allows you to synchronize the sequence to
				 *       anything you want (for instance, locking it to the current value of a UI
				 *       element, such as a slider, or to another Concert.Sequence object.)
				 *   html audio or video DOM object: locks the sequence to the currentTime property
				 *       of the media element. This allows the sequence to remain synchronized to
				 *       the media even when it is paused, scrubbed, or the user skips around.</pre>
				 * @param {Object} [parameters] An object with property values setting options for how to run the sequence.
				 * See the [run]{@link Concert.Sequence#run} method for information on allowable properties and values in this object.
				 */
				function __follow(syncSource, parameters)
				{
					var thisPublic = this.thisPublic; //, thisProtected = _getProtectedMembers.call(thisPublic); // Can save a few bytes in the minified version since thisProtected isn't used in this function

					thisPublic.run(_getCombinedParams({ synchronizeTo: syncSource, initialSeek: null, timeOffset: null }, parameters));
				} // end __follow()


				/**
				 * Calls the value generation functions attached to transformations that have value generators instead of fixed start and end values.<br>
				 * <em>It may be useful at times to define transformations whose start and end values are not fixed at the time the transformations are first defined,
				 * but which instead are calculated dynamically at some later time prior to running the sequence. This is accomplished by specifying functions instead
				 * of start and end values, as explained in the documentation for the [addTransformations]{@link Concert.Sequence#addTransformations} method.
				 * Those functions (for all such transformations in a sequence) are then called, and their return values stored as the start and end values of their
				 * respective transformations, either at the time the sequence is run by specifying the appropriate option when calling the [run]{@link Concert.Sequence#run},
				 * [begin]{@link Concert.Sequence#begin}, [follow]{@link Concert.Sequence#follow}, or [syncTo]{@link Concert.Sequence#syncTo} methods, or at any time by
				 * calling <code>generateValues</code>.</em>
				 * @name generateValues
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 */
				function __generateValues()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, dynamicValueTransformations = thisProtected.dynamicValueTransformations, numDynamicValueTransformations = dynamicValueTransformations.length;

					for (i = 0; i < numDynamicValueTransformations; i++)
						dynamicValueTransformations[i].generateValues(thisPublic);
				} // end __generateValues();


				/**
				 * Gets the current position along a sequence's timeline.
				 * @name getCurrentTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} The sequence's current timeline position.
				 */
				function __getCurrentTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.currentTime;
				} // end _getCurrentTime()


				/**
				 * Gets the end time of a sequence's timeline. This end time of a sequence is considered to be the last end time of any transformation within that sequence.
				 * @name getEndTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} The end time of the sequence's timeline.
				 */
				function __getEndTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					return thisProtected.sequenceEndTime;
				} // end __getEndTime()


				/**
				 * Returns a unique integer identifying this sequence.
				 * @name getID
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} The sequence ID.
				 */
				function __getID()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.ID;
				} // end __getID()


				/**
				 * Gets the start time of a sequences timeline. The start time of a sequence is considered to be the first start time of any transformation within that sequence.
				 * @name getStartTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} The start time of the sequence's timeline.
				 */
				function __getStartTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					return (thisProtected.stretchStartTimeToZero ? Math.min(thisProtected.sequenceStartTime, 0) : thisProtected.sequenceStartTime);
				} // end __getStartTime()


				/**
				 * Indexes a sequence. This function is run automatically (if necessary) any time a sequence is run or the [seek]{@link Concert.Sequence#seek} method is called.
				 * However, for very large sequences (large enough that indexing would cause a noticable lag), it may be desirable to manually control when indexing takes place
				 * (that is, to pre-index the sequence), so that seeking or running will begin instantly. Once indexed, a sequence (or any sequences cloned from it) will not need
				 * to be indexed again unless new transformations are added to it.<br><br>
				 * <strong>Explanation of Indexing:</strong> ConcertJS sequences can consist of very large numbers of transformations applied to numerous target objects,
				 * with the ability to seek extremely quickly to any point in the sequence. This is what makes it useful for synchronizing to other things (such as audio or video)
				 * and for other situations that require arbitrary seeking, running at different speeds or in either direction, or other uses that don't conform to a simple,
				 * run-once-forward-only-at-normal-speed scenario. What makes this possible is an internal data structure that optimizes for quickly finding the correct value
				 * to apply to every target feature of every one of the objects being animated, at any point along the timeline. This internal structure involves a set of pre-built indexes
				 * of timeline segments. Much like indexes on database tables, this vastly speeds up run-time lookup performance by doing some processing ahead of time to analyze and organize the data.
				 * Every sequence needs to be indexed once (or again after any new transformations are added). Running or seeking to any point in an un-indexed sequence will cause indexing to take place
				 * automatically, or indexing can be run manually with this method. In many cases, the automatic indexing will run fast enough that manually running the indexer is not necessary.
				 * @name index
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} completionCallback This function will be executed upon completion of indexing. It is especially useful if the <code>isAsynchronous</code>
				 * parameter is set to <code>true</code>. The function specified here should have a signature of the form <code>someCallBackFunction(sequenceObject)</code>.
				 * That is, the function will be called with a single argument, which will be the sequence object whose indexing has completed. (For purposes of handling this
				 * callback when there are multiple sequences being manipulated, it may also be helpful to remember that every [Sequence]{@link Concert.Sequence} object has a
				 * unique  integer ID which can be retrieved using the [getID]{@link Concert.Sequence#getID} method.)
				 * @param {boolean} isAsynchronous If <code>true</code>, the indexing process will not be run all at once, but will instead be broken into
				 * smaller chunks of work and scheduled using calls to <code>window.setTimeout</code>. This is useful for very large sequences, to help reduce
				 * or eliminate any noticable pause in browser responsiveness while indexing is taking place.<br>
				 * <em>For the current version, the indexer makes a best effort to keep each processing chunk under 100 ms. Future versions may allow the
				 * programmer to adjust this value, and may also be able to incorporate web workers as a way of pushing most of the work into a completely separate,
				 * concurrent thread.
				 */
				function __index(completionCallback, isAsynchronous)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					if (thisProtected.indexed && completionCallback)
						completionCallback(thisPublic);
					else if (thisProtected.allTransformations.length < 1)
					{
						thisProtected.indexed = true;
						if (completionCallback)
							completionCallback(thisPublic);
					}
					else
					{
						if (completionCallback)
							thisProtected.indexCompletionCallbacks.push(completionCallback);

						if (!thisProtected.indexingInProgress)
							thisProtected.resetIndexing();

						thisProtected.indexingProcessData.isAsynchronous = isAsynchronous ? true : false;

						thisProtected.runIndexing();
					}
				} // end __index()


				/**
				 * Gets a value indicating whether the sequence is currently running or not.
				 * @name isRunning
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {boolean} <code>true</code> if the sequence is currently running, <code>false</code>otherwise.
				 */
				function __isRunning()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.running;
				} // end __isRunning()


				/**
				 * Changes the target objects for all the transformations in a sequence. This could be useful if a sequence is being defined before its targets are created.
				 * For instance, if it will be used to animate DOM elements that don't yet exist at the time the sequence is being created, a sequence can be created with
				 * placeholder targets (such as strings or integers), and then the real targets substituted in later with this method.
				 * (If you wish to apply the same sequence to multiple sets of targets, or to more than one set of targets simultaneously, you may wish to see the [clone]{@link Concert.Sequence#clone} method.)
				 * @name retarget
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} targetLookupFunction A function that, when passed a transformation target from the sequence as currently defined, returns the new object to be targeted.
				 */
				function __retarget(targetLookupFunction)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, curTargetSequence, targetSequences = thisProtected.targetSequences, numTargetSequences = targetSequences.length;
					for (i = 0; i < numTargetSequences; i++)
					{
						curTargetSequence = targetSequences[i];
						curTargetSequence.retarget(targetLookupFunction(curTargetSequence.getTarget()));
					}
				} // end _retarget()


				/**
				 * Runs the sequence, with the options defined in the <code>parameters</code> object.
				 * For many purposes, one of the other run methods ([begin]{@link Concert.Sequence#begin}, [follow]{@link Concert.Sequence#follow}, or [syncTo]{@link Concert.Sequence#syncTo})
				 * may be easier, because they assume certain default options that are correct in most usage scenarios, but this method is the general-purpose way to run a sequence
				 * with any set of behavioral options, and is in fact used behind the scenes by those other methods. Except for <code>generateValues</code>, <code>initialSeek</code>, and
				 * <code>timeOffset</code> (the last of which is automatically re-calculated if null), options specified in the <code>parameters</code> object are remembered and will be retained
				 * as the default values. This means for restarting stopped sequences, it is not always necessary to explicitly re-state all the options, and it also means that this method can be
				 * called on an already-running sequence to change run-time options on the fly.
				 * @name run
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} [parameters] An object with property values setting options for how to run the sequence. Defined as follows below. Any or all of the below options may be specified:<pre><code>
				 * parameters =
				 * {
				 *   // --------
				 *   // Function; Defines how the sequence behaves when the sequence end time is
				 *   // reached and exceeded.(Can also be set using the [setAfter]{@link Concert.Sequence#setAfter} method.)
				 *   // Takes one of the functions defined in the [Concert.Repeating]{@link Concert.Repeating} namespace, or a
				 *   // custom function. For instance, a value of Concert.Repeating.Loop(2) will cause
				 *   // the sequence to loop back to the beginning twice (thus running a total of three
				 *   // times) before ceasing. See [Concert.Repeating]{@link Concert.Repeating} for information on the pre-defined
				 *   // values, or see [setAfter]{@link Concert.Sequence#setAfter} for more information on using a custom function.
				 *   <strong>after</strong>: VALUE, // Initial default: Concert.Repeating.None
				 *
				 *   // --------
				 *   // Boolean; Whether or not to automatically call stop() upon hitting the end.
				 *   // (Note that "the end" means after all looping, bouncing, etc. is taken into
				 *   // account.)
				 *   <strong>autoStopAtEnd</strong>: VALUE, // Initial default: true
				 *
				 *   // --------
				 *   // Function; Defines how the sequence behaves when the calculated current time
				 *   // is at or less than the sequence start time. (Can also be set using the
				 *   // [setBefore]{@link Concert.Sequence#setBefore} method.) Takes one of the functions defined in the [Concert.Repeating]{@link Concert.Repeating}
				 *   // namespace, or a custom function. For instance, a value of
				 *   // Concert.Repeating.Loop(2) will cause the sequence to loop back to the end twice
				 *   // (thus running a total of three times) before ceasing. See [Concert.Repeating]{@link Concert.Repeating} for
				 *   // information on the pre-defined values, or see [setBefore]{@link Concert.Sequence#setBefore} for more information on
				 *   // using a custom function.
				 *   <strong>before</strong>: VALUE, // Initial default: Concert.Repeating.None
				 *
				 *   // --------
				 *   // If the sequence has any transformations whose start and end values are dynamic
				 *   // rather than fixed (see [addTransformations]{@link Concert.Sequence#addTransformations} for details), the actual values
				 *   // to use will have to be calculated at some point in order to run the sequence.
				 *   // This can be accomplished by calling [generateValues]{@link Concert.Sequence#generateValues} manually, or it will happen
				 *   // automatically just before run-time if this parameter is set to true.
				 *   <strong>generateValues</strong>: VALUE, // Default value: true
				 *
				 *   // --------
				 *   // Numeric; If specified, sequence will seek to this time before commencing
				 *   // the run.
				 *   <strong>initialSeek</strong>: VALUE, // Default: null
				 *
				 *   // --------
				 *   // Function; Callback function invoked just after automatically stopping at the
				 *   end of the sequence (only will be called if autoStopAtEnd is true).
				 *   <strong>onAutoStop</strong>: VALUE, // Initial default: null
				 *
				 *   // --------
				 *   // Numeric; How far apart (in milliseconds) to calculate and seek to a new
				 *   // timeline position. Set to any value > 0 for manual control, or set to 0
				 *   // (or anything < 1) to let Concert determine this automatically. (It does
				 *   // this by using requestAnimationFrame() for if the browser supports  it,
				 *   // or a fixed interval of 16 ms otherwise.
				 *   <strong>pollingInterval</strong>: VALUE, // Initial default: 0
				 *
				 *   // --------
				 *   // Numeric; Run speed multiplier (0.5 = half-speed, 2 = double-speed, ...)
				 *   <strong>speed</strong>: VALUE, // Initial default: 1
				 *
				 *   // --------
				 *   // Boolean; Indicates whether to treat the sequence start time as 0 even if the
				 *   // first transformation in the sequence starts at a time greater than 0. This
				 *   // prevents a sequence whose first animations begin some time into the timeline
				 *   // from auto-stopping or triggering its <em>before</em> behavior when it is run from
				 *   // time 0. To define the beginning of the sequence timeline as the beginning of
				 *   // the first transformation in the timeline no matter what, set to <em>false</em>.
				 *   <strong>stretchStartTimeToZero</strong>: VALUE // Initial default: true
				 *
				 *   // --------
				 *   // Variable type; Sets a synchronization source for this sequence. Can take any
				 *   // of the following different types of values:
				 *   //   null: locks sequence to the system clock.
				 *   //   function object: the passed-in function is called every time the polling
				 *   //       interval is reached, and the return value is used as the seek time.
				 *   //       Using a custom function here allows you to synchronize the sequence to
				 *   //       anything you want (for instance, locking it to the current value of a UI
				 *   //       element, such as a slider, or to another Concert.Sequence object.)
				 *   //   html audio or video DOM object: locks the sequence to the currentTime
				 *   //       property of the media element. This allows the sequence to remain
				 *   //       synchronized to the media even when it is paused, scrubbed, or the
				 *   //       user skips around.
				 *   <strong>synchronizeTo</strong>: VALUE, // Initial default: null
				 *
				 *   // --------
				 *   // Numeric; An offset value that is added to the current time before seeking
				 *   // every time the polling interval comes around. This is useful if you want
				 *   // your sequence to run fixed amount ahead of, or behind, your synchronization
				 *   // source. If null, this value is automatically calculated assuming that you
				 *   // want the current sequence time (or the sequence start time if no calls to
				 *   // seek() have yet been made) to match up with the current return value of the
				 *   // synchronization source. For instance, you may have a sequence that runs,
				 *   // locked to the system clock, from time 0 to time 10000 (i.e., for 10 seconds).
				 *   // But the raw value coming from the system clock is never between 0 and 10000;
				 *   // it is the number of milliseconds since January 1, 1970 00:00:00 UTC, which
				 *   // is a very high number. The timeOffset value is therefore added in order to
				 *   // translate the raw starting clock value to the start time of the sequence.
				 *   // But because this automatic translation may not always be the desired
				 *   // behavior, it can be explicitly set here.
				 *   <strong>timeOffset</strong>: VALUE, // Default value: null
				 *
				 *   // --------
				 *   // Boolean; Whether or not to optimize based on the assumption that none of the
				 *   // object properties being modified by this sequence are also being touched by
				 *   // anything else. See [seek]{@link Concert.Sequence#seek} method for details. (Note that regardless of the value
				 *   // specified here, the seek method can be called manually at any point with its
				 *   //  useSoleControlOptimization parameter set to either true or false.)
				 *   <strong>useSoleControlOptimization</strong>: VALUE, // Initial default: true
				 * }
				 * </code></pre>
				 */
				function __run(parameters)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var synchronizeTo, speed, timeOffset, initialSeek, pollingInterval,
						synchronizer, initialSyncSourcePoint, soleControlOptimizationDuringRun;

					if (thisProtected.running)
						thisPublic.stop();

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					if (_getParamValue(parameters, "generateValues", true))
						thisPublic.generateValues();

					initialSeek = _getParamValue(parameters, "initialSeek", null);
					if (initialSeek !== null)
						thisPublic.seek(initialSeek, false);

					thisProtected.speed = speed = _getParamValue(parameters, "speed", thisProtected.speed);
					thisProtected.after = _getParamValue(parameters, "after", thisProtected.after);
					thisProtected.before = _getParamValue(parameters, "before", thisProtected.before);
					thisProtected.autoStopAtEnd = _getParamValue(parameters, "autoStopAtEnd", thisProtected.autoStopAtEnd);
					thisProtected.onAutoStop = _getParamValue(parameters, "onAutoStop", thisProtected.onAutoStop);
					thisProtected.stretchStartTimeToZero = _getParamValue(parameters, "stretchStartTimeToZero", thisProtected.stretchStartTimeToZero);
					thisProtected.soleControlOptimizationDuringRun = soleControlOptimizationDuringRun = _getParamValue(parameters, "useSoleControlOptimization", thisProtected.soleControlOptimizationDuringRun);

					thisProtected.pollingInterval = pollingInterval = _getParamValue(parameters, "pollingInterval", thisProtected.pollingInterval);
					thisProtected.poller = (pollingInterval < 1) ? (new _Concert.Pollers.Auto()) : (new _Concert.Pollers.FixedInterval(pollingInterval));

					synchronizeTo = _getParamValue(parameters, "synchronizeTo", thisProtected.synchronizeTo);
					if (synchronizeTo === null)
						synchronizer = function () { return (new Date()).getTime(); };
					else
						synchronizer = ((typeof synchronizeTo) === "function") ? synchronizeTo : function () { return 1000 * synchronizeTo.currentTime; };
					thisProtected.synchronizer = synchronizer;

					thisProtected.initialSyncSourcePoint = initialSyncSourcePoint = synchronizer();
					timeOffset = _getParamValue(parameters, "timeOffset", null);
					if (timeOffset === null)
						timeOffset = (thisProtected.unadjustedTime !== null) ? (thisProtected.unadjustedTime - initialSyncSourcePoint) : (thisPublic.getStartTime() - initialSyncSourcePoint);
					thisProtected.timeOffset = timeOffset;

					thisProtected.running = true;
					thisProtected.poller.run(function () { thisPublic.seek(initialSyncSourcePoint + speed * (synchronizer() - initialSyncSourcePoint) + timeOffset, soleControlOptimizationDuringRun); });
				} // end __run()


				/**
				 * Seeks to the specified point along the sequence timeline. If the <code>time</code> value is less than the sequence's start time or greater than the sequence's end time,
				 * the resulting behavior will be defined by the sequence's "before" or "after" repeating behavior settings, as controlled by the [setBefore]{@link Concert.Sequence#setBefore} and
				 * [setAfter]{@link Concert.Sequence#setAfter} methods or by the options passed into the [run]{@link Concert.Sequence#run}, [begin]{@link Concert.Sequence#begin},
				 * [follow]{@link Concert.Sequence#follow}, or [syncTo]{@link Concert.Sequence#syncTo} methods. The default behavior, if none has explicitly been specified, is
				 * [Concert.Repeating.None]{@link Concert.Repeating}, which seeks to the sequence start time for any <code>time</code> value less than or equal to the sequence's
				 * start time, and to the end time for any <code>time</code> value greater than or equal to the sequence's end time. The <code>useSoleControlOptimization</code> option,
				 * when set to true, enhances run-time performance, but should only be used if nothing other than the Concert sequence will be modifying any target object properties that are modified
				 * by transformations in the sequence. Essentially it skips updating target object properties any time a newly calculated value is the same as the last one applied, which speeds up
				 * seek times especially when doing relatively slow things such as DOM updates, but which will not work if the target object property's value has been changed by something else
				 * since the last time the sequence object touched it.
				 * @name seek
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {number} time The intended seek point.
				 * @param {boolean} [useSoleControlOptimization] Whether or not the sequence can optimize by assuming sole control over the target objects.
				 */
				function __seek(time, useSoleControlOptimization)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, segmentMatch, segmentNumber, sequenceStart, sequenceEnd,
						adjustedTimeContainer, adjustedTime, frameID, forceApplication,
					    hitFinalBoundary = false, returnVal = null,
					    targetSequences = thisProtected.targetSequences,
					    numTargetSequences = targetSequences.length;

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					sequenceStart = thisPublic.getStartTime();
					sequenceEnd = thisProtected.sequenceEndTime;

					frameID = thisProtected.nextFrameID++;

					if (time < sequenceStart)
					{
						adjustedTimeContainer = thisProtected.before(sequenceStart, sequenceEnd, time);
						adjustedTime = adjustedTimeContainer.adjustedTime;
						hitFinalBoundary = adjustedTimeContainer.hitFinalBoundary;
					}
					else if (time > sequenceEnd)
					{
						adjustedTimeContainer = thisProtected.after(sequenceStart, sequenceEnd, time);
						adjustedTime = adjustedTimeContainer.adjustedTime;
						hitFinalBoundary = adjustedTimeContainer.hitFinalBoundary;
					}
					else
						adjustedTime = time;

					thisProtected.currentTime = adjustedTime;
					thisProtected.unadjustedTime = time;

					segmentMatch = thisProtected.findSequenceSegmentNumberByTime(adjustedTime);
					if (segmentMatch !== null)
					{
						segmentNumber = segmentMatch.segmentNumber;
						if (segmentNumber !== thisProtected.lastSegmentNumber)
						{
							forceApplication = true;
							thisProtected.lastSegmentNumber = segmentNumber;
						}
						else
							forceApplication = (typeof useSoleControlOptimization === "undefined") ? true : !useSoleControlOptimization;
						for (i = 0; i < numTargetSequences; i++)
							targetSequences[i].seek(segmentNumber, adjustedTime, frameID, forceApplication);
						returnVal = segmentMatch.timeMatchType;
					}

					if (hitFinalBoundary && thisProtected.running && thisProtected.autoStopAtEnd)
					{
						thisPublic.stop();
						if (thisProtected.onAutoStop)
							thisProtected.onAutoStop(thisPublic);
					}

					return returnVal;
				} // end __seek()


				/**
				 * Sets the behavior of the sequence when asked to seek after its end time. For instance, it may halt, loop, or bounce.
				 * @name setAfter
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} newAfter One of the functions defined in [Concert.Repeating]{@link Concert.Repeating}, or a custom function.
				 * For any sequence where this is not explicitly set, the "after" behavior defaults to <code>Concert.Repeating.None</code>.
				 * Any function passed in here should have a signature of the form <code>function (sequenceStart, sequenceEnd, unadjustedTime)</code> and must return
				 * an object of the form <code>{ adjustedTime: XXX, hitFinalBoundary: YYY }</code>, where <code>XXX</code> is the actual time to use in the seek, and
				 * <code>YYY</code> is a boolean value indicating whether this seek will put the sequence at one of its final boundary points. For instance, a looping
				 * behavior function could take an <code>unadjustedTime</code> value past the end of the sequence and map it to a resulting value somewhere between the
				 * sequence start and end times, and if it does not loop infinitely, a high enough input would result in hitting the final boundary beyond which looping
				 * does not continue. The <code>hitFinalBoundary</code> property value is what is used to determine whether to automatically call the
				 * [stop]{@link Concert.Sequence#stop} method if running with <code>autoStopAtEnd</code> set to <code>true</code>.
				 */
				function __setAfter(newAfter)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					thisProtected.after = newAfter;
				} // end __setAfter()


				/**
				 * Sets the behavior of the sequence when asked to seek before its start time. For instance, it may halt, loop, or bounce.
				 * @name setBefore
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} newBefore One of the functions defined in [Concert.Repeating]{@link Concert.Repeating}, or a custom function.
				 * For any sequence where this is not explicitly set, the "after" behavior defaults to <code>Concert.Repeating.None</code>.
				 * Any function passed in here should have a signature of the form <code>function (sequenceStart, sequenceEnd, unadjustedTime)</code> and must return
				 * an object of the form <code>{ adjustedTime: XXX, hitFinalBoundary: YYY }</code>, where <code>XXX</code> is the actual time to use in the seek, and
				 * <code>YYY</code> is a boolean value indicating whether this seek will put the sequence at one of its final boundary points. For instance, a looping
				 * behavior function could take an <code>unadjustedTime</code> value past the end of the sequence and map it to a resulting value somewhere between the
				 * sequence start and end times, and if it does not loop infinitely, a high enough input would result in hitting the final boundary beyond which looping
				 * does not continue. The <code>hitFinalBoundary</code> property value is what is used to determine whether to automatically call the
				 * [stop]{@link Concert.Sequence#stop} method if running with <code>autoStopAtEnd</code> set to <code>true</code>.
				 */
				function __setBefore(newBefore)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					thisProtected.before = newBefore;
				} // end __setBefore()


				/**
				 * When adding transformations to a sequence, several properties have default values and can therefore be left unspecified in the objects passed into the
				 * [addTransformations]{@link Concert.Sequence#addTransformations} method. This can be very helpful in avoiding repetition if most or all of the transformations
				 * have the same values for these properties. This method sets those default values for new transformations added to the sequence.
				 * @name setDefaults
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} newDefaults An object with property values setting default options for new transformations. Defined as follows.
				 * Any or all of the below options may be specified.<pre><code>
				 * newDefaults =
				 * {
				 *   // --------
				 *   // Function; One of the [Concert.Applicators]{@link Concert.Applicators} functions, or a custom function.
				 *   // See [Concert.Applicators]{@link Concert.Applicators} and [addTransformations]{@link Concert.Sequence#addTransformations} for more information about the
				 *   // meaning of this property and its allowable values.
				 *   <strong>applicator</strong>: VALUE, // Initial default value: Concert.Applicators.Property
				 *
				 *   // --------
				 *   // Function; One of the [Concert.Calculators]{@link Concert.Calculators} functions, or a custom function.
				 *   // See [Concert.Calculators]{@link Concert.Calculators} and [addTransformations]{@link Concert.Sequence#addTransformations} for more information about the
				 *   // meaning of this property and its allowable values.
				 *   <strong>calculator</strong>: VALUE, // Initial default value: Concert.Calculators.Linear
				 *
				 *   // --------
				 *   // Function; One of the [Concert.EasingFunctions]{@link Concert.EasingFunctions} functions, or a custom function.
				 *   // See [Concert.EasingFunctions]{@link Concert.EasingFunctions} and [addTransformations]{@link Concert.Sequence#addTransformations} for more information about
				 *   // the meaning of this property and its allowable values.
				 *   <strong>easing</strong>: VALUE, // Initial default value: Concert.EasingFunctions.ConstantRate
				 *
				 *   // --------
				 *   // String; The unit, if there is one, is appended to the end of a calculated value
				 *   // before it is applied. Common values would include "px", "%", "em", and so on.
				 *   <strong>unit</strong>: VALUE, // Initial default value: null (no unit at all)
				 * }
				 * </code></pre>
				 */
				function __setDefaults(newDefaults)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var propertyName, defaults = thisProtected.defaults;

					for (propertyName in newDefaults)
					{
						if (newDefaults.hasOwnProperty(propertyName))
							defaults[propertyName] = newDefaults[propertyName];
					}
				} // end __setDefaults()


				/**
				 * Stops a currently running sequence. Calling this function, whether explicitly or by setting <code>autoStopAtEnd</code> to <code>true</code>,
				 * is recommended when you wish the sequence to stop running or synchronizing, because otherwise the timers which continually update the sequence will continue to run.
				 * This may be the desired behavior if the sequence is being synchronized to a value which may continue to change, but in many cases it would be a waste of processor
				 * cycles to continue running a completed sequence. (Note that <code>autoStopAtEnd</code> is automatically enabled if the sequence is run using the
				 * [begin]{@link Concert.Sequence#begin} method.)
				 * @name stop
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 */
				function __stop()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					thisProtected.running = false;
					if (thisProtected.poller)
					{
						thisProtected.poller.stop();
						thisProtected.poller = null;
					}
				} // end __stop()


				/**
				 * Runs a transformation locked to the specified synchronization source and matching its position. This differs from the [follow]{@link Concert.Sequence#follow} method
				 * in that [follow]{@link Concert.Sequence#follow} causes the sequence to run exactly in time with the synchronization source and in the same direction, but starting at the current
				 * timeline position, whereas with <code>syncTo</code> the sequence will first jump to a timeline position matching the current value of the synchronization source and then do the same.
				 * This is really just a shortcut method provided for a common usage scenario; it is exactly the same as calling the [run]{@link Concert.Sequence#run} method with the parameters
				 * <code>{ synchronizeTo: syncSource, initialSeek: null, timeOffset: 0, autoStopAtEnd: false }</code>. Note that these parameter values can still be overridden,
				 * or any of the other parameters accepted by the [run]{@link Concert.Sequence#run} method can be specified in the <code>parameters</code> argument passed into this method.
				 * @name syncTo
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Varies} syncSource A synchronization source. Can take any of the following different types of values:<pre>
				 *   null: locks sequence to the system clock.
				 *   function object: the passed-in function is called every time the polling
				 *       interval is reached, and the return value is used as the seek time.
				 *       Using a custom function here allows you to synchronize the sequence to
				 *       anything you want (for instance, locking it to the current value of a UI
				 *       element, such as a slider, or to another Concert.Sequence object.)
				 *   html audio or video DOM object: locks the sequence to the currentTime property
				 *       of the media element. This allows the sequence to remain synchronized to
				 *       the media even when it is paused, scrubbed, or the user skips around.</pre>
				 * @param {Object} [parameters] An object with property values setting options for how to run the sequence.
				 * See the [run]{@link Concert.Sequence#run} method for information on allowable properties and values in this object.
				 */
				function __syncTo(syncSource, parameters)
				{
					var thisPublic = this.thisPublic; //, thisProtected = _getProtectedMembers.call(thisPublic); // Can save a few bytes in the minified version since thisProtected isn't used in this function

					thisPublic.run(_getCombinedParams({ synchronizeTo: syncSource, initialSeek: null, timeOffset: 0, autoStopAtEnd: false }, parameters));
				} // end __syncTo()

				// ===============================================

				return SequenceConstructor;
			}), // end Sequence definition


		/**
		 * Can be used to avoid namespace collision problems.
		 * Sets the global variable Concert back to what it was before this component assigned a new value to it.
		 * Usage: run the ConcertJS definition script (e.g., include the ConcertJS file via a script element on a web page),
		 * then immediately capture the object assigned to <code>Concert</code> in some other, non-conflicting variable for
		 * actual use, and then call <code>Concert.revertNameSpace()</code> to put back <code>Concert</code> to whatever value it had before.
		 * @public
		 * @method
		 * @memberof Concert
		 */
		revertNameSpace:
			function ()
			{
				Concert = previousNameSpaceValue;
			} // end revertNameSpace()
	}; // end _Concert


	var __Concert_PublicInterface =
		{
			Applicators: _Concert.Applicators,
			Calculators: _Concert.Calculators,
			EasingFunctions: _Concert.EasingFunctions,
			Repeating: _Concert.Repeating,

			Sequence: _Concert.Sequence,

			revertNameSpace: _Concert.revertNameSpace
		};


	return __Concert_PublicInterface;
})(); // end Concert namespace
