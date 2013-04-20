var Concert = function() {
    "use strict";
    var e = Concert, t = function() {
        function e() {
            var e = this;
            e.thisPublic = this;
            var t = {
                thisPublic: e
            };
            e.___accessProtectedMembers = function() {
                i = t;
            };
        }
        function t() {
            return this.___accessProtectedMembers(), i;
        }
        function n() {}
        var i;
        return e.extend = function(e) {
            var i = e(t, this);
            return n.prototype = this.prototype, i.prototype = new n(), i.prototype.constructor = i, 
            i.extend = this.extend, i;
        }, e;
    }(), n = {
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
            arraysShallowlyEqual: function(e, t) {
                var n, i = e.length;
                if (t.length !== i) return !1;
                for (n = 0; i > n; n++) if (e[n] !== t[n]) return !1;
                return !0;
            },
            isArray: function(e) {
                return "object" == typeof e && "[object Array]" === Object.prototype.toString.call(e);
            },
            loadObjectData: function(e, t, n, i) {
                var r;
                for (r in e) e.hasOwnProperty(r) && (n[r] = e[r]);
                for (r in t) t.hasOwnProperty(r) && (i[r] = t[r]);
            },
            round: function(e, t) {
                return t * Math.round(e / t);
            }
        },
        Applicators: {
            Property: function(e, t, n) {
                e[t] = n;
            },
            Style: function(e, t, n, i) {
                e.style[t] = null === i ? n : "" + n + i;
            },
            SVG_ElementAttribute: function(e, t, n, i) {
                e.setAttribute(t, null === i ? n : "" + n + i);
            }
        },
        Calculators: {
            Color: function(e, t, i) {
                function r(e) {
                    return 1 === e.length && (e += e), parseInt(e, 16);
                }
                function a(e, t, i) {
                    var a, o, u, s, l, c, f, h, d, m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$|^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i, g = /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$|^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([0-9.]+)\s*\)$/i, p = /^#([0-9a-f])([0-9a-f])([0-9a-f])$|^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, v = !1, T = !1;
                    if (null !== (a = m.exec(e)) ? (o = m.exec(t), v = !0) : null !== (a = g.exec(e)) && (o = g.exec(t), 
                    T = !0), v || T) {
                        for (u = [], s = 1; 8 > s; s++) l = a[s], void 0 !== l && (l = parseInt(l, 10), 
                        c = l + i * (parseInt(o[s], 10) - l), u.push(7 > s ? n.Util.round(c, 1) : c));
                        v ? f = "rgb" + (4 === u.length ? "a" : "") + "(" + u.join() + ")" : (c = "" + u[0] + "," + ("" + u[1]) + "%," + ("" + u[2]) + "%", 
                        f = 4 === u.length ? "hsla(" + c + "," + ("" + u[3]) + ")" : "hsl(" + c + ")");
                    } else {
                        for (a = p.exec(e), o = p.exec(t), h = [], d = [], s = 1; 7 > s; s++) c = a[s], 
                        void 0 !== c && h.push(c), c = o[s], void 0 !== c && d.push(c);
                        for (f = "#", s = 0; 3 > s; s++) l = r(h[s]), c = n.Util.round(l + i * (r(d[s]) - l), 1), 
                        f += (16 > c ? "0" : "") + c.toString(16);
                    }
                    return f;
                }
                var o, u, s;
                if (n.Util.isArray(t)) for (s = [], o = 0, u = t.length; u > o; o++) s.push(a(t[o], i[o], e)); else s = a(t, i, e);
                return s;
            },
            Discrete: function(e, t, i, r) {
                var a, o, u, s, l, c = void 0 !== r.round;
                if (c && (l = r.round), n.Util.isArray(t)) for (u = [], a = 0, s = t.length; s > a; a++) o = 1 > e ? t[a] : i[a], 
                u.push(c ? n.Util.round(o, l) : o); else o = 1 > e ? t : i, u = c ? n.Util.round(o, l) : o;
                return u;
            },
            Linear: function(e, t, i, r) {
                var a, o, u, s, l, c, f = void 0 !== r.round;
                if (f && (c = r.round), n.Util.isArray(t)) for (l = [], a = 0, o = t.length; o > a; a++) u = t[a], 
                s = u + e * (i[a] - u), l.push(f ? n.Util.round(s, c) : s); else s = t + e * (i - t), 
                l = f ? n.Util.round(s, c) : s;
                return l;
            },
            Rotational: function(e, t, i, r) {
                var a, o = void 0 !== r.round;
                o && (a = r.round);
                var u = r.center[0], s = r.center[1], l = r.offset[0], c = r.offset[1], f = t[0], h = i[0], d = t[1], m = i[1], g = f + e * (h - f), p = d + e * (m - d), v = u + g * Math.cos(p) + l, T = s + g * Math.sin(p) + c;
                return o && (v = n.Util.round(v, a), T = n.Util.round(T, a)), [ v, T ];
            }
        },
        EasingFunctions: {
            ConstantRate: function(e, t, n) {
                return n >= t ? 1 : e > n ? 0 : (n - e) / (t - e);
            },
            QuadIn: function(e, t, n) {
                return n >= t ? 1 : e > n ? 0 : Math.pow((n - e) / (t - e), 2);
            },
            QuadInOut: function(e, t, n) {
                var i;
                return n >= t ? 1 : e > n ? 0 : (i = (e + t) / 2, i > n ? Math.pow((n - e) / (i - e), 2) / 2 : .5 + (1 - Math.pow(1 - (n - i) / (t - i), 2)) / 2);
            },
            QuadOut: function(e, t, n) {
                return n >= t ? 1 : e > n ? 0 : 1 - Math.pow(1 - (n - e) / (t - e), 2);
            },
            Smoothstep: function(e, t, n) {
                var i;
                return n >= t ? 1 : e > n ? 0 : (i = (n - e) / (t - e), i * i * (3 - 2 * i));
            }
        },
        Repeating: {
            Bounce: function(e) {
                function t(t, i, r) {
                    var a, o, u, s = i - t;
                    return t > r ? (a = t - r, o = Math.floor(a / s) + 1, n || e >= o ? (u = a % s, 
                    {
                        adjustedTime: 0 === o % 2 ? i - u : u,
                        hitFinalBoundary: !1
                    }) : {
                        adjustedTime: 0 === e % 2 ? t : i,
                        hitFinalBoundary: !0
                    }) : (a = r - i, o = Math.floor(a / s) + 1, n || e >= o ? (u = a % s, {
                        adjustedTime: 0 === o % 2 ? u : i - u,
                        hitFinalBoundary: !1
                    }) : {
                        adjustedTime: 0 === e % 2 ? i : t,
                        hitFinalBoundary: !0
                    });
                }
                var n = void 0 === e || null === e;
                return t;
            },
            Loop: function(e) {
                function t(t, i, r) {
                    var a, o = i - t;
                    return t > r ? (a = t - r, n || e >= a / o ? {
                        adjustedTime: i - a % o,
                        hitFinalBoundary: !1
                    } : {
                        adjustedTime: t,
                        hitFinalBoundary: !0
                    }) : (a = r - i, n || e >= a / o ? {
                        adjustedTime: t + a % o,
                        hitFinalBoundary: !1
                    } : {
                        adjustedTime: i,
                        hitFinalBoundary: !0
                    });
                }
                var n = void 0 === e || null === e;
                return t;
            },
            None: function(e, t, n) {
                return e > n ? {
                    adjustedTime: e,
                    hitFinalBoundary: !0
                } : {
                    adjustedTime: t,
                    hitFinalBoundary: !0
                };
            }
        },
        Pollers: {
            Auto: t.extend(function(e, t) {
                function i() {
                    if (!window.cancelAnimationFrame) return new n.Pollers.FixedInterval(n.Definitions.FallbackAutoPollerInterval);
                    t.call(this);
                    var i = this.thisPublic, o = e.call(i);
                    o.frameRequestID = null, i.run = r, i.stop = a;
                }
                function r(t) {
                    var n, i = this.thisPublic, r = e.call(i);
                    null === r.frameRequestID && (n = function() {
                        r.frameRequestID = window.requestAnimationFrame(n), t();
                    }, n());
                }
                function a() {
                    var t = this.thisPublic, n = e.call(t);
                    null !== n.frameRequestID && (window.cancelAnimationFrame(n.frameRequestID), n.frameRequestID = null);
                }
                return i;
            }),
            FixedInterval: t.extend(function(e, t) {
                function n(n) {
                    t.call(this);
                    var a = this.thisPublic, o = e.call(a);
                    o.interval = n, o.intervalID = null, a.run = i, a.stop = r;
                }
                function i(t) {
                    var n = this.thisPublic, i = e.call(n);
                    null === i.intervalID && (i.intervalID = setInterval(t, i.interval));
                }
                function r() {
                    var t = this.thisPublic, n = e.call(t);
                    null !== n.intervalID && (clearInterval(n.intervalID), n.intervalID = null);
                }
                return n;
            })
        },
        Transformation: function() {
            function e(e) {
                var t;
                this.transformationID = s++, this.additionalProperties = {};
                for (t in e) "target" === t || "feature" === t || "applicator" === t || "calculator" === t || "t1" === t || "t2" === t || "v1" === t || "v2" === t || "v1Generator" === t || "v2Generator" === t || "unit" === t || "easing" === t ? this[t] = e[t] : e.hasOwnProperty(t) && (this.additionalProperties[t] = e[t]);
                this.lastFrameID = null, this.lastCalculatedValue = null, this.lastAppliedValueContainer = {
                    value: n.Util.isArray(this.feature) ? Array(this.feature.length) : null,
                    unit: null
                }, this.clone = i, this.generateValues = r, this.hasDynamicValues = a, this.retarget = o, 
                this.seek = u;
            }
            function t(e, t, i, r, a, o, u) {
                var s, l, c, f, h, d, m, g, p, v, T;
                if (l = a.value, c = a.unit, f = o.value, h = o.unit, d = u || null === f, n.Util.isArray(i)) for (p = n.Util.isArray(c), 
                s = 0, m = i.length; m > s; s++) g = i[s], g === r && (v = l[s], T = p ? c[s] : c, 
                (d || v !== f[s] || T !== (p ? h[s] : h)) && (e(t, g, v, T), f[s] = v, p ? h[s] = T : o.unit = T)); else (d || l !== f || c !== h) && (e(t, i, l, c), 
                o.value = l, o.unit = c);
            }
            function i(e) {
                var t, i, r, a = this.additionalProperties, o = {
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
                t = new n.Transformation();
                for (i in this) this.hasOwnProperty(i) && !o[i] && (t[i] = this[i]);
                t.target = e, t.lastAppliedValueContainer = {
                    value: n.Util.isArray(this.feature) ? Array(this.feature.length) : null,
                    unit: null
                }, t.lastFrameID = null, t.lastCalculatedValue = null, r = t.additionalProperties;
                for (i in a) a.hasOwnProperty(i) && (r[i] = a[i]);
                return t;
            }
            function r(e) {
                var t = this.v1Generator, n = this.v2Generator;
                "function" == typeof t && (this.v1 = t(e)), "function" == typeof n && (this.v2 = n(e));
            }
            function a() {
                return "function" == typeof this.v1Generator || "function" == typeof this.v2Generator;
            }
            function o(e) {
                this.target = e, this.lastAppliedValueContainer = {
                    value: n.Util.isArray(this.feature) ? Array(this.feature.length) : null,
                    unit: null
                };
            }
            function u(e, n, i, r) {
                var a = n === this.lastFrameID ? this.lastCalculatedValue : this.calculator(this.easing(this.t1, this.t2, e), this.v1, this.v2, this.additionalProperties);
                t(this.applicator, this.target, this.feature, i, {
                    value: a,
                    unit: this.unit
                }, this.lastAppliedValueContainer, r);
            }
            var s = 0;
            return e;
        }(),
        FeatureSequence: function() {
            function e(e, n) {
                this.target = e, this.feature = n, this.transformations = [], this.transformationIndexBySegment = null, 
                this.clone = t, this.indexTransformations = i, this.retarget = r, this.seek = a;
            }
            function t(e) {
                var t, i, r, a, o = this.transformations, u = o.length, s = Array(u), l = this.transformationIndexBySegment, c = null, f = new n.FeatureSequence(e, this.feature), h = {
                    featureSequence: f,
                    transformations: s
                };
                for (t = 0; u > t; t++) s[t] = o[t].clone(e);
                if (f.transformations = s, l) for (r = l.length, c = Array(r), t = 0; r > t; t++) for (a = l[t], 
                i = 0; u > i; i++) if (a === o[i]) {
                    c[t] = s[i];
                    break;
                }
                return f.transformationIndexBySegment = c, h;
            }
            function i(e) {
                var t, n, i, r, a, o, u, s, l = this.transformations, c = l.length - 1, f = e.length;
                if (!(0 > c)) for (l.sort(function(e, t) {
                    var n = e.t1, i = t.t1;
                    return n === i ? 0 : i > n ? -1 : 1;
                }), i = this.transformationIndexBySegment = Array(f), r = 0, s = e[0].startTime, 
                t = 0, a = l[0], c > 0 ? (o = l[1], u = o.t1, n = !0) : n = !1; f > r; ) if (n && s >= u) t++, 
                a = o, c > t ? (o = l[t + 1], u = o.t1) : n = !1; else {
                    if (i[r] = a, r++, !(f > r)) break;
                    s = e[r].startTime;
                }
            }
            function r(e) {
                var t, n = this.transformations, i = n.length;
                for (t = 0; i > t; t++) n[t].retarget(e);
                this.target = e;
            }
            function a(e, t, n, i) {
                return this.transformationIndexBySegment[e].seek(t, n, this.feature, i);
            }
            return e;
        }(),
        TargetSequence: t.extend(function(e, t) {
            function i(n) {
                t.call(this);
                var i = this.thisPublic, f = e.call(i);
                f.target = n, f.featureSequences = [], i.addFeatureSequence = r, i.clone = a, i.findFeatureSequenceByFeature = o, 
                i.getTarget = u, i.indexTransformations = s, i.retarget = l, i.seek = c;
            }
            function r(t) {
                var n = this.thisPublic, i = e.call(n);
                i.featureSequences.push(t);
            }
            function a(t) {
                var i, r, a = this.thisPublic, o = e.call(a), u = [], s = o.featureSequences, l = s.length, c = new n.TargetSequence(t), f = {
                    targetSequence: c,
                    transformations: u
                };
                for (i = 0; l > i; i++) r = s[i].clone(t), c.addFeatureSequence(r.featureSequence), 
                u.push.apply(u, r.transformations);
                return f;
            }
            function o(t) {
                var n, i, r = this.thisPublic, a = e.call(r), o = a.featureSequences, u = o.length;
                for (n = 0; u > n; n++) if (i = o[n], i.feature === t) return i;
                return null;
            }
            function u() {
                var t = this.thisPublic, n = e.call(t);
                return n.target;
            }
            function s(t) {
                var n, i, r = this.thisPublic, a = e.call(r), o = a.featureSequences;
                for (n = 0, i = o.length; i > n; n++) o[n].indexTransformations(t);
            }
            function l(t) {
                var n, i = this.thisPublic, r = e.call(i), a = r.featureSequences, o = a.length;
                for (n = 0; o > n; n++) a[n].retarget(t);
                r.target = t;
            }
            function c(t, n, i, r) {
                var a, o, u = this.thisPublic, s = e.call(u), l = s.featureSequences;
                for (o = 0, a = l.length; a > o; o++) l[o].seek(t, n, i, r);
            }
            return i;
        }),
        TimelineSegment: function(e, t) {
            this.startTime = e, this.endTime = t;
        },
        Sequence: t.extend(function(e, t) {
            function i(i) {
                t.call(this);
                var r = this.thisPublic, a = e.call(r);
                a.ID = n.nextSequenceID, n.nextSequenceID++, a.nextFrameID = 0, a.targetSequences = [], 
                a.timelineSegments = [], a.lastUsedTimelineSegmentNumber = 0, a.allTransformations = [], 
                a.dynamicValueTransformations = [], a.indexCompletionCallbacks = [], a.indexed = !1, 
                a.indexingInProgress = !1, a.indexTimerID = null, a.indexingProcessData = {}, a.running = !1, 
                a.currentTime = null, a.unadjustedTime = null, a.sequenceStartTime = null, a.sequenceEndTime = null, 
                a.poller = null, a.synchronizer = null, a.initialSyncSourcePoint = null, a.lastSegmentNumber = null, 
                a.defaults = {
                    unit: null,
                    applicator: Concert.Applicators.Property,
                    easing: Concert.EasingFunctions.ConstantRate,
                    calculator: Concert.Calculators.Linear
                }, a.synchronizeTo = null, a.speed = 1, a.timeOffset = 0, a.pollingInterval = 0, 
                a.after = n.Repeating.None, a.before = n.Repeating.None, a.autoStopAtEnd = !0, a.onAutoStop = null, 
                a.soleControlOptimizationDuringRun = !0, a.advanceIndexingToNextStep = s, a.findSequenceSegmentNumberByTime = l, 
                a.findSequenceSegmentNumberInRange = c, a.findTargetSequenceByTarget = f, a.resetIndexing = h, 
                a.runIndexing = d, r.addTransformations = m, r.begin = g, r.clone = p, r.follow = v, 
                r.generateValues = T, r.getCurrentTime = S, r.getEndTime = y, r.getID = P, r.getStartTime = b, 
                r.index = I, r.isRunning = D, r.retarget = x, r.run = A, r.seek = q, r.setDefaults = w, 
                r.stop = R, r.syncTo = C, i && r.addTransformations(i);
            }
            function r(e, t) {
                var n, i = {};
                if (e) for (n in e) e.hasOwnProperty(n) && (i[n] = e[n]);
                if (t) for (n in t) t.hasOwnProperty(n) && (i[n] = t[n]);
                return i;
            }
            function a(e, t, n) {
                return e && void 0 !== e[t] ? e[t] : n;
            }
            function o(t, i) {
                var r = this.thisPublic, a = e.call(r);
                n.Util.loadObjectData(t, i, r, a);
            }
            function u(e, t) {
                var n, i = 0, r = t.length - 1;
                if (0 > r || e > t[r]) t.push(e); else if (t[0] > e) t.unshift(e); else {
                    for (;r > i + 1; ) n = Math.floor((i + r) / 2), t[n] > e ? r = n : i = n;
                    t.splice(r, 0, e);
                }
            }
            function s() {
                var t, i, r, a, o = this.thisPublic, u = e.call(o), s = u.indexingProcessData, l = !1;
                switch (s.step++, s.startingIndex = 0, s.step) {
                  case 1:
                    s.inputData = s.outputData, s.iterationsPerRound = n.Definitions.StartingIterationsPerAsynchProcessingRound.consolidateDistinctValues, 
                    s.totalIterationsThisStep = s.inputData.length, s.outputData = {};
                    break;

                  case 2:
                    if (s.iterationsPerRound = n.Definitions.StartingIterationsPerAsynchProcessingRound.buildSortedArray, 
                    s.isAsynchronous) {
                        t = s.outputData, r = [];
                        for (i in t) t.hasOwnProperty(i) && r.push(t[i]);
                        s.inputData = r, s.totalIterationsThisStep = r.length;
                    } else s.inputData = s.outputData, s.totalIterationsThisStep = 1;
                    s.outputData = [];
                    break;

                  case 3:
                    s.inputData = s.outputData, s.iterationsPerRound = n.Definitions.StartingIterationsPerAsynchProcessingRound.buildDistinctSegmentList, 
                    s.totalIterationsThisStep = s.inputData.length - 1, s.outputData = Array(s.totalIterationsThisStep);
                    break;

                  case 4:
                    s.inputData = s.outputData, s.iterationsPerRound = n.Definitions.StartingIterationsPerAsynchProcessingRound.indexTargetSequences, 
                    s.totalIterationsThisStep = u.targetSequences.length, s.outputData = null;
                    break;

                  case 5:
                    for (l = !0, u.timelineSegments = a = s.inputData, u.sequenceStartTime = !a || 1 > a.length ? null : a[0].startTime, 
                    u.sequenceEndTime = !a || 1 > a.length ? null : a[a.length - 1].endTime, u.indexed = !0, 
                    u.indexingInProgress = !1, s.inputData = null, s.iterationsPerRound = 1, s.totalIterationsThisStep = 0, 
                    s.outputData = null; u.indexCompletionCallbacks.length; ) u.indexCompletionCallbacks.shift()(o);
                }
                return l;
            }
            function l(t) {
                var n, i, r, a, o = this.thisPublic, u = e.call(o), s = u.timelineSegments, l = s.length;
                return l > 0 ? (i = u.lastUsedTimelineSegmentNumber, r = s[i], a = r.endTime, t >= r.startTime ? a > t ? n = {
                    segmentNumber: i,
                    timeMatchType: 0
                } : i === l - 1 ? n = {
                    segmentNumber: i,
                    timeMatchType: 1
                } : (i++, r = s[i], a = r.endTime, n = a > t ? {
                    segmentNumber: i,
                    timeMatchType: 0
                } : i === l - 1 ? {
                    segmentNumber: i,
                    timeMatchType: 1
                } : u.findSequenceSegmentNumberInRange(t, i + 1, l - 1)) : n = 0 === i ? {
                    segmentNumber: 0,
                    timeMatchType: -1
                } : u.findSequenceSegmentNumberInRange(t, 0, i - 1), u.lastUsedTimelineSegmentNumber = n.segmentNumber) : n = null, 
                n;
            }
            function c(t, n, i) {
                var r, a, o, u = this.thisPublic, s = e.call(u);
                do if (r = Math.floor((n + i) / 2), a = s.timelineSegments[r], a.startTime > t) i = r - 1, 
                o = -1; else {
                    if (!(t >= a.endTime)) {
                        o = 0;
                        break;
                    }
                    n = r + 1, o = 1;
                } while (i > n);
                return {
                    segmentNumber: r,
                    timeMatchType: o
                };
            }
            function f(t) {
                var n, i = this.thisPublic, r = e.call(i), a = r.targetSequences, o = a.length;
                for (n = 0; o > n; n++) if (a[n].getTarget() === t) return a[n];
                return null;
            }
            function h() {
                var t = this.thisPublic, i = e.call(t), r = i.indexingProcessData;
                r.step = 0, r.startingIndex = 0, r.iterationsPerRound = n.Definitions.StartingIterationsPerAsynchProcessingRound.buildBreakPointList, 
                r.inputData = i.allTransformations, r.totalIterationsThisStep = i.allTransformations.length, 
                r.outputData = Array(2 * r.totalIterationsThisStep);
            }
            function d() {
                function t() {
                    var e, i, r, s, l, c, f, h = o.step, d = o.isAsynchronous, m = o.inputData, g = o.startingIndex, p = o.totalIterationsThisStep, v = d ? o.iterationsPerRound : p, T = Math.min(p, g + v), S = o.outputData, y = !1, P = 0 === h ? 2 * g : null;
                    if (d && (e = new Date().getTime()), 2 !== h || d || n.Util.isArray(m)) for (3 === h ? s = m[g] : 4 === h && (f = a.targetSequences); T > g; ) {
                        switch (h) {
                          case 0:
                            r = m[g], S[P++] = r.t1, S[P++] = r.t2;
                            break;

                          case 1:
                            s = m[g], S[s] = s;
                            break;

                          case 2:
                            u(m[g], S);
                            break;

                          case 3:
                            c = m[g + 1], S[g] = new n.TimelineSegment(s, c), s = c;
                            break;

                          case 4:
                            f[g].indexTransformations(m);
                        }
                        g++;
                    } else for (l in m) m.hasOwnProperty(l) && u(m[l], S);
                    return T === p ? y = a.advanceIndexingToNextStep() : (i = new Date().getTime(), 
                    o.startingIndex = g, n.Definitions.IterationRoundTimeHalfBound > i - e && (o.iterationsPerRound *= 2)), 
                    d && !y && (a.indexTimerID = window.setTimeout(t, 0)), y;
                }
                var i, r = this.thisPublic, a = e.call(r), o = a.indexingProcessData;
                if (o.isAsynchronous) a.indexingInProgress = !0, a.indexTimerID = window.setTimeout(t, 0); else for (null !== a.indexTimerID && (window.clearTimeout(a.indexTimerID), 
                a.indexTimerID = null); !i; ) i = t();
            }
            function m(t) {
                var i, r, a, o, u, s, l, c, f, h, d, m, g, p, v, T, S, y, P, b, I, D, x, A, q, w, R, C, F, k, O, N, B, U = this.thisPublic, V = e.call(U), j = [], M = V.targetSequences, E = null, z = V.defaults, G = V.allTransformations, L = V.dynamicValueTransformations;
                for (V.indexingInProgress ? V.resetIndexing() : V.indexed = !1, n.Util.isArray(t) || (t = [ t ]), 
                i = 0, o = t.length; o > i; i++) if (u = t[i], s = u.target, l = u.targets, n.Util.isArray(l)) for (void 0 !== s && null !== s && (l = [ s ].concat(l)), 
                r = 0, c = l.length; c > r; r++) {
                    f = {};
                    for (P in u) u.hasOwnProperty(P) && (f[P] = u[P]);
                    f.targets = null, f.target = l[r], U.addTransformations(f);
                } else {
                    for (E = V.findTargetSequenceByTarget(s), null === E && (E = new n.TargetSequence(s), 
                    M.push(E)), h = n.Util.isArray(u.feature) ? u.feature : [ u.feature ], p = u.applicator, 
                    void 0 === p && (p = z.applicator), d = u.unit, void 0 === d && (d = z.unit), m = u.calculator, 
                    void 0 === m && (m = z.calculator), g = u.easing, void 0 === g && (g = z.easing), 
                    r = 0; h.length > r; r++) D = E.findFeatureSequenceByFeature(h[r]), null === D && (D = new n.FeatureSequence(s, h[r]), 
                    E.addFeatureSequence(D)), j[r] = D;
                    if (v = u.keyframes, void 0 !== v) {
                        for (A = v.times, q = v.values, w = v.valueGenerators, k = O = N = C = F = null, 
                        r = 0, x = A.length; x > r; r++) if (R = A[r], q && (C = q[r]), w && (F = w[r]), 
                        null === k ? (k = R, O = C, N = F, B = null !== R && r === x - 1) : null === R ? (k = O = N = null, 
                        B = !1) : B = !0, B) {
                            for (b = {
                                target: s,
                                feature: 1 === h.length ? h[0] : h,
                                applicator: p,
                                unit: d,
                                calculator: m,
                                easing: g,
                                t1: k,
                                t2: R,
                                v1: O,
                                v2: C,
                                v1Generator: N,
                                v2Generator: F
                            }, I = new n.Transformation(b), G.push(I), (N || F) && L.push(I), a = 0; j.length > a; a++) j[a].transformations.push(I);
                            k = R, O = C;
                        }
                    } else for (T = u.segments, n.Util.isArray(T) || (T = [ T ]), r = 0, S = T.length; S > r; r++) {
                        y = T[r], b = {
                            target: s,
                            feature: 1 === h.length ? h[0] : h,
                            applicator: p
                        };
                        for (P in y) y.hasOwnProperty(P) && (b[P] = y[P]);
                        for (void 0 === b.unit && (b.unit = d), void 0 === b.calculator && (b.calculator = m), 
                        void 0 === b.easing && (b.easing = g), I = new n.Transformation(b), G.push(I), (void 0 !== b.v1Generator || void 0 !== b.v2Generator) && L.push(I), 
                        a = 0; j.length > a; a++) j[a].transformations.push(I);
                    }
                }
            }
            function g(e) {
                var t = this.thisPublic;
                t.run(r({
                    synchronizeTo: null,
                    initialSeek: 0,
                    timeOffset: null,
                    autoStopAtEnd: !0
                }, e));
            }
            function p(t, i, r) {
                var a, u, s, l, c, f, h, d, m, g, p, v = this.thisPublic, T = e.call(v), S = i && T.running, y = T.currentTime, P = T.synchronizer, b = T.speed, I = T.timeOffset, D = T.pollingInterval, x = T.initialSyncSourcePoint, A = T.allTransformations.length, q = 0, w = 0, R = Array(A), C = Array(T.dynamicValueTransformations.length), F = T.targetSequences, k = F.length, O = Array(k), N = T.timelineSegments, B = N.length, U = Array(B), V = T.defaults, j = {}, M = new n.Sequence(), E = {}, z = T.soleControlOptimizationDuringRun;
                for (a = 0; k > a; a++) for (d = F[a], m = d.clone(t(d.getTarget())), O[a] = m.targetSequence, 
                l = m.transformations, u = 0, c = l.length; c > u; u++) h = l[u], R[q] = h, q++, 
                h.hasDynamicValues() && (C[w] = h, w++);
                for (a = 0; B > a; a++) g = N[a], U[a] = new n.TimelineSegment(g.startTime, g.endTime);
                for (s in V) V.hasOwnProperty(s) && (j[s] = V[s]);
                return f = S ? f = 1 > D ? new n.Pollers.Auto() : new n.Pollers.FixedInterval(D) : null, 
                p = {
                    targetSequences: O,
                    timelineSegments: U,
                    lastUsedTimelineSegmentNumber: T.lastUsedTimelineSegmentNumber,
                    allTransformations: R,
                    dynamicValueTransformations: C,
                    indexCompletionCallbacks: [],
                    indexed: T.indexed,
                    indexingInProgress: !1,
                    indexTimerID: null,
                    indexingProcessData: {},
                    running: S,
                    currentTime: y,
                    unadjustedTime: T.unadjustedTime,
                    sequenceStartTime: T.sequenceStartTime,
                    sequenceEndTime: T.sequenceEndTime,
                    poller: f,
                    synchronizer: P,
                    initialSyncSourcePoint: x,
                    defaults: j,
                    synchronizeTo: T.synchronizeTo,
                    speed: b,
                    timeOffset: I,
                    pollingInterval: D,
                    after: T.after,
                    before: T.before,
                    autoStopAtEnd: T.autoStopAtEnd,
                    onAutoStop: T.onAutoStop,
                    soleControlOptimizationDuringRun: z
                }, o.call(M, E, p), r && M.seek(y, z), S && f.run(function() {
                    M.seek(x + b * (P() - x) + I, z);
                }), M;
            }
            function v(e, t) {
                var n = this.thisPublic;
                n.run(r({
                    synchronizeTo: e,
                    initialSeek: null,
                    timeOffset: null
                }, t));
            }
            function T() {
                var t, n = this.thisPublic, i = e.call(n), r = i.dynamicValueTransformations, a = r.length;
                for (t = 0; a > t; t++) r[t].generateValues(n);
            }
            function S() {
                var t = this.thisPublic, n = e.call(t);
                return n.currentTime;
            }
            function y() {
                var t = this.thisPublic, n = e.call(t);
                return n.indexed || t.index(null, !1), n.sequenceEndTime;
            }
            function P() {
                var t = this.thisPublic, n = e.call(t);
                return n.ID;
            }
            function b() {
                var t = this.thisPublic, n = e.call(t);
                return n.indexed || t.index(null, !1), n.sequenceStartTime;
            }
            function I(t, n) {
                var i = this.thisPublic, r = e.call(i);
                r.indexed && t ? t(i) : 1 > r.allTransformations.length ? (r.indexed = !0, t && t(i)) : (t && r.indexCompletionCallbacks.push(t), 
                r.indexingInProgress || r.resetIndexing(), r.indexingProcessData.isAsynchronous = n ? !0 : !1, 
                r.runIndexing());
            }
            function D() {
                var t = this.thisPublic, n = e.call(t);
                return n.running;
            }
            function x(t) {
                var n, i, r = this.thisPublic, a = e.call(r), o = a.targetSequences, u = o.length;
                for (n = 0; u > n; n++) i = o[n], i.retarget(t(i.getTarget()));
            }
            function A(t) {
                var i, r, o, u, s, l, c, f, h = this.thisPublic, d = e.call(h);
                d.running && h.stop(), d.indexed || h.index(null, !1), a(t, "generateValues", !0) && h.generateValues(), 
                u = a(t, "initialSeek", null), null !== u && h.seek(u, !1), d.speed = r = a(t, "speed", d.speed), 
                d.after = a(t, "after", d.after), d.before = a(t, "before", d.before), d.autoStopAtEnd = a(t, "autoStopAtEnd", d.autoStopAtEnd), 
                d.onAutoStop = a(t, "onAutoStop", d.onAutoStop), d.soleControlOptimizationDuringRun = f = a(t, "useSoleControlOptimization", d.soleControlOptimizationDuringRun), 
                d.pollingInterval = s = a(t, "pollingInterval", d.pollingInterval), d.poller = 1 > s ? new n.Pollers.Auto() : new n.Pollers.FixedInterval(s), 
                i = a(t, "synchronizeTo", d.synchronizeTo), l = null === i ? function() {
                    return new Date().getTime();
                } : "function" == typeof i ? i : function() {
                    return 1e3 * i.currentTime;
                }, d.synchronizer = l, d.initialSyncSourcePoint = c = l(), o = a(t, "timeOffset", null), 
                null === o && (o = null !== d.unadjustedTime ? d.unadjustedTime - c : d.sequenceStartTime - c), 
                d.timeOffset = o, d.running = !0, d.poller.run(function() {
                    h.seek(c + r * (l() - c) + o, f);
                });
            }
            function q(t, n) {
                var i, r, a, o, u, s, l, c, f, h = this.thisPublic, d = e.call(h), m = !1, g = null, p = d.targetSequences, v = p.length;
                if (d.indexed || h.index(null, !1), o = d.sequenceStartTime, u = d.sequenceEndTime, 
                c = d.nextFrameID++, o > t ? (s = d.before(o, u, t), l = s.adjustedTime, m = s.hitFinalBoundary) : t > u ? (s = d.after(o, u, t), 
                l = s.adjustedTime, m = s.hitFinalBoundary) : l = t, d.currentTime = l, d.unadjustedTime = t, 
                r = d.findSequenceSegmentNumberByTime(l), null !== r) {
                    for (a = r.segmentNumber, a !== d.lastSegmentNumber ? (f = !0, d.lastSegmentNumber = a) : f = void 0 === n ? !0 : !n, 
                    i = 0; v > i; i++) p[i].seek(a, l, c, f);
                    g = r.timeMatchType;
                }
                return m && d.running && d.autoStopAtEnd && (h.stop(), d.onAutoStop && d.onAutoStop(h)), 
                g;
            }
            function w(t) {
                var n, i = this.thisPublic, r = e.call(i), a = r.defaults;
                for (n in t) t.hasOwnProperty(n) && (a[n] = t[n]);
            }
            function R() {
                var t = this.thisPublic, n = e.call(t);
                n.running = !1, n.poller && (n.poller.stop(), n.poller = null);
            }
            function C(e, t) {
                var n = this.thisPublic;
                n.run(r({
                    synchronizeTo: e,
                    initialSeek: null,
                    timeOffset: 0,
                    autoStopAtEnd: !1
                }, t));
            }
            return i;
        }),
        revertNameSpace: function() {
            Concert = e;
        }
    }, i = {
        Applicators: n.Applicators,
        Calculators: n.Calculators,
        EasingFunctions: n.EasingFunctions,
        Repeating: n.Repeating,
        Sequence: n.Sequence,
        revertNameSpace: n.revertNameSpace
    };
    return i;
}();