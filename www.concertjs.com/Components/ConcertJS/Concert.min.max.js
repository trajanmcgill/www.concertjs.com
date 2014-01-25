var Concert = function() {
    "use strict";
    var a = Concert, b = function() {
        function a() {
            var a = this;
            a.thisPublic = this;
            var b = {
                thisPublic: a
            };
            a.___accessProtectedMembers = function() {
                d = b;
            };
        }
        function b() {
            return this.___accessProtectedMembers(), d;
        }
        function c() {}
        var d;
        return a.extend = function(a) {
            var d = a(b, this);
            return c.prototype = this.prototype, d.prototype = new c(), d.prototype.constructor = d, 
            d.extend = this.extend, d;
        }, a;
    }(), c = {
        nextSequenceID: 0,
        Definitions: {
            FallbackAutoPollerInterval: 16,
            IterationRoundTimeHalfBound: 50,
            StartingIterationsPerAsynchProcessingRound: {
                buildBreakPointList: 1,
                consolidateDistinctValues: 1,
                buildSortedArray: 1,
                buildDistinctSegmentList: 1,
                indexTargetSequences: 1
            }
        },
        Util: {
            arraysShallowlyEqual: function(a, b) {
                var c, d = a.length;
                if (b.length !== d) return !1;
                for (c = 0; d > c; c++) if (a[c] !== b[c]) return !1;
                return !0;
            },
            isArray: function(a) {
                return "object" == typeof a && "[object Array]" === Object.prototype.toString.call(a);
            },
            loadObjectData: function(a, b, c, d) {
                var e;
                for (e in a) a.hasOwnProperty(e) && (c[e] = a[e]);
                for (e in b) b.hasOwnProperty(e) && (d[e] = b[e]);
            },
            round: function(a, b) {
                return b * Math.round(a / b);
            }
        },
        Applicators: {
            Property: function(a, b, c) {
                a[b] = c;
            },
            Style: function(a, b, c, d) {
                a.style[b] = null === d ? c : c.toString() + d;
            },
            SVG_ElementAttribute: function(a, b, c, d) {
                a.setAttribute(b, null === d ? c : c.toString() + d);
            }
        },
        Calculators: {
            Color: function(a, b, d) {
                function e(a) {
                    return 1 === a.length && (a += a), parseInt(a, 16);
                }
                function f(a, b, d) {
                    var f, g, h, i, j, k, l, m, n, o = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$|^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i, p = /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$|^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/i, q = /^#([0-9a-f])([0-9a-f])([0-9a-f])$|^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, r = !1, s = !1;
                    if (null !== (f = o.exec(a)) ? (g = o.exec(b), r = !0) : null !== (f = p.exec(a)) && (g = p.exec(b), 
                    s = !0), r || s) {
                        for (h = [], i = 1; 8 > i; i++) j = f[i], "undefined" != typeof j && (j = parseInt(j, 10), 
                        k = j + d * (parseInt(g[i], 10) - j), h.push(7 > i ? c.Util.round(k, 1) : k));
                        r ? l = "rgb" + (4 === h.length ? "a" : "") + "(" + h.join() + ")" : (k = h[0].toString() + "," + h[1].toString() + "%," + h[2].toString() + "%", 
                        l = 4 === h.length ? "hsla(" + k + "," + h[3].toString() + ")" : "hsl(" + k + ")");
                    } else {
                        for (f = q.exec(a), g = q.exec(b), m = [], n = [], i = 1; 7 > i; i++) k = f[i], 
                        "undefined" != typeof k && m.push(k), k = g[i], "undefined" != typeof k && n.push(k);
                        for (l = "#", i = 0; 3 > i; i++) j = e(m[i]), k = c.Util.round(j + d * (e(n[i]) - j), 1), 
                        l += (16 > k ? "0" : "") + k.toString(16);
                    }
                    return l;
                }
                var g, h, i;
                if (c.Util.isArray(b)) for (i = [], g = 0, h = b.length; h > g; g++) i.push(f(b[g], d[g], a)); else i = f(b, d, a);
                return i;
            },
            Discrete: function(a, b, d, e) {
                var f, g, h, i, j, k = "undefined" != typeof e.round;
                if (k && (j = e.round), c.Util.isArray(b)) for (h = [], f = 0, i = b.length; i > f; f++) g = 1 > a ? b[f] : d[f], 
                h.push(k ? c.Util.round(g, j) : g); else g = 1 > a ? b : d, h = k ? c.Util.round(g, j) : g;
                return h;
            },
            Linear: function(a, b, d, e) {
                var f, g, h, i, j, k, l = "undefined" != typeof e.round;
                if (l && (k = e.round), c.Util.isArray(b)) for (j = [], f = 0, g = b.length; g > f; f++) h = b[f], 
                i = h + a * (d[f] - h), j.push(l ? c.Util.round(i, k) : i); else i = b + a * (d - b), 
                j = l ? c.Util.round(i, k) : i;
                return j;
            },
            Rotational: function(a, b, d, e) {
                var f, g = "undefined" != typeof e.round;
                g && (f = e.round);
                var h = e.center[0], i = e.center[1], j = e.offset[0], k = e.offset[1], l = b[0], m = d[0], n = b[1], o = d[1], p = l + a * (m - l), q = n + a * (o - n), r = h + p * Math.cos(q) + j, s = i + p * Math.sin(q) + k;
                return g && (r = c.Util.round(r, f), s = c.Util.round(s, f)), [ r, s ];
            }
        },
        EasingFunctions: {
            ConstantRate: function(a, b, c) {
                return c >= b ? 1 : a > c ? 0 : (c - a) / (b - a);
            },
            QuadIn: function(a, b, c) {
                return c >= b ? 1 : a > c ? 0 : Math.pow((c - a) / (b - a), 2);
            },
            QuadInOut: function(a, b, c) {
                var d;
                return c >= b ? 1 : a > c ? 0 : (d = (a + b) / 2, d > c ? Math.pow((c - a) / (d - a), 2) / 2 : .5 + (1 - Math.pow(1 - (c - d) / (b - d), 2)) / 2);
            },
            QuadOut: function(a, b, c) {
                return c >= b ? 1 : a > c ? 0 : 1 - Math.pow(1 - (c - a) / (b - a), 2);
            },
            Smoothstep: function(a, b, c) {
                var d;
                return c >= b ? 1 : a > c ? 0 : (d = (c - a) / (b - a), d * d * (3 - 2 * d));
            }
        },
        Repeating: {
            Bounce: function(a) {
                function b(b, d, e) {
                    var f, g, h, i = d - b;
                    return b > e ? (f = b - e, g = Math.floor(f / i) + 1, c || a >= g ? (h = f % i, 
                    {
                        adjustedTime: g % 2 === 0 ? d - h : h,
                        hitFinalBoundary: !1
                    }) : {
                        adjustedTime: a % 2 === 0 ? b : d,
                        hitFinalBoundary: !0
                    }) : (f = e - d, g = Math.floor(f / i) + 1, c || a >= g ? (h = f % i, {
                        adjustedTime: g % 2 === 0 ? h : d - h,
                        hitFinalBoundary: !1
                    }) : {
                        adjustedTime: a % 2 === 0 ? d : b,
                        hitFinalBoundary: !0
                    });
                }
                var c = "undefined" == typeof a || null === a;
                return b;
            },
            Loop: function(a) {
                function b(b, d, e) {
                    var f, g = d - b;
                    return b > e ? (f = b - e, c || a >= f / g ? {
                        adjustedTime: d - f % g,
                        hitFinalBoundary: !1
                    } : {
                        adjustedTime: b,
                        hitFinalBoundary: !0
                    }) : (f = e - d, c || a >= f / g ? {
                        adjustedTime: b + f % g,
                        hitFinalBoundary: !1
                    } : {
                        adjustedTime: d,
                        hitFinalBoundary: !0
                    });
                }
                var c = "undefined" == typeof a || null === a;
                return b;
            },
            None: function(a, b, c) {
                return a > c ? {
                    adjustedTime: a,
                    hitFinalBoundary: !0
                } : {
                    adjustedTime: b,
                    hitFinalBoundary: !0
                };
            }
        },
        Pollers: {
            Auto: b.extend(function(a, b) {
                function d() {
                    if (!window.cancelAnimationFrame) return new c.Pollers.FixedInterval(c.Definitions.FallbackAutoPollerInterval);
                    b.call(this);
                    var d = this.thisPublic, g = a.call(d);
                    g.frameRequestID = null, d.run = e, d.stop = f;
                }
                function e(b) {
                    var c, d = this.thisPublic, e = a.call(d);
                    null === e.frameRequestID && (c = function() {
                        e.frameRequestID = window.requestAnimationFrame(c), b();
                    })();
                }
                function f() {
                    var b = this.thisPublic, c = a.call(b);
                    null !== c.frameRequestID && (window.cancelAnimationFrame(c.frameRequestID), c.frameRequestID = null);
                }
                return d;
            }),
            FixedInterval: b.extend(function(a, b) {
                function c(c) {
                    b.call(this);
                    var f = this.thisPublic, g = a.call(f);
                    g.interval = c, g.intervalID = null, f.run = d, f.stop = e;
                }
                function d(b) {
                    var c = this.thisPublic, d = a.call(c);
                    null === d.intervalID && (d.intervalID = setInterval(b, d.interval));
                }
                function e() {
                    var b = this.thisPublic, c = a.call(b);
                    null !== c.intervalID && (clearInterval(c.intervalID), c.intervalID = null);
                }
                return c;
            })
        },
        Transformation: function() {
            function a(a) {
                var b;
                this.transformationID = i++, this.additionalProperties = {};
                for (b in a) "target" === b || "feature" === b || "applicator" === b || "calculator" === b || "t0" === b || "t1" === b || "v0" === b || "v1" === b || "v0Generator" === b || "v1Generator" === b || "unit" === b || "easing" === b ? this[b] = a[b] : a.hasOwnProperty(b) && (this.additionalProperties[b] = a[b]);
                this.lastFrameID = null, this.lastCalculatedValue = null, this.lastAppliedValueContainer = {
                    value: c.Util.isArray(this.feature) ? new Array(this.feature.length) : null,
                    unit: c.Util.isArray(this.unit) ? new Array(this.unit.length) : null
                }, this.clone = d, this.generateValues = e, this.hasDynamicValues = f, this.retarget = g, 
                this.seek = h;
            }
            function b(a, b, d, e, f, g, h) {
                var i, j, k, l, m, n, o, p, q, r, s;
                if (j = f.value, k = f.unit, l = g.value, m = g.unit, n = h || null === l, c.Util.isArray(d)) {
                    for (q = c.Util.isArray(k), i = 0, o = d.length; o > i; i++) if (p = d[i], p === e) {
                        r = j[i], s = q ? k[i] : k, (n || r !== l[i] || s !== (q ? m[i] : m)) && (a(b, p, r, s), 
                        l[i] = r, q ? m[i] = s : g.unit = s);
                        break;
                    }
                } else (n || j !== l || k !== m) && (a(b, d, j, k), g.value = j, g.unit = k);
            }
            function d(a) {
                var b, d, e, f = this.additionalProperties, g = {
                    transformationID: !0,
                    additionalProperties: !0,
                    target: !0,
                    lastAppliedValueContainer: !0,
                    lastFrameID: !0,
                    lastCalculatedValue: !0,
                    clone: !0,
                    generateValues: !0,
                    hasDynamicValues: !0,
                    retarget: !0,
                    seek: !0
                };
                b = new c.Transformation();
                for (d in this) this.hasOwnProperty(d) && !g[d] && (b[d] = this[d]);
                b.target = a, b.lastAppliedValueContainer = {
                    value: c.Util.isArray(this.feature) ? new Array(this.feature.length) : null,
                    unit: c.Util.isArray(this.unit) ? new Array(this.unit.length) : null
                }, b.lastFrameID = null, b.lastCalculatedValue = null, e = b.additionalProperties;
                for (d in f) f.hasOwnProperty(d) && (e[d] = f[d]);
                return b;
            }
            function e(a) {
                var b = this.v0Generator, c = this.v1Generator;
                "function" == typeof b && (this.v0 = b(a)), "function" == typeof c && (this.v1 = c(a));
            }
            function f() {
                return "function" == typeof this.v0Generator || "function" == typeof this.v1Generator;
            }
            function g(a) {
                this.target = a, this.lastAppliedValueContainer = {
                    value: c.Util.isArray(this.feature) ? new Array(this.feature.length) : null,
                    unit: c.Util.isArray(this.unit) ? new Array(this.unit.length) : null
                };
            }
            function h(a, c, d, e) {
                var f = c === this.lastFrameID ? this.lastCalculatedValue : this.calculator(this.easing(this.t0, this.t1, a), this.v0, this.v1, this.additionalProperties);
                b(this.applicator, this.target, this.feature, d, {
                    value: f,
                    unit: this.unit
                }, this.lastAppliedValueContainer, e);
            }
            var i = 0;
            return a;
        }(),
        FeatureSequence: function() {
            function a(a, c) {
                this.target = a, this.feature = c, this.transformations = [], this.transformationIndexBySegment = null, 
                this.clone = b, this.indexTransformations = d, this.retarget = e, this.seek = f;
            }
            function b(a) {
                var b, d, e, f, g = this.transformations, h = g.length, i = new Array(h), j = this.transformationIndexBySegment, k = null, l = new c.FeatureSequence(a, this.feature), m = {
                    featureSequence: l,
                    transformations: i
                };
                for (b = 0; h > b; b++) i[b] = g[b].clone(a);
                if (l.transformations = i, j) for (e = j.length, k = new Array(e), b = 0; e > b; b++) for (f = j[b], 
                d = 0; h > d; d++) if (f === g[d]) {
                    k[b] = i[d];
                    break;
                }
                return l.transformationIndexBySegment = k, m;
            }
            function d(a) {
                var b, c, d, e, f, g, h, i, j = this.transformations, k = j.length - 1, l = a.length;
                if (!(0 > k)) for (j.sort(function(a, b) {
                    var c = a.t0, d = b.t0;
                    return c === d ? 0 : d > c ? -1 : 1;
                }), d = this.transformationIndexBySegment = new Array(l), e = 0, i = a[0].startTime, 
                b = 0, f = j[0], k > 0 ? (g = j[1], h = g.t0, c = !0) : c = !1; l > e; ) if (c && i >= h) b++, 
                f = g, k > b ? (g = j[b + 1], h = g.t0) : c = !1; else {
                    if (d[e] = f, e++, !(l > e)) break;
                    i = a[e].startTime;
                }
            }
            function e(a) {
                var b, c = this.transformations, d = c.length;
                for (b = 0; d > b; b++) c[b].retarget(a);
                this.target = a;
            }
            function f(a, b, c, d) {
                return this.transformationIndexBySegment[a].seek(b, c, this.feature, d);
            }
            return a;
        }(),
        TargetSequence: b.extend(function(a, b) {
            function d(c) {
                b.call(this);
                var d = this.thisPublic, l = a.call(d);
                l.target = c, l.featureSequences = [], d.addFeatureSequence = e, d.clone = f, d.findFeatureSequenceByFeature = g, 
                d.getTarget = h, d.indexTransformations = i, d.retarget = j, d.seek = k;
            }
            function e(b) {
                var c = this.thisPublic, d = a.call(c);
                d.featureSequences.push(b);
            }
            function f(b) {
                var d, e, f = this.thisPublic, g = a.call(f), h = [], i = g.featureSequences, j = i.length, k = new c.TargetSequence(b), l = {
                    targetSequence: k,
                    transformations: h
                };
                for (d = 0; j > d; d++) e = i[d].clone(b), k.addFeatureSequence(e.featureSequence), 
                h.push.apply(h, e.transformations);
                return l;
            }
            function g(b) {
                var c, d, e = this.thisPublic, f = a.call(e), g = f.featureSequences, h = g.length;
                for (c = 0; h > c; c++) if (d = g[c], d.feature === b) return d;
                return null;
            }
            function h() {
                var b = this.thisPublic, c = a.call(b);
                return c.target;
            }
            function i(b) {
                var c, d, e = this.thisPublic, f = a.call(e), g = f.featureSequences;
                for (c = 0, d = g.length; d > c; c++) g[c].indexTransformations(b);
            }
            function j(b) {
                var c, d = this.thisPublic, e = a.call(d), f = e.featureSequences, g = f.length;
                for (c = 0; g > c; c++) f[c].retarget(b);
                e.target = b;
            }
            function k(b, c, d, e) {
                var f, g, h = this.thisPublic, i = a.call(h), j = i.featureSequences;
                for (g = 0, f = j.length; f > g; g++) j[g].seek(b, c, d, e);
            }
            return d;
        }),
        TimelineSegment: function(a, b) {
            this.startTime = a, this.endTime = b;
        },
        Sequence: b.extend(function(a, b) {
            function d(d) {
                b.call(this);
                var e = this.thisPublic, f = a.call(e);
                f.ID = c.nextSequenceID, c.nextSequenceID++, f.nextFrameID = 0, f.targetSequences = [], 
                f.timelineSegments = [], f.lastUsedTimelineSegmentNumber = 0, f.allTransformations = [], 
                f.dynamicValueTransformations = [], f.indexCompletionCallbacks = [], f.indexed = !1, 
                f.indexingInProgress = !1, f.indexTimerID = null, f.indexingProcessData = {}, f.running = !1, 
                f.currentTime = null, f.unadjustedTime = null, f.sequenceStartTime = null, f.sequenceEndTime = null, 
                f.poller = null, f.synchronizer = null, f.initialSyncSourcePoint = null, f.lastSegmentNumber = null, 
                f.defaults = {
                    unit: null,
                    applicator: Concert.Applicators.Property,
                    easing: Concert.EasingFunctions.ConstantRate,
                    calculator: Concert.Calculators.Linear
                }, f.synchronizeTo = null, f.speed = 1, f.timeOffset = 0, f.pollingInterval = 0, 
                f.after = c.Repeating.None, f.before = c.Repeating.None, f.autoStopAtEnd = !0, f.onAutoStop = null, 
                f.stretchStartTimeToZero = !0, f.soleControlOptimizationDuringRun = !0, f.advanceIndexingToNextStep = i, 
                f.findSequenceSegmentNumberByTime = j, f.findSequenceSegmentNumberInRange = k, f.findTargetSequenceByTarget = l, 
                f.resetIndexing = m, f.runIndexing = n, e.addTransformations = o, e.begin = p, e.clone = q, 
                e.follow = r, e.generateValues = s, e.getCurrentTime = t, e.getEndTime = u, e.getID = v, 
                e.getStartTime = w, e.index = x, e.isRunning = y, e.retarget = z, e.run = A, e.seek = B, 
                e.setAfter = C, e.setBefore = D, e.setDefaults = E, e.stop = F, e.syncTo = G, d && e.addTransformations(d);
            }
            function e(a, b) {
                var c, d = {};
                if (a) for (c in a) a.hasOwnProperty(c) && (d[c] = a[c]);
                if (b) for (c in b) b.hasOwnProperty(c) && (d[c] = b[c]);
                return d;
            }
            function f(a, b, c) {
                return a && "undefined" != typeof a[b] ? a[b] : c;
            }
            function g(b, d) {
                var e = this.thisPublic, f = a.call(e);
                c.Util.loadObjectData(b, d, e, f);
            }
            function h(a, b) {
                var c, d = 0, e = b.length - 1;
                if (0 > e || a > b[e]) b.push(a); else if (a < b[0]) b.unshift(a); else {
                    for (;e > d + 1; ) c = Math.floor((d + e) / 2), a < b[c] ? e = c : d = c;
                    b.splice(e, 0, a);
                }
            }
            function i() {
                var b, d, e, f, g = this.thisPublic, h = a.call(g), i = h.indexingProcessData, j = !1;
                switch (i.step++, i.startingIndex = 0, i.step) {
                  case 1:
                    i.inputData = i.outputData, i.iterationsPerRound = c.Definitions.StartingIterationsPerAsynchProcessingRound.consolidateDistinctValues, 
                    i.totalIterationsThisStep = i.inputData.length, i.outputData = {};
                    break;

                  case 2:
                    if (i.iterationsPerRound = c.Definitions.StartingIterationsPerAsynchProcessingRound.buildSortedArray, 
                    i.isAsynchronous) {
                        b = i.outputData, e = [];
                        for (d in b) b.hasOwnProperty(d) && e.push(b[d]);
                        i.inputData = e, i.totalIterationsThisStep = e.length;
                    } else i.inputData = i.outputData, i.totalIterationsThisStep = 1;
                    i.outputData = [];
                    break;

                  case 3:
                    i.inputData = i.outputData, i.iterationsPerRound = c.Definitions.StartingIterationsPerAsynchProcessingRound.buildDistinctSegmentList, 
                    i.totalIterationsThisStep = i.inputData.length - 1, i.outputData = new Array(i.totalIterationsThisStep);
                    break;

                  case 4:
                    i.inputData = i.outputData, i.iterationsPerRound = c.Definitions.StartingIterationsPerAsynchProcessingRound.indexTargetSequences, 
                    i.totalIterationsThisStep = h.targetSequences.length, i.outputData = null;
                    break;

                  case 5:
                    for (j = !0, h.timelineSegments = f = i.inputData, h.sequenceStartTime = !f || f.length < 1 ? null : f[0].startTime, 
                    h.sequenceEndTime = !f || f.length < 1 ? null : f[f.length - 1].endTime, h.indexed = !0, 
                    h.indexingInProgress = !1, i.inputData = null, i.iterationsPerRound = 1, i.totalIterationsThisStep = 0, 
                    i.outputData = null; h.indexCompletionCallbacks.length; ) h.indexCompletionCallbacks.shift()(g);
                }
                return j;
            }
            function j(b) {
                var c, d, e, f, g = this.thisPublic, h = a.call(g), i = h.timelineSegments, j = i.length;
                return j > 0 ? (d = h.lastUsedTimelineSegmentNumber, e = i[d], f = e.endTime, b >= e.startTime ? f > b ? c = {
                    segmentNumber: d,
                    timeMatchType: 0
                } : d === j - 1 ? c = {
                    segmentNumber: d,
                    timeMatchType: 1
                } : (d++, e = i[d], f = e.endTime, c = f > b ? {
                    segmentNumber: d,
                    timeMatchType: 0
                } : d === j - 1 ? {
                    segmentNumber: d,
                    timeMatchType: 1
                } : h.findSequenceSegmentNumberInRange(b, d + 1, j - 1)) : c = 0 === d ? {
                    segmentNumber: 0,
                    timeMatchType: -1
                } : h.findSequenceSegmentNumberInRange(b, 0, d - 1), h.lastUsedTimelineSegmentNumber = c.segmentNumber) : c = null, 
                c;
            }
            function k(b, c, d) {
                var e, f, g, h = this.thisPublic, i = a.call(h);
                do if (e = Math.floor((c + d) / 2), f = i.timelineSegments[e], b < f.startTime) d = e - 1, 
                g = -1; else {
                    if (!(b >= f.endTime)) {
                        g = 0;
                        break;
                    }
                    c = e + 1, g = 1;
                } while (d > c);
                return {
                    segmentNumber: e,
                    timeMatchType: g
                };
            }
            function l(b) {
                var c, d = this.thisPublic, e = a.call(d), f = e.targetSequences, g = f.length;
                for (c = 0; g > c; c++) if (f[c].getTarget() === b) return f[c];
                return null;
            }
            function m() {
                var b = this.thisPublic, d = a.call(b), e = d.indexingProcessData;
                e.step = 0, e.startingIndex = 0, e.iterationsPerRound = c.Definitions.StartingIterationsPerAsynchProcessingRound.buildBreakPointList, 
                e.inputData = d.allTransformations, e.totalIterationsThisStep = d.allTransformations.length, 
                e.outputData = new Array(2 * e.totalIterationsThisStep);
            }
            function n() {
                function b() {
                    var a, d, e, i, j, k, l, m = g.step, n = g.isAsynchronous, o = g.inputData, p = g.startingIndex, q = g.totalIterationsThisStep, r = n ? g.iterationsPerRound : q, s = Math.min(q, p + r), t = g.outputData, u = !1, v = 0 === m ? 2 * p : null;
                    if (n && (a = new Date().getTime()), 2 !== m || n || c.Util.isArray(o)) for (3 === m ? i = o[p] : 4 === m && (l = f.targetSequences); s > p; ) {
                        switch (m) {
                          case 0:
                            e = o[p], t[v++] = e.t0, t[v++] = e.t1;
                            break;

                          case 1:
                            i = o[p], t[i] = i;
                            break;

                          case 2:
                            h(o[p], t);
                            break;

                          case 3:
                            k = o[p + 1], t[p] = new c.TimelineSegment(i, k), i = k;
                            break;

                          case 4:
                            l[p].indexTransformations(o);
                        }
                        p++;
                    } else for (j in o) o.hasOwnProperty(j) && h(o[j], t);
                    return s === q ? u = f.advanceIndexingToNextStep() : (d = new Date().getTime(), 
                    g.startingIndex = p, d - a < c.Definitions.IterationRoundTimeHalfBound && (g.iterationsPerRound *= 2)), 
                    n && !u && (f.indexTimerID = window.setTimeout(b, 0)), u;
                }
                var d, e = this.thisPublic, f = a.call(e), g = f.indexingProcessData;
                if (g.isAsynchronous) f.indexingInProgress = !0, f.indexTimerID = window.setTimeout(b, 0); else for (null !== f.indexTimerID && (window.clearTimeout(f.indexTimerID), 
                f.indexTimerID = null); !d; ) d = b();
            }
            function o(b) {
                var d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L = this.thisPublic, M = a.call(L), N = M.targetSequences, O = null, P = M.defaults, Q = M.allTransformations, R = M.dynamicValueTransformations;
                for (M.indexingInProgress ? M.resetIndexing() : M.indexed = !1, c.Util.isArray(b) || (b = [ b ]), 
                d = 0, g = b.length; g > d; d++) if (h = b[d], i = h.target, j = h.targets, c.Util.isArray(j)) for ("undefined" != typeof i && null !== i && (j = [ i ].concat(j)), 
                e = 0, k = j.length; k > e; e++) {
                    l = {};
                    for (v in h) h.hasOwnProperty(v) && (l[v] = h[v]);
                    l.targets = null, l.target = j[e], L.addTransformations(l);
                } else {
                    for (O = M.findTargetSequenceByTarget(i), null === O && (O = new c.TargetSequence(i), 
                    N.push(O)), m = c.Util.isArray(h.feature) ? h.feature : [ h.feature ], q = h.applicator, 
                    "undefined" == typeof q && (q = P.applicator), n = h.unit, "undefined" == typeof n && (n = P.unit), 
                    o = h.calculator, "undefined" == typeof o && (o = P.calculator), p = h.easing, "undefined" == typeof p && (p = P.easing), 
                    z = new Array(m.length), e = 0; e < m.length; e++) y = O.findFeatureSequenceByFeature(m[e]), 
                    null === y && (y = new c.FeatureSequence(i, m[e]), O.addFeatureSequence(y)), z[e] = y;
                    if (r = h.keyframes, "undefined" != typeof r) {
                        for (B = r.times, C = r.values, D = r.valueGenerators, H = I = J = F = G = null, 
                        e = 0, A = B.length; A > e; e++) if (E = B[e], C && (F = C[e]), D && (G = D[e]), 
                        null === H ? (H = E, I = F, J = G, K = null !== E && e === A - 1) : null === E ? (H = I = J = null, 
                        K = !1) : K = !0, K) {
                            for (w = {
                                target: i,
                                feature: 1 === m.length ? m[0] : m,
                                applicator: q,
                                unit: n,
                                calculator: o,
                                easing: p,
                                t0: H,
                                t1: E,
                                v0: I,
                                v1: F,
                                v0Generator: J,
                                v1Generator: G
                            }, x = new c.Transformation(w), Q.push(x), (J || G) && R.push(x), f = 0; f < z.length; f++) z[f].transformations.push(x);
                            H = E, I = F;
                        }
                    } else for (s = h.segments, c.Util.isArray(s) || (s = [ s ]), e = 0, t = s.length; t > e; e++) {
                        u = s[e], w = {
                            target: i,
                            feature: 1 === m.length ? m[0] : m,
                            applicator: q
                        };
                        for (v in u) u.hasOwnProperty(v) && (w[v] = u[v]);
                        for ("undefined" == typeof w.unit && (w.unit = n), "undefined" == typeof w.calculator && (w.calculator = o), 
                        "undefined" == typeof w.easing && (w.easing = p), x = new c.Transformation(w), Q.push(x), 
                        ("undefined" != typeof w.v0Generator || "undefined" != typeof w.v1Generator) && R.push(x), 
                        f = 0; f < z.length; f++) z[f].transformations.push(x);
                    }
                }
            }
            function p(a) {
                var b = this.thisPublic;
                b.run(e({
                    synchronizeTo: null,
                    initialSeek: 0,
                    timeOffset: null,
                    autoStopAtEnd: !0
                }, a));
            }
            function q(b, d, e) {
                var f, h, i, j, k, l, m, n, o, p, q, r = this.thisPublic, s = a.call(r), t = d && s.running, u = s.currentTime, v = s.synchronizer, w = s.speed, x = s.timeOffset, y = s.pollingInterval, z = s.initialSyncSourcePoint, A = s.allTransformations.length, B = 0, C = 0, D = new Array(A), E = new Array(s.dynamicValueTransformations.length), F = s.targetSequences, G = F.length, H = new Array(G), I = s.timelineSegments, J = I.length, K = new Array(J), L = s.defaults, M = {}, N = new c.Sequence(), O = {}, P = s.soleControlOptimizationDuringRun;
                for (f = 0; G > f; f++) for (n = F[f], o = n.clone(b(n.getTarget())), H[f] = o.targetSequence, 
                j = o.transformations, h = 0, k = j.length; k > h; h++) m = j[h], D[B] = m, B++, 
                m.hasDynamicValues() && (E[C] = m, C++);
                for (f = 0; J > f; f++) p = I[f], K[f] = new c.TimelineSegment(p.startTime, p.endTime);
                for (i in L) L.hasOwnProperty(i) && (M[i] = L[i]);
                return l = t ? l = 1 > y ? new c.Pollers.Auto() : new c.Pollers.FixedInterval(y) : null, 
                q = {
                    targetSequences: H,
                    timelineSegments: K,
                    lastUsedTimelineSegmentNumber: s.lastUsedTimelineSegmentNumber,
                    allTransformations: D,
                    dynamicValueTransformations: E,
                    indexCompletionCallbacks: [],
                    indexed: s.indexed,
                    indexingInProgress: !1,
                    indexTimerID: null,
                    indexingProcessData: {},
                    running: t,
                    currentTime: u,
                    unadjustedTime: s.unadjustedTime,
                    sequenceStartTime: s.sequenceStartTime,
                    sequenceEndTime: s.sequenceEndTime,
                    poller: l,
                    synchronizer: v,
                    initialSyncSourcePoint: z,
                    defaults: M,
                    synchronizeTo: s.synchronizeTo,
                    speed: w,
                    timeOffset: x,
                    pollingInterval: y,
                    after: s.after,
                    before: s.before,
                    autoStopAtEnd: s.autoStopAtEnd,
                    onAutoStop: s.onAutoStop,
                    stretchStartTimeToZero: s.stretchStartTimeToZero,
                    soleControlOptimizationDuringRun: P
                }, g.call(N, O, q), e && N.seek(u, P), t && l.run(function() {
                    N.seek(z + w * (v() - z) + x, P);
                }), N;
            }
            function r(a, b) {
                var c = this.thisPublic;
                c.run(e({
                    synchronizeTo: a,
                    initialSeek: null,
                    timeOffset: null
                }, b));
            }
            function s() {
                var b, c = this.thisPublic, d = a.call(c), e = d.dynamicValueTransformations, f = e.length;
                for (b = 0; f > b; b++) e[b].generateValues(c);
            }
            function t() {
                var b = this.thisPublic, c = a.call(b);
                return c.currentTime;
            }
            function u() {
                var b = this.thisPublic, c = a.call(b);
                return c.indexed || b.index(null, !1), c.sequenceEndTime;
            }
            function v() {
                var b = this.thisPublic, c = a.call(b);
                return c.ID;
            }
            function w() {
                var b = this.thisPublic, c = a.call(b);
                return c.indexed || b.index(null, !1), c.stretchStartTimeToZero ? Math.min(c.sequenceStartTime, 0) : c.sequenceStartTime;
            }
            function x(b, c) {
                var d = this.thisPublic, e = a.call(d);
                e.indexed && b ? b(d) : e.allTransformations.length < 1 ? (e.indexed = !0, b && b(d)) : (b && e.indexCompletionCallbacks.push(b), 
                e.indexingInProgress || e.resetIndexing(), e.indexingProcessData.isAsynchronous = c ? !0 : !1, 
                e.runIndexing());
            }
            function y() {
                var b = this.thisPublic, c = a.call(b);
                return c.running;
            }
            function z(b) {
                var c, d, e = this.thisPublic, f = a.call(e), g = f.targetSequences, h = g.length;
                for (c = 0; h > c; c++) d = g[c], d.retarget(b(d.getTarget()));
            }
            function A(b) {
                var d, e, g, h, i, j, k, l, m = this.thisPublic, n = a.call(m);
                n.running && m.stop(), n.indexed || m.index(null, !1), f(b, "generateValues", !0) && m.generateValues(), 
                h = f(b, "initialSeek", null), null !== h && m.seek(h, !1), n.speed = e = f(b, "speed", n.speed), 
                n.after = f(b, "after", n.after), n.before = f(b, "before", n.before), n.autoStopAtEnd = f(b, "autoStopAtEnd", n.autoStopAtEnd), 
                n.onAutoStop = f(b, "onAutoStop", n.onAutoStop), n.stretchStartTimeToZero = f(b, "stretchStartTimeToZero", n.stretchStartTimeToZero), 
                n.soleControlOptimizationDuringRun = l = f(b, "useSoleControlOptimization", n.soleControlOptimizationDuringRun), 
                n.pollingInterval = i = f(b, "pollingInterval", n.pollingInterval), n.poller = 1 > i ? new c.Pollers.Auto() : new c.Pollers.FixedInterval(i), 
                d = f(b, "synchronizeTo", n.synchronizeTo), j = null === d ? function() {
                    return new Date().getTime();
                } : "function" == typeof d ? d : function() {
                    return 1e3 * d.currentTime;
                }, n.synchronizer = j, n.initialSyncSourcePoint = k = j(), g = f(b, "timeOffset", null), 
                null === g && (g = null !== n.unadjustedTime ? n.unadjustedTime - k : m.getStartTime() - k), 
                n.timeOffset = g, n.running = !0, n.poller.run(function() {
                    m.seek(k + e * (j() - k) + g, l);
                });
            }
            function B(b, c) {
                var d, e, f, g, h, i, j, k, l, m = this.thisPublic, n = a.call(m), o = !1, p = null, q = n.targetSequences, r = q.length;
                if (n.indexed || m.index(null, !1), g = m.getStartTime(), h = n.sequenceEndTime, 
                k = n.nextFrameID++, g > b ? (i = n.before(g, h, b), j = i.adjustedTime, o = i.hitFinalBoundary) : b > h ? (i = n.after(g, h, b), 
                j = i.adjustedTime, o = i.hitFinalBoundary) : j = b, n.currentTime = j, n.unadjustedTime = b, 
                e = n.findSequenceSegmentNumberByTime(j), null !== e) {
                    for (f = e.segmentNumber, f !== n.lastSegmentNumber ? (l = !0, n.lastSegmentNumber = f) : l = "undefined" == typeof c ? !0 : !c, 
                    d = 0; r > d; d++) q[d].seek(f, j, k, l);
                    p = e.timeMatchType;
                }
                return o && n.running && n.autoStopAtEnd && (m.stop(), n.onAutoStop && n.onAutoStop(m)), 
                p;
            }
            function C(b) {
                var c = this.thisPublic, d = a.call(c);
                d.after = b;
            }
            function D(b) {
                var c = this.thisPublic, d = a.call(c);
                d.before = b;
            }
            function E(b) {
                var c, d = this.thisPublic, e = a.call(d), f = e.defaults;
                for (c in b) b.hasOwnProperty(c) && (f[c] = b[c]);
            }
            function F() {
                var b = this.thisPublic, c = a.call(b);
                c.running = !1, c.poller && (c.poller.stop(), c.poller = null);
            }
            function G(a, b) {
                var c = this.thisPublic;
                c.run(e({
                    synchronizeTo: a,
                    initialSeek: null,
                    timeOffset: 0,
                    autoStopAtEnd: !1
                }, b));
            }
            return d;
        }),
        revertNameSpace: function() {
            Concert = a;
        }
    }, d = {
        Applicators: c.Applicators,
        Calculators: c.Calculators,
        EasingFunctions: c.EasingFunctions,
        Repeating: c.Repeating,
        Sequence: c.Sequence,
        revertNameSpace: c.revertNameSpace
    };
    return d;
}();