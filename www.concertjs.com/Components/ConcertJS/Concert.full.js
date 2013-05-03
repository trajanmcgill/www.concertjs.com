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
		 * @property {function} Bounce(bounceCount) - The <strong>result of calling this function</strong> with a specified number of times to bounce is a function object that can be passed into one of the run methods as the value of <code>before</code> or <code>after</code> and results in the sequence bouncing (that is, alternating directions to play forward and backward) the specified number of times when it reaches that time boundary. A <code>bounceCount</code> value of <code>0</code> is the same as using <code>Concert.Repeating.None</code>, <code>1</code> means add a single extra run-through in the reverse direction, and so on.
		 * @property {function} Loop(loopbackCount) - The <strong>result of calling this function</strong> with a specified number of times to loop is a function object that can be passed into one of the run methods as the value of <code>before</code> or <code>after</code> and results in the sequence looping the specified number of times when it reaches that time boundary. A <code>loopbackCount</code> value of <code>0</code> is the same as using <code>Concert.Repeating.None</code>, <code>1</code> means play through twice (that is, loop back to the beginning 1 time), and so on.
		 * @property {function} None - This function is <strong>passed directly into one of the run methods</strong> as the value of <code>before</code> or <code>after</code> and results in the sequence halting when it reaches that time boundary.
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
						    || propertyName === "t1"
						    || propertyName === "t2"
						    || propertyName === "v1"
						    || propertyName === "v2"
							|| propertyName === "v1Generator"
							|| propertyName === "v2Generator"
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
							unit: null
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
							unit: null
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
					var v1Generator = this.v1Generator, v2Generator = this.v2Generator;

					if (typeof v1Generator === "function")
						this.v1 = v1Generator(sequence);
					if (typeof v2Generator === "function")
						this.v2 = v2Generator(sequence);
				} // end __generateValues()


				function __hasDynamicValues()
				{
					return ((typeof this.v1Generator === "function") || (typeof this.v2Generator === "function"));
				} // end _hasDynamicValues()


				function __retarget(newTarget)
				{
					this.target = newTarget;
					this.lastAppliedValueContainer =
						{
							value: (_Concert.Util.isArray(this.feature) ? new Array(this.feature.length) : null),
							unit: null
						};
				} // end _retarget()


				function __seek(time, frameID, seekFeature, forceApplication)
				{
					var newValue =
						(frameID === this.lastFrameID)
						? this.lastCalculatedValue
						: this.calculator(this.easing(this.t1, this.t2, time), this.v1, this.v2, this.additionalProperties);

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
							var aStartTime = a.t1;
							var bStartTime = b.t1;
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
						nextTransformationStartTime = nextTransformation.t1;
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
								nextTransformationStartTime = nextTransformation.t1;
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
										outputData[curBreakpointIndex++] = curTransformation.t1;
										outputData[curBreakpointIndex++] = curTransformation.t2;
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
				 * Adds a set of transformations (i.e., changes applied to objects over time) to the sequence.
				 * @name addTransformations
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} transformationSet ADDCODE
				 */
				function __addTransformations(transformationSet)
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					var i, j, k, numTransformationGroups, curTransformationGroup, curGroupTarget, curGroupTargets, numCurGroupTargets, singleTargetVersion,
						curGroupFeatures, curGroupUnit, curGroupCalculator, curGroupEasing, curGroupApplicator, curGroupKeyFrames, curGroupSegments,
						numSegments, curSegment, propertyName, newTransformationProperties, newTransformation, singleFeatureSequence, curFeatureSequences = [],
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
											t1: lastKeyFrameTime,
											t2: curKeyFrameTime,
											v1: lastKeyFrameValue,
											v2: curKeyFrameValue,
											v1Generator: lastKeyFrameValueGenerator,
											v2Generator: curKeyFrameValueGenerator
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
								if ((typeof newTransformationProperties.v1Generator !== "undefined") || (typeof newTransformationProperties.v2Generator !== "undefined"))
									dynamicValueTransformations.push(newTransformation);
								for (k = 0; k < curFeatureSequences.length; k++)
									curFeatureSequences[k].transformations.push(newTransformation);
							} // end loop through segments
						} // end if/else on (typeof curGroupKeyFrames != "undefined")
					} // end for loop iterating through transformation groups
				} // end __addTransformations()


				/**
				 * ADDCODE
				 * @name begin
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} parameters ADDCODE
				 */
				function __begin(parameters)
				{
					var thisPublic = this.thisPublic; //, thisProtected = _getProtectedMembers.call(thisPublic); // Can save a few bytes in the minified version since thisProtected isn't used in this function

					thisPublic.run(_getCombinedParams({ synchronizeTo: null, initialSeek: 0, timeOffset: null, autoStopAtEnd: true }, parameters));
				} // end __begin()


				/**
				 * Creates a duplicate of a sequence, allowing a sequence to be defined once and cloned to apply to any number of different sets of target objects.
				 * For example, the same series of animated motions might be applied to numerous on-screen elements.
				 * Since each sequence may contain transformations targeting numerous different objects, this is accomplished by passing in a function that,
				 * when passed a transformation target object, returns the corresponding object to be targeted in the new sequence.
				 * (Note that one useful way of doing this easily is to set the targets of the original sequence to be uniquely identifying strings or integers instead of actual objects. The original sequence then just becomes essentially a dummy sequence with placeholder targets that your lookup function can easily identify and substitute for.)
				 * This method is capable of duplicating nearly every aspect of the original sequence, including jumping to the same current point in time and even
				 * cloning its running or non-running status if desired. (To change the target objects of a sequence without creating a new one, see the [retarget]{@link Concert.Sequence#retarget} method.)
				 * @name clone
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} targetLookupFunction A function taking a single parameter which will be an object used as a target in a transformation of the original sequence. The function must return the equivalent object which should be targeted by that same transformation in the new sequence.
				 * @param {boolean} [matchRunningStatus=false] If <code>true</code>, and the sequence being cloned is currently running, the new sequence will jump to the same point on the timeline and run as well. Otherwise, the new sequence will not automatically start running.
				 * @param {boolean} [doInitialSeek=false] If <code>true</code>, the new sequence will immediately seek to the same point on the timeline as the original sequence. Otherwise, the new sequence will merely be created, but will not immediately perform any action (unless the matchRunningStatus parameter is <code>true</code>).
				 * @returns {Object} A new [Sequence]{@link Concert.Sequence} object, with the same properties and duplicates of all the same transformations that were in the original sequence, but with new target objects of those transformations substituted in as controlled by the <code>targetLookupFunction</code> parameter.
				 * @example <caption>One possible method of using this function easily for replicating a sequence definition onto any number of targets is shown below. The initial sequence here is defined with two transformations that are given strings ("UpperElement" and "LowerElement") as targets. The initial sequence is thus just a dummy from which we can clone easily and repeatedly, and the strings make helpful placeholders for the function passed into the clone method to use for matching up to real DOM elements or other intended target objects which we may have created dynamically at a later time. Note further that if you index a sequence before cloning it, the cloned sequences will already be indexed and can be run instantly without any indexing lag.</caption>
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
				 *     { target: "UpperElement", feature: "left", keyframes: { times: [0, 1000], values: [100, 200] } },
				 *     { target: "LowerElement", feature: "left", keyframes: { times: [0, 1000], values: [100, 200] } }
				 *   ]);
				 * 
				 * var newSequence1 = originalSequence.clone(
				 *     function (originalTarget)
				 *     { return document.getElementById(originalTarget + "1"); });
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
				 * ADDCODE
				 * @name follow
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} syncSource ADDCODE
				 * @param {Object} parameters ADDCODE
				 */
				function __follow(syncSource, parameters)
				{
					var thisPublic = this.thisPublic; //, thisProtected = _getProtectedMembers.call(thisPublic); // Can save a few bytes in the minified version since thisProtected isn't used in this function

					thisPublic.run(_getCombinedParams({ synchronizeTo: syncSource, initialSeek: null, timeOffset: null }, parameters));
				} // end __follow()


				/**
				 * ADDCODE
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
				 * ADDCODE
				 * @name getCurrentTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} ADDCODE
				 */
				function __getCurrentTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.currentTime;
				} // end _getCurrentTime()


				/**
				 * ADDCODE
				 * @name getEndTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} ADDCODE
				 */
				function __getEndTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					return thisProtected.sequenceEndTime;
				} // end __getEndTime()


				/**
				 * ADDCODE
				 * @name getID
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} ADDCODE
				 */
				function __getID()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.ID;
				} // end __getID()


				/**
				 * ADDCODE
				 * @name getStartTime
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {number} ADDCODE
				 */
				function __getStartTime()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					if (!(thisProtected.indexed))
						thisPublic.index(null, false);

					return thisProtected.sequenceStartTime;
				} // end __getStartTime()


				/**
				 * ADDCODE
				 * @name index
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {requestCallback} completionCallback ADDCODE
				 * @param {boolean} isAsynchronous ADDCODE
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
				 * ADDCODE
				 * @name isRunning
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @returns {boolean} ADDCODE
				 */
				function __isRunning()
				{
					var thisPublic = this.thisPublic, thisProtected = _getProtectedMembers.call(thisPublic);

					return thisProtected.running;
				} // end __isRunning()


				/**
				 * ADDCODE
				 * @name retarget
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} targetLookupFunction ADDCODE
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
				 * ADDCODE
				 * @name run
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} parameters ADDCODE
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
						timeOffset = (thisProtected.unadjustedTime !== null) ? (thisProtected.unadjustedTime - initialSyncSourcePoint) : (thisProtected.sequenceStartTime - initialSyncSourcePoint);
					thisProtected.timeOffset = timeOffset;

					thisProtected.running = true;
					thisProtected.poller.run(function () { thisPublic.seek(initialSyncSourcePoint + speed * (synchronizer() - initialSyncSourcePoint) + timeOffset, soleControlOptimizationDuringRun); });
				} // end __run()


				/**
				 * ADDCODE
				 * @name seek
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {number} time ADDCODE
				 * @param {boolean} [useSoleControlOptimization] ADDCODE
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

					sequenceStart = thisProtected.sequenceStartTime;
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
				 * ADDCODE
				 * @name setDefaults
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {Object} newDefaults ADDCODE
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
				 * ADDCODE
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
				 * ADDCODE
				 * @name syncTo
				 * @memberof Concert.Sequence#
				 * @public
				 * @method
				 * @param {function} syncSource ADDCODE
				 * @param {Object} parameters ADDCODE
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
