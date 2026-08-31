//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var ee = Array.isArray;
	function S() {}
	var C = {
		H: null,
		A: null,
		T: null,
		S: null
	}, w = Object.prototype.hasOwnProperty;
	function T(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function te(e, t) {
		return T(e.type, t, e.props);
	}
	function E(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ne(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var D = /\/+/g;
	function re(e, t) {
		return typeof e == "object" && e && e.key != null ? ne("" + e.key) : t.toString(36);
	}
	function ie(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(S, S) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function ae(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, ae(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + re(e, 0) : a, ee(o) ? (i = "", c != null && (i = c.replace(D, "$&/") + "/"), ae(o, r, i, "", function(e) {
			return e;
		})) : o != null && (E(o) && (o = te(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(D, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (ee(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + re(a, u), c += ae(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + re(a, u++), c += ae(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ae(ie(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function O(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ae(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function k(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var A = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, j = {
		map: O,
		forEach: function(e, t, n) {
			O(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return O(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return O(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!E(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = j, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = C, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return C.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !w.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return T(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) w.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return T(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = E, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: k
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = C.T, n = {};
		C.T = n;
		try {
			var r = e(), i = C.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(S, A);
		} catch (e) {
			A(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), C.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return C.H.useCacheRefresh();
	}, e.use = function(e) {
		return C.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return C.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return C.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return C.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return C.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return C.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return C.H.useEffectEvent(e);
	}, e.useId = function() {
		return C.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return C.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return C.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return C.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return C.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return C.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return C.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return C.H.useRef(e);
	}, e.useState = function(e) {
		return C.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return C.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return C.H.useTransition();
	}, e.version = "19.2.8";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, ee || (ee = !0, E());
			else {
				var t = n(l);
				t !== null && re(x, t.startTime - e);
			}
		}
	}
	var ee = !1, S = -1, C = 5, w = -1;
	function T() {
		return g ? !0 : !(e.unstable_now() - w < C);
	}
	function te() {
		if (g = !1, ee) {
			var t = e.unstable_now();
			w = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(S), S = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && T());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && re(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? E() : ee = !1;
			}
		}
	}
	var E;
	if (typeof y == "function") E = function() {
		y(te);
	};
	else if (typeof MessageChannel < "u") {
		var ne = new MessageChannel(), D = ne.port2;
		ne.port1.onmessage = te, E = function() {
			D.postMessage(null);
		};
	} else E = function() {
		_(te, 0);
	};
	function re(t, n) {
		S = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : C = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(S), S = -1) : h = !0, re(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, ee || (ee = !0, E()))), r;
	}, e.unstable_shouldYield = T, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") {
			if (typeof t == "object" && t) {
				if (t.as == null || t.as === "script") {
					var n = c(t.as, t.crossOrigin);
					i.d.M(e, {
						crossOrigin: n,
						integrity: typeof t.integrity == "string" ? t.integrity : void 0,
						nonce: typeof t.nonce == "string" ? t.nonce : void 0
					});
				}
			} else t ?? i.d.M(e);
		}
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") {
			if (t) {
				var n = c(t.as, t.crossOrigin);
				i.d.m(e, {
					as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0
				});
			} else i.d.m(e);
		}
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.8";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), ee = Symbol.for("react.consumer"), S = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), T = Symbol.for("react.suspense_list"), te = Symbol.for("react.memo"), E = Symbol.for("react.lazy"), ne = Symbol.for("react.activity"), D = Symbol.for("react.memo_cache_sentinel"), re = Symbol.iterator;
	function ie(e) {
		return typeof e != "object" || !e ? null : (e = re && e[re] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ae = Symbol.for("react.client.reference");
	function O(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ae ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case w: return "Suspense";
			case T: return "SuspenseList";
			case ne: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case S: return e.displayName || "Context";
			case ee: return (e._context.displayName || "Context") + ".Consumer";
			case C:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case te: return t = e.displayName || null, t === null ? O(e.type) || "Memo" : t;
			case E:
				t = e._payload, e = e._init;
				try {
					return O(e(t));
				} catch {}
		}
		return null;
	}
	var k = Array.isArray, A = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, oe = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, se = [], ce = -1;
	function le(e) {
		return { current: e };
	}
	function ue(e) {
		0 > ce || (e.current = se[ce], se[ce] = null, ce--);
	}
	function M(e, t) {
		ce++, se[ce] = e.current, e.current = t;
	}
	var de = le(null), fe = le(null), pe = le(null), me = le(null);
	function he(e, t) {
		switch (M(pe, t), M(fe, e), M(de, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		ue(de), M(de, e);
	}
	function ge() {
		ue(de), ue(fe), ue(pe);
	}
	function N(e) {
		e.memoizedState !== null && M(me, e);
		var t = de.current, n = Hd(t, e.type);
		t !== n && (M(fe, e), M(de, n));
	}
	function P(e) {
		fe.current === e && (ue(de), ue(fe)), me.current === e && (ue(me), Qf._currentValue = oe);
	}
	var F, _e;
	function I(e) {
		if (F === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			F = t && t[1] || "", _e = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + F + e + _e;
	}
	var L = !1;
	function ve(e, t) {
		if (!e || L) return "";
		L = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			L = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? I(n) : "";
	}
	function ye(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return I(e.type);
			case 16: return I("Lazy");
			case 13: return e.child !== t && t !== null ? I("Suspense Fallback") : I("Suspense");
			case 19: return I("SuspenseList");
			case 0:
			case 15: return ve(e.type, !1);
			case 11: return ve(e.type.render, !1);
			case 1: return ve(e.type, !0);
			case 31: return I("Activity");
			default: return "";
		}
	}
	function be(e) {
		try {
			var t = "", n = null;
			do
				t += ye(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var xe = Object.prototype.hasOwnProperty, Se = t.unstable_scheduleCallback, Ce = t.unstable_cancelCallback, we = t.unstable_shouldYield, Te = t.unstable_requestPaint, R = t.unstable_now, z = t.unstable_getCurrentPriorityLevel, Ee = t.unstable_ImmediatePriority, De = t.unstable_UserBlockingPriority, Oe = t.unstable_NormalPriority, ke = t.unstable_LowPriority, Ae = t.unstable_IdlePriority, je = t.log, Me = t.unstable_setDisableYieldValue, Ne = null, Pe = null;
	function Fe(e) {
		if (typeof je == "function" && Me(e), Pe && typeof Pe.setStrictMode == "function") try {
			Pe.setStrictMode(Ne, e);
		} catch {}
	}
	var Ie = Math.clz32 ? Math.clz32 : ze, Le = Math.log, Re = Math.LN2;
	function ze(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Le(e) / Re | 0) | 0;
	}
	var Be = 256, Ve = 262144, He = 4194304;
	function Ue(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function We(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Ue(n))) : i = Ue(o) : i = Ue(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Ue(n))) : i = Ue(o)) : i = Ue(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Ge(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Ke(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function qe() {
		var e = He;
		return He <<= 1, !(He & 62914560) && (He = 4194304), e;
	}
	function Je(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Ye(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Xe(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Ie(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && Ze(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function Ze(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Ie(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function Qe(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Ie(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function $e(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : et(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function et(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function tt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function nt() {
		var e = j.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function rt(e, t) {
		var n = j.p;
		try {
			return j.p = e, t();
		} finally {
			j.p = n;
		}
	}
	var it = Math.random().toString(36).slice(2), at = "__reactFiber$" + it, ot = "__reactProps$" + it, st = "__reactContainer$" + it, ct = "__reactEvents$" + it, lt = "__reactListeners$" + it, ut = "__reactHandles$" + it, dt = "__reactResources$" + it, ft = "__reactMarker$" + it;
	function pt(e) {
		delete e[at], delete e[ot], delete e[ct], delete e[lt], delete e[ut];
	}
	function mt(e) {
		var t = e[at];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[st] || n[at]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[at]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function ht(e) {
		if (e = e[at] || e[st]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function gt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function _t(e) {
		var t = e[dt];
		return t ||= e[dt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function vt(e) {
		e[ft] = !0;
	}
	var yt = /* @__PURE__ */ new Set(), bt = {};
	function xt(e, t) {
		St(e, t), St(e + "Capture", t);
	}
	function St(e, t) {
		for (bt[e] = t, e = 0; e < t.length; e++) yt.add(t[e]);
	}
	var Ct = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), wt = {}, Tt = {};
	function Et(e) {
		return xe.call(Tt, e) ? !0 : xe.call(wt, e) ? !1 : Ct.test(e) ? Tt[e] = !0 : (wt[e] = !0, !1);
	}
	function Dt(e, t, n) {
		if (Et(t)) {
			if (n === null) e.removeAttribute(t);
			else {
				switch (typeof n) {
					case "undefined":
					case "function":
					case "symbol":
						e.removeAttribute(t);
						return;
					case "boolean":
						var r = t.toLowerCase().slice(0, 5);
						if (r !== "data-" && r !== "aria-") {
							e.removeAttribute(t);
							return;
						}
				}
				e.setAttribute(t, "" + n);
			}
		}
	}
	function Ot(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function kt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function At(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function jt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Mt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Nt(e) {
		if (!e._valueTracker) {
			var t = jt(e) ? "checked" : "value";
			e._valueTracker = Mt(e, t, "" + e[t]);
		}
	}
	function Pt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = jt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Ft(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var It = /[\n"\\]/g;
	function Lt(e) {
		return e.replace(It, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Rt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + At(t)) : e.value !== "" + At(t) && (e.value = "" + At(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Bt(e, o, At(n)) : Bt(e, o, At(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + At(s) : e.removeAttribute("name");
	}
	function zt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Nt(e);
				return;
			}
			n = n == null ? "" : "" + At(n), t = t == null ? n : "" + At(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Nt(e);
	}
	function Bt(e, t, n) {
		t === "number" && Ft(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Vt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + At(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Ht(e, t, n) {
		if (t != null && (t = "" + At(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + At(n);
	}
	function Ut(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (k(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = At(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Nt(e);
	}
	function Wt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Gt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Kt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Gt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function qt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Kt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Kt(e, o, t[o]);
	}
	function Jt(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Yt = /* @__PURE__ */ new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), Xt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Zt(e) {
		return Xt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function Qt() {}
	var $t = null;
	function en(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var tn = null, nn = null;
	function rn(e) {
		var t = ht(e);
		if (t && (e = t.stateNode)) {
			var n = e[ot] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Rt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Lt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[ot] || null;
								if (!a) throw Error(i(90));
								Rt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Pt(r);
					}
					break a;
				case "textarea":
					Ht(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Vt(e, !!n.multiple, t, !1);
			}
		}
	}
	var an = !1;
	function on(e, t, n) {
		if (an) return e(t, n);
		an = !0;
		try {
			return e(t);
		} finally {
			if (an = !1, (tn !== null || nn !== null) && (bu(), tn && (t = tn, e = nn, nn = tn = null, rn(t), e))) for (t = 0; t < e.length; t++) rn(e[t]);
		}
	}
	function sn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[ot] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = e !== "button" && e !== "input" && e !== "select" && e !== "textarea"), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var cn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), ln = !1;
	if (cn) try {
		var un = {};
		Object.defineProperty(un, "passive", { get: function() {
			ln = !0;
		} }), window.addEventListener("test", un, un), window.removeEventListener("test", un, un);
	} catch {
		ln = !1;
	}
	var dn = null, fn = null, pn = null;
	function mn() {
		if (pn) return pn;
		var e, t = fn, n = t.length, r, i = "value" in dn ? dn.value : dn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return pn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function hn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function gn() {
		return !0;
	}
	function _n() {
		return !1;
	}
	function vn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? gn : _n, this.isPropagationStopped = _n, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = gn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = gn);
			},
			persist: function() {},
			isPersistent: gn
		}), t;
	}
	var yn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, bn = vn(yn), xn = h({}, yn, {
		view: 0,
		detail: 0
	}), Sn = vn(xn), Cn, wn, Tn, En = h({}, xn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Ln,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Tn && (Tn && e.type === "mousemove" ? (Cn = e.screenX - Tn.screenX, wn = e.screenY - Tn.screenY) : wn = Cn = 0, Tn = e), Cn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : wn;
		}
	}), Dn = vn(En), On = vn(h({}, En, { dataTransfer: 0 })), kn = vn(h({}, xn, { relatedTarget: 0 })), An = vn(h({}, yn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), jn = vn(h({}, yn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Mn = vn(h({}, yn, { data: 0 })), Nn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Pn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Fn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function In(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Fn[e]) ? !!t[e] : !1;
	}
	function Ln() {
		return In;
	}
	var Rn = vn(h({}, xn, {
		key: function(e) {
			if (e.key) {
				var t = Nn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = hn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Pn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Ln,
		charCode: function(e) {
			return e.type === "keypress" ? hn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? hn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), zn = vn(h({}, En, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Bn = vn(h({}, xn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Ln
	})), Vn = vn(h({}, yn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Hn = vn(h({}, En, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Un = vn(h({}, yn, {
		newState: 0,
		oldState: 0
	})), Wn = [
		9,
		13,
		27,
		32
	], Gn = cn && "CompositionEvent" in window, Kn = null;
	cn && "documentMode" in document && (Kn = document.documentMode);
	var qn = cn && "TextEvent" in window && !Kn, Jn = cn && (!Gn || Kn && 8 < Kn && 11 >= Kn), Yn = " ", Xn = !1;
	function Zn(e, t) {
		switch (e) {
			case "keyup": return Wn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function Qn(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var $n = !1;
	function er(e, t) {
		switch (e) {
			case "compositionend": return Qn(t);
			case "keypress": return t.which === 32 ? (Xn = !0, Yn) : null;
			case "textInput": return e = t.data, e === Yn && Xn ? null : e;
			default: return null;
		}
	}
	function tr(e, t) {
		if ($n) return e === "compositionend" || !Gn && Zn(e, t) ? (e = mn(), pn = fn = dn = null, $n = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Jn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var nr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function rr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!nr[e.type] : t === "textarea";
	}
	function ir(e, t, n, r) {
		tn ? nn ? nn.push(r) : nn = [r] : tn = r, t = Ed(t, "onChange"), 0 < t.length && (n = new bn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var ar = null, or = null;
	function sr(e) {
		yd(e, 0);
	}
	function cr(e) {
		if (Pt(gt(e))) return e;
	}
	function lr(e, t) {
		if (e === "change") return t;
	}
	var ur = !1;
	if (cn) {
		var dr;
		if (cn) {
			var fr = "oninput" in document;
			if (!fr) {
				var pr = document.createElement("div");
				pr.setAttribute("oninput", "return;"), fr = typeof pr.oninput == "function";
			}
			dr = fr;
		} else dr = !1;
		ur = dr && (!document.documentMode || 9 < document.documentMode);
	}
	function mr() {
		ar && (ar.detachEvent("onpropertychange", hr), or = ar = null);
	}
	function hr(e) {
		if (e.propertyName === "value" && cr(or)) {
			var t = [];
			ir(t, or, e, en(e)), on(sr, t);
		}
	}
	function gr(e, t, n) {
		e === "focusin" ? (mr(), ar = t, or = n, ar.attachEvent("onpropertychange", hr)) : e === "focusout" && mr();
	}
	function _r(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return cr(or);
	}
	function vr(e, t) {
		if (e === "click") return cr(t);
	}
	function yr(e, t) {
		if (e === "input" || e === "change") return cr(t);
	}
	function br(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var xr = typeof Object.is == "function" ? Object.is : br;
	function Sr(e, t) {
		if (xr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!xe.call(t, i) || !xr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Cr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function wr(e, t) {
		var n = Cr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Cr(n);
		}
	}
	function Tr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Tr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Er(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Ft(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Ft(e.document);
		}
		return t;
	}
	function Dr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Or = cn && "documentMode" in document && 11 >= document.documentMode, kr = null, Ar = null, jr = null, Mr = !1;
	function Nr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Mr || kr == null || kr !== Ft(r) || (r = kr, "selectionStart" in r && Dr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), jr && Sr(jr, r) || (jr = r, r = Ed(Ar, "onSelect"), 0 < r.length && (t = new bn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = kr)));
	}
	function Pr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Fr = {
		animationend: Pr("Animation", "AnimationEnd"),
		animationiteration: Pr("Animation", "AnimationIteration"),
		animationstart: Pr("Animation", "AnimationStart"),
		transitionrun: Pr("Transition", "TransitionRun"),
		transitionstart: Pr("Transition", "TransitionStart"),
		transitioncancel: Pr("Transition", "TransitionCancel"),
		transitionend: Pr("Transition", "TransitionEnd")
	}, Ir = {}, Lr = {};
	cn && (Lr = document.createElement("div").style, "AnimationEvent" in window || (delete Fr.animationend.animation, delete Fr.animationiteration.animation, delete Fr.animationstart.animation), "TransitionEvent" in window || delete Fr.transitionend.transition);
	function Rr(e) {
		if (Ir[e]) return Ir[e];
		if (!Fr[e]) return e;
		var t = Fr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Lr) return Ir[e] = t[n];
		return e;
	}
	var zr = Rr("animationend"), Br = Rr("animationiteration"), Vr = Rr("animationstart"), Hr = Rr("transitionrun"), Ur = Rr("transitionstart"), Wr = Rr("transitioncancel"), Gr = Rr("transitionend"), Kr = /* @__PURE__ */ new Map(), qr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	qr.push("scrollEnd");
	function Jr(e, t) {
		Kr.set(e, t), xt(t, [e]);
	}
	var Yr = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Xr = [], Zr = 0, Qr = 0;
	function $r() {
		for (var e = Zr, t = Qr = Zr = 0; t < e;) {
			var n = Xr[t];
			Xr[t++] = null;
			var r = Xr[t];
			Xr[t++] = null;
			var i = Xr[t];
			Xr[t++] = null;
			var a = Xr[t];
			if (Xr[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ri(n, i, a);
		}
	}
	function ei(e, t, n, r) {
		Xr[Zr++] = e, Xr[Zr++] = t, Xr[Zr++] = n, Xr[Zr++] = r, Qr |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ti(e, t, n, r) {
		return ei(e, t, n, r), ii(e);
	}
	function ni(e, t) {
		return ei(e, null, null, t), ii(e);
	}
	function ri(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ie(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ii(e) {
		if (50 < du) throw du = 0, fu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var ai = {};
	function oi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function si(e, t, n, r) {
		return new oi(e, t, n, r);
	}
	function ci(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function li(e, t) {
		var n = e.alternate;
		return n === null ? (n = si(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function ui(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function di(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") ci(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, de.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ne: return e = si(31, n, t, a), e.elementType = ne, e.lanes = o, e;
			case y: return fi(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = si(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case w: return e = si(13, n, t, a), e.elementType = w, e.lanes = o, e;
			case T: return e = si(19, n, t, a), e.elementType = T, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case S:
						s = 10;
						break a;
					case ee:
						s = 9;
						break a;
					case C:
						s = 11;
						break a;
					case te:
						s = 14;
						break a;
					case E:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = si(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function fi(e, t, n, r) {
		return e = si(7, e, r, t), e.lanes = n, e;
	}
	function pi(e, t, n) {
		return e = si(6, e, null, t), e.lanes = n, e;
	}
	function mi(e) {
		var t = si(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function hi(e, t, n) {
		return t = si(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var gi = /* @__PURE__ */ new WeakMap();
	function _i(e, t) {
		if (typeof e == "object" && e) {
			var n = gi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: be(t)
			}, gi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: be(t)
		};
	}
	var vi = [], yi = 0, bi = null, xi = 0, Si = [], Ci = 0, wi = null, Ti = 1, Ei = "";
	function Di(e, t) {
		vi[yi++] = xi, vi[yi++] = bi, bi = e, xi = t;
	}
	function Oi(e, t, n) {
		Si[Ci++] = Ti, Si[Ci++] = Ei, Si[Ci++] = wi, wi = e;
		var r = Ti;
		e = Ei;
		var i = 32 - Ie(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Ie(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ti = 1 << 32 - Ie(t) + i | n << i | r, Ei = a + e;
		} else Ti = 1 << a | n << i | r, Ei = e;
	}
	function ki(e) {
		e.return !== null && (Di(e, 1), Oi(e, 1, 0));
	}
	function Ai(e) {
		for (; e === bi;) bi = vi[--yi], vi[yi] = null, xi = vi[--yi], vi[yi] = null;
		for (; e === wi;) wi = Si[--Ci], Si[Ci] = null, Ei = Si[--Ci], Si[Ci] = null, Ti = Si[--Ci], Si[Ci] = null;
	}
	function ji(e, t) {
		Si[Ci++] = Ti, Si[Ci++] = Ei, Si[Ci++] = wi, Ti = t.id, Ei = t.overflow, wi = e;
	}
	var Mi = null, B = null, V = !1, Ni = null, Pi = !1, Fi = Error(i(519));
	function Ii(e) {
		throw Hi(_i(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Fi;
	}
	function Li(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[at] = e, t[ot] = r, n) {
			case "dialog":
				Q("cancel", t), Q("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				Q("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < _d.length; n++) Q(_d[n], t);
				break;
			case "source":
				Q("error", t);
				break;
			case "img":
			case "image":
			case "link":
				Q("error", t), Q("load", t);
				break;
			case "details":
				Q("toggle", t);
				break;
			case "input":
				Q("invalid", t), zt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), Ut(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Md(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = Qt), t = !0) : t = !1, t || Ii(e, !0);
	}
	function Ri(e) {
		for (Mi = e.return; Mi;) switch (Mi.tag) {
			case 5:
			case 31:
			case 13:
				Pi = !1;
				return;
			case 27:
			case 3:
				Pi = !0;
				return;
			default: Mi = Mi.return;
		}
	}
	function zi(e) {
		if (e !== Mi) return !1;
		if (!V) return Ri(e), V = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || Ud(e.type, e.memoizedProps)), n = !n), n && B && Ii(e), Ri(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			B = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			B = uf(e);
		} else t === 27 ? (t = B, Zd(e.type) ? (e = lf, lf = null, B = e) : B = t) : B = Mi ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Bi() {
		B = Mi = null, V = !1;
	}
	function Vi() {
		var e = Ni;
		return e !== null && (Zl === null ? Zl = e : Zl.push.apply(Zl, e), Ni = null), e;
	}
	function Hi(e) {
		Ni === null ? Ni = [e] : Ni.push(e);
	}
	var Ui = le(null), Wi = null, Gi = null;
	function Ki(e, t, n) {
		M(Ui, t._currentValue), t._currentValue = n;
	}
	function qi(e) {
		e._currentValue = Ui.current, ue(Ui);
	}
	function Ji(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Yi(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Ji(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Ji(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Xi(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					xr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === me.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Yi(t, e, n, r), t.flags |= 262144;
	}
	function Zi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!xr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Qi(e) {
		Wi = e, Gi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function $i(e) {
		return ta(Wi, e);
	}
	function ea(e, t) {
		return Wi === null && Qi(e), ta(e, t);
	}
	function ta(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Gi === null) {
			if (e === null) throw Error(i(308));
			Gi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Gi = Gi.next = t;
		return n;
	}
	var na = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, ra = t.unstable_scheduleCallback, ia = t.unstable_NormalPriority, aa = {
		$$typeof: S,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function oa() {
		return {
			controller: new na(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function sa(e) {
		e.refCount--, e.refCount === 0 && ra(ia, function() {
			e.controller.abort();
		});
	}
	var ca = null, la = 0, ua = 0, da = null;
	function fa(e, t) {
		if (ca === null) {
			var n = ca = [];
			la = 0, ua = dd(), da = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return la++, t.then(pa, pa), t;
	}
	function pa() {
		if (--la === 0 && ca !== null) {
			da !== null && (da.status = "fulfilled");
			var e = ca;
			ca = null, ua = 0, da = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ma(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var ha = A.S;
	A.S = function(e, t) {
		eu = R(), typeof t == "object" && t && typeof t.then == "function" && fa(e, t), ha !== null && ha(e, t);
	};
	var ga = le(null);
	function _a() {
		var e = ga.current;
		return e === null ? q.pooledCache : e;
	}
	function va(e, t) {
		t === null ? M(ga, ga.current) : M(ga, t.pool);
	}
	function ya() {
		var e = _a();
		return e === null ? null : {
			parent: aa._currentValue,
			pool: e
		};
	}
	var ba = Error(i(460)), xa = Error(i(474)), Sa = Error(i(542)), Ca = { then: function() {} };
	function wa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Ta(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Qt, Qt), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, ka(e), e;
			default:
				if (typeof t.status == "string") t.then(Qt, Qt);
				else {
					if (e = q, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, ka(e), e;
				}
				throw Da = t, ba;
		}
	}
	function Ea(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Da = e, ba) : e;
		}
	}
	var Da = null;
	function Oa() {
		if (Da === null) throw Error(i(459));
		var e = Da;
		return Da = null, e;
	}
	function ka(e) {
		if (e === ba || e === Sa) throw Error(i(483));
	}
	var Aa = null, ja = 0;
	function Ma(e) {
		var t = ja;
		return ja += 1, Aa === null && (Aa = []), Ta(Aa, e, t);
	}
	function Na(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Pa(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Fa(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = li(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = pi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === E && Ea(i) === t.type) ? (t = a(t, n.props), Na(t, n), t.return = e, t) : (t = di(n.type, n.key, n.props, null, e.mode, r), Na(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = hi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = fi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = pi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = di(t.type, t.key, t.props, null, e.mode, n), Na(n, t), n.return = e, n;
					case v: return t = hi(t, e.mode, n), t.return = e, t;
					case E: return t = Ea(t), f(e, t, n);
				}
				if (k(t) || ie(t)) return t = fi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ma(t), n);
				if (t.$$typeof === S) return f(e, ea(e, t), n);
				Pa(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case E: return n = Ea(n), p(e, t, n, r);
				}
				if (k(n) || ie(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ma(n), r);
				if (n.$$typeof === S) return p(e, t, ea(e, n), r);
				Pa(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case E: return r = Ea(r), m(e, t, n, r, i);
				}
				if (k(r) || ie(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ma(r), i);
				if (r.$$typeof === S) return m(e, t, n, ea(t, r), i);
				Pa(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), V && Di(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return V && Di(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), V && Di(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), V && Di(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return V && Di(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), V && Di(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === E && Ea(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Na(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === y ? (c = fi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = di(o.type, o.key, o.props, null, e.mode, c), Na(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) {
									if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
										n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							c = hi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case E: return o = Ea(o), b(e, r, o, c);
				}
				if (k(o)) return h(e, r, o, c);
				if (ie(o)) {
					if (l = ie(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Ma(o), c);
				if (o.$$typeof === S) return b(e, r, ea(e, o), c);
				Pa(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = pi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				ja = 0;
				var i = b(e, t, n, r);
				return Aa = null, i;
			} catch (t) {
				if (t === ba || t === Sa) throw t;
				var a = si(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Ia = Fa(!0), La = Fa(!1), Ra = !1;
	function za(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Ba(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Va(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ha(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, K & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ii(e), ri(e, null, n), t;
		}
		return ei(e, r, t, n), ii(e);
	}
	function Ua(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Qe(e, n);
		}
	}
	function Wa(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ga = !1;
	function Ka() {
		if (Ga) {
			var e = da;
			if (e !== null) throw e;
		}
	}
	function qa(e, t, n, r) {
		Ga = !1;
		var i = e.updateQueue;
		Ra = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (Y & f) === f : (r & f) === f) {
					f !== 0 && f === ua && (Ga = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (m = g.payload, typeof m == "function") {
									d = m.call(_, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = g.payload, f = typeof m == "function" ? m.call(_, d, f) : m, f == null) break a;
								d = h({}, d, f);
								break a;
							case 2: Ra = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Gl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ja(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Ya(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ja(n[e], t);
	}
	var Xa = le(null), Za = le(0);
	function Qa(e, t) {
		e = Ul, M(Za, e), M(Xa, t), Ul = e | t.baseLanes;
	}
	function $a() {
		M(Za, Ul), M(Xa, Xa.current);
	}
	function eo() {
		Ul = Za.current, ue(Xa), ue(Za);
	}
	var to = le(null), no = null;
	function ro(e) {
		var t = e.alternate;
		M(co, co.current & 1), M(to, e), no === null && (t === null || Xa.current !== null || t.memoizedState !== null) && (no = e);
	}
	function io(e) {
		M(co, co.current), M(to, e), no === null && (no = e);
	}
	function ao(e) {
		e.tag === 22 ? (M(co, co.current), M(to, e), no === null && (no = e)) : oo(e);
	}
	function oo() {
		M(co, co.current), M(to, to.current);
	}
	function so(e) {
		ue(to), no === e && (no = null), ue(co);
	}
	var co = le(0);
	function lo(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var uo = 0, H = null, U = null, fo = null, po = !1, mo = !1, ho = !1, go = 0, _o = 0, vo = null, yo = 0;
	function bo() {
		throw Error(i(321));
	}
	function xo(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!xr(e[n], t[n])) return !1;
		return !0;
	}
	function So(e, t, n, r, i, a) {
		return uo = a, H = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = e === null || e.memoizedState === null ? zs : Bs, ho = !1, a = n(r, i), ho = !1, mo && (a = wo(t, n, r, i)), Co(e), a;
	}
	function Co(e) {
		A.H = Rs;
		var t = U !== null && U.next !== null;
		if (uo = 0, fo = U = H = null, po = !1, _o = 0, vo = null, t) throw Error(i(300));
		e === null || rc || (e = e.dependencies, e !== null && Zi(e) && (rc = !0));
	}
	function wo(e, t, n, r) {
		H = e;
		var a = 0;
		do {
			if (mo && (vo = null), _o = 0, mo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, fo = U = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			A.H = Vs, o = t(n, r);
		} while (mo);
		return o;
	}
	function To() {
		var e = A.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Mo(t) : t, e = e.useState()[0], (U === null ? null : U.memoizedState) !== e && (H.flags |= 1024), t;
	}
	function Eo() {
		var e = go !== 0;
		return go = 0, e;
	}
	function Do(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Oo(e) {
		if (po) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			po = !1;
		}
		uo = 0, fo = U = H = null, mo = !1, _o = go = 0, vo = null;
	}
	function ko() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return fo === null ? H.memoizedState = fo = e : fo = fo.next = e, fo;
	}
	function Ao() {
		if (U === null) {
			var e = H.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = U.next;
		var t = fo === null ? H.memoizedState : fo.next;
		if (t !== null) fo = t, U = e;
		else {
			if (e === null) throw H.alternate === null ? Error(i(467)) : Error(i(310));
			U = e, e = {
				memoizedState: U.memoizedState,
				baseState: U.baseState,
				baseQueue: U.baseQueue,
				queue: U.queue,
				next: null
			}, fo === null ? H.memoizedState = fo = e : fo = fo.next = e;
		}
		return fo;
	}
	function jo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Mo(e) {
		var t = _o;
		return _o += 1, vo === null && (vo = []), e = Ta(vo, e, t), t = H, (fo === null ? t.memoizedState : fo.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? zs : Bs), e;
	}
	function No(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Mo(e);
			if (e.$$typeof === S) return $i(e);
		}
		throw Error(i(438, String(e)));
	}
	function Po(e) {
		var t = null, n = H.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = H.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = jo(), H.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = D;
		return t.index++, n;
	}
	function Fo(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Io(e) {
		return Lo(Ao(), U, e);
	}
	function Lo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (uo & f) === f : (Y & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ua && (d = !0);
					else if ((uo & p) === p) {
						u = u.next, p === ua && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, H.lanes |= p, Gl |= p;
					f = u.action, ho && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, H.lanes |= f, Gl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !xr(o, e.memoizedState) && (rc = !0, d && (n = da, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Ro(e) {
		var t = Ao(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			xr(o, t.memoizedState) || (rc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function zo(e, t, n) {
		var r = H, a = Ao(), o = V;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !xr((U || a).memoizedState, n);
		if (s && (a.memoizedState = n, rc = !0), a = a.queue, us(Ho.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || fo !== null && fo.memoizedState.tag & 1) {
			if (r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, a, n, t), null), q === null) throw Error(i(349));
			o || uo & 127 || Bo(r, t, n);
		}
		return n;
	}
	function Bo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = H.updateQueue, t === null ? (t = jo(), H.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Vo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Uo(t) && Wo(e);
	}
	function Ho(e, t, n) {
		return n(function() {
			Uo(t) && Wo(e);
		});
	}
	function Uo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !xr(e, n);
		} catch {
			return !0;
		}
	}
	function Wo(e) {
		var t = ni(e, 2);
		t !== null && hu(t, e, 2);
	}
	function Go(e) {
		var t = ko();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), ho) {
				Fe(!0);
				try {
					n();
				} finally {
					Fe(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Fo,
			lastRenderedState: e
		}, t;
	}
	function Ko(e, t, n, r) {
		return e.baseState = n, Lo(e, U, typeof r == "function" ? r : Fo);
	}
	function qo(e, t, n, r, a) {
		if (Fs(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			A.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Jo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Jo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = A.T, o = {};
			A.T = o;
			try {
				var s = n(i, r), c = A.S;
				c !== null && c(o, s), Yo(e, t, s);
			} catch (n) {
				Zo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), A.T = a;
			}
		} else try {
			a = n(i, r), Yo(e, t, a);
		} catch (n) {
			Zo(e, t, n);
		}
	}
	function Yo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Xo(e, t, n);
		}, function(n) {
			return Zo(e, t, n);
		}) : Xo(e, t, n);
	}
	function Xo(e, t, n) {
		t.status = "fulfilled", t.value = n, Qo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Jo(e, n)));
	}
	function Zo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Qo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Qo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function $o(e, t) {
		return t;
	}
	function es(e, t) {
		if (V) {
			var n = q.formState;
			if (n !== null) {
				a: {
					var r = H;
					if (V) {
						if (B) {
							b: {
								for (var i = B, a = Pi; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = cf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								B = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Ii(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = ko(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: $o,
			lastRenderedState: t
		}, n.queue = r, n = Ms.bind(null, H, r), r.dispatch = n, r = Go(!1), a = Ps.bind(null, H, !1, r.queue), r = ko(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = qo.bind(null, H, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function ts(e) {
		return ns(Ao(), U, e);
	}
	function ns(e, t, n) {
		if (t = Lo(e, t, $o)[0], e = Io(Fo)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Mo(t);
		} catch (e) {
			throw e === ba ? Sa : e;
		}
		else r = t;
		t = Ao();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (H.flags |= 2048, as(9, { destroy: void 0 }, rs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function rs(e, t) {
		e.action = t;
	}
	function is(e) {
		var t = Ao(), n = U;
		if (n !== null) return ns(t, n, e);
		Ao(), t = t.memoizedState, n = Ao();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function as(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = H.updateQueue, t === null && (t = jo(), H.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function os() {
		return Ao().memoizedState;
	}
	function ss(e, t, n, r) {
		var i = ko();
		H.flags |= e, i.memoizedState = as(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function cs(e, t, n, r) {
		var i = Ao();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		U !== null && r !== null && xo(r, U.memoizedState.deps) ? i.memoizedState = as(t, a, n, r) : (H.flags |= e, i.memoizedState = as(1 | t, a, n, r));
	}
	function ls(e, t) {
		ss(8390656, 8, e, t);
	}
	function us(e, t) {
		cs(2048, 8, e, t);
	}
	function ds(e) {
		H.flags |= 4;
		var t = H.updateQueue;
		if (t === null) t = jo(), H.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function fs(e) {
		var t = Ao().memoizedState;
		return ds({
			ref: t,
			nextImpl: e
		}), function() {
			if (K & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ps(e, t) {
		return cs(4, 2, e, t);
	}
	function ms(e, t) {
		return cs(4, 4, e, t);
	}
	function hs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function gs(e, t, n) {
		n = n == null ? null : n.concat([e]), cs(4, 4, hs.bind(null, t, e), n);
	}
	function _s() {}
	function vs(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && xo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ys(e, t) {
		var n = Ao();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && xo(t, r[1])) return r[0];
		if (r = e(), ho) {
			Fe(!0);
			try {
				e();
			} finally {
				Fe(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function bs(e, t, n) {
		return n === void 0 || uo & 1073741824 && !(Y & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = mu(), H.lanes |= e, Gl |= e, n);
	}
	function xs(e, t, n, r) {
		return xr(n, t) ? n : Xa.current === null ? !(uo & 42) || uo & 1073741824 && !(Y & 261930) ? (rc = !0, e.memoizedState = n) : (e = mu(), H.lanes |= e, Gl |= e, t) : (e = bs(e, n, r), xr(e, t) || (rc = !0), e);
	}
	function Ss(e, t, n, r, i) {
		var a = j.p;
		j.p = a !== 0 && 8 > a ? a : 8;
		var o = A.T, s = {};
		A.T = s, Ps(e, !1, t, n);
		try {
			var c = i(), l = A.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Ns(e, t, ma(c, r), pu(e)) : Ns(e, t, r, pu(e));
		} catch (n) {
			Ns(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, pu());
		} finally {
			j.p = a, o !== null && s.types !== null && (o.types = s.types), A.T = o;
		}
	}
	function Cs() {}
	function ws(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = Ts(e).queue;
		Ss(e, a, t, oe, n === null ? Cs : function() {
			return Es(e), n(r);
		});
	}
	function Ts(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: oe,
			baseState: oe,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: oe
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Fo,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Es(e) {
		var t = Ts(e);
		t.next === null && (t = e.alternate.memoizedState), Ns(e, t.next.queue, {}, pu());
	}
	function Ds() {
		return $i(Qf);
	}
	function Os() {
		return Ao().memoizedState;
	}
	function ks() {
		return Ao().memoizedState;
	}
	function As(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = pu();
					e = Va(n);
					var r = Ha(t, e, n);
					r !== null && (hu(r, t, n), Ua(r, t, n)), t = { cache: oa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function js(e, t, n) {
		var r = pu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e) ? Is(t, n) : (n = ti(e, t, n, r), n !== null && (hu(n, e, r), Ls(n, t, r)));
	}
	function Ms(e, t, n) {
		Ns(e, t, n, pu());
	}
	function Ns(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Fs(e)) Is(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, xr(s, o)) return ei(e, t, i, 0), q === null && $r(), !1;
			} catch {}
			if (n = ti(e, t, i, r), n !== null) return hu(n, e, r), Ls(n, t, r), !0;
		}
		return !1;
	}
	function Ps(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: dd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Fs(e)) {
			if (t) throw Error(i(479));
		} else t = ti(e, n, r, 2), t !== null && hu(t, e, 2);
	}
	function Fs(e) {
		var t = e.alternate;
		return e === H || t !== null && t === H;
	}
	function Is(e, t) {
		mo = po = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Ls(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Qe(e, n);
		}
	}
	var Rs = {
		readContext: $i,
		use: No,
		useCallback: bo,
		useContext: bo,
		useEffect: bo,
		useImperativeHandle: bo,
		useLayoutEffect: bo,
		useInsertionEffect: bo,
		useMemo: bo,
		useReducer: bo,
		useRef: bo,
		useState: bo,
		useDebugValue: bo,
		useDeferredValue: bo,
		useTransition: bo,
		useSyncExternalStore: bo,
		useId: bo,
		useHostTransitionStatus: bo,
		useFormState: bo,
		useActionState: bo,
		useOptimistic: bo,
		useMemoCache: bo,
		useCacheRefresh: bo
	};
	Rs.useEffectEvent = bo;
	var zs = {
		readContext: $i,
		use: No,
		useCallback: function(e, t) {
			return ko().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: $i,
		useEffect: ls,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), ss(4194308, 4, hs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ss(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			ss(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = ko();
			t = t === void 0 ? null : t;
			var r = e();
			if (ho) {
				Fe(!0);
				try {
					e();
				} finally {
					Fe(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = ko();
			if (n !== void 0) {
				var i = n(t);
				if (ho) {
					Fe(!0);
					try {
						n(t);
					} finally {
						Fe(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = js.bind(null, H, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = ko();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Go(e);
			var t = e.queue, n = Ms.bind(null, H, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return bs(ko(), e, t);
		},
		useTransition: function() {
			var e = Go(!1);
			return e = Ss.bind(null, H, e.queue, !0, !1), ko().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = H, a = ko();
			if (V) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), q === null) throw Error(i(349));
				Y & 127 || Bo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ls(Ho.bind(null, r, o, e), [e]), r.flags |= 2048, as(9, { destroy: void 0 }, Vo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = ko(), t = q.identifierPrefix;
			if (V) {
				var n = Ei, r = Ti;
				n = (r & ~(1 << 32 - Ie(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = go++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = yo++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ds,
		useFormState: es,
		useActionState: es,
		useOptimistic: function(e) {
			var t = ko();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Ps.bind(null, H, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Po,
		useCacheRefresh: function() {
			return ko().memoizedState = As.bind(null, H);
		},
		useEffectEvent: function(e) {
			var t = ko(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (K & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Bs = {
		readContext: $i,
		use: No,
		useCallback: vs,
		useContext: $i,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Io,
		useRef: os,
		useState: function() {
			return Io(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			return xs(Ao(), U.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Io(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: ts,
		useActionState: ts,
		useOptimistic: function(e, t) {
			return Ko(Ao(), U, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Bs.useEffectEvent = fs;
	var Vs = {
		readContext: $i,
		use: No,
		useCallback: vs,
		useContext: $i,
		useEffect: us,
		useImperativeHandle: gs,
		useInsertionEffect: ps,
		useLayoutEffect: ms,
		useMemo: ys,
		useReducer: Ro,
		useRef: os,
		useState: function() {
			return Ro(Fo);
		},
		useDebugValue: _s,
		useDeferredValue: function(e, t) {
			var n = Ao();
			return U === null ? bs(n, e, t) : xs(n, U.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Ro(Fo)[0], t = Ao().memoizedState;
			return [typeof e == "boolean" ? e : Mo(e), t];
		},
		useSyncExternalStore: zo,
		useId: Os,
		useHostTransitionStatus: Ds,
		useFormState: is,
		useActionState: is,
		useOptimistic: function(e, t) {
			var n = Ao();
			return U === null ? (n.baseState = e, [e, n.queue.dispatch]) : Ko(n, U, e, t);
		},
		useMemoCache: Po,
		useCacheRefresh: ks
	};
	Vs.useEffectEvent = fs;
	function Hs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Us = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Va(r);
			i.payload = t, n != null && (i.callback = n), t = Ha(e, i, r), t !== null && (hu(t, e, r), Ua(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = pu(), i = Va(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ha(e, i, r), t !== null && (hu(t, e, r), Ua(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = pu(), r = Va(n);
			r.tag = 2, t != null && (r.callback = t), t = Ha(e, r, n), t !== null && (hu(t, e, n), Ua(t, e, n));
		}
	};
	function Ws(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Sr(n, r) || !Sr(i, a) : !0;
	}
	function Gs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Us.enqueueReplaceState(t, t.state, null);
	}
	function Ks(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function qs(e) {
		Yr(e);
	}
	function Js(e) {
		console.error(e);
	}
	function Ys(e) {
		Yr(e);
	}
	function Xs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Zs(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Qs(e, t, n) {
		return n = Va(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Xs(e, t);
		}, n;
	}
	function $s(e) {
		return e = Va(e), e.tag = 3, e;
	}
	function ec(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Zs(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Zs(t, n, r), typeof i != "function" && (ru === null ? ru = /* @__PURE__ */ new Set([this]) : ru.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function tc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Xi(t, n, a, !0), n = to.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return no === null ? Du() : n.alternate === null && Wl === 0 && (Wl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Gu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Gu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Gu(e, r, a), Du(), !1;
		}
		if (V) return t = to.current, t === null ? (r !== Fi && (t = Error(i(423), { cause: r }), Hi(_i(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = _i(r, n), a = Qs(e.stateNode, r, a), Wa(e, a), Wl !== 4 && (Wl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Fi && (e = Error(i(422), { cause: r }), Hi(_i(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = _i(o, n), Xl === null ? Xl = [o] : Xl.push(o), Wl !== 4 && (Wl = 2), t === null) return !0;
		r = _i(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Qs(n.stateNode, r, e), Wa(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (ru === null || !ru.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = $s(a), ec(a, e, n, r), Wa(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var nc = Error(i(461)), rc = !1;
	function ic(e, t, n, r) {
		t.child = e === null ? La(t, null, n, r) : Ia(t, e.child, n, r);
	}
	function ac(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Qi(t), r = So(e, t, n, o, a, i), s = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (V && s && ki(t), t.flags |= 1, ic(e, t, r, i), t.child);
	}
	function oc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !ci(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, sc(e, t, a, r, i)) : (e = di(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Ac(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Sr : n, n(o, r) && e.ref === t.ref) return kc(e, t, i);
		}
		return t.flags |= 1, e = li(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function sc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Sr(a, r) && e.ref === t.ref) {
				if (rc = !1, t.pendingProps = r = a, Ac(e, i)) e.flags & 131072 && (rc = !0);
				else return t.lanes = e.lanes, kc(e, t, i);
			}
		}
		return hc(e, t, n, r, i);
	}
	function cc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return uc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && va(t, a === null ? null : a.cachePool), a === null ? $a() : Qa(t, a), ao(t);
			else return r = t.lanes = 536870912, uc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && va(t, null), $a(), oo(t)) : (va(t, a.cachePool), Qa(t, a), oo(t), t.memoizedState = null);
		return ic(e, t, i, n), t.child;
	}
	function lc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function uc(e, t, n, r, i) {
		var a = _a();
		return a = a === null ? null : {
			parent: aa._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && va(t, null), $a(), ao(t), e !== null && Xi(e, t, r, !0), t.childLanes = i, null;
	}
	function dc(e, t) {
		return t = wc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function fc(e, t, n) {
		return Ia(t, e.child, null, n), e = dc(t, t.pendingProps), e.flags |= 2, so(t), t.memoizedState = null, e;
	}
	function pc(e, t, n) {
		var r = t.pendingProps, a = !!(t.flags & 128);
		if (t.flags &= -129, e === null) {
			if (V) {
				if (r.mode === "hidden") return e = dc(t, r), t.lanes = 536870912, lc(null, e);
				if (io(t), (e = B) ? (e = rf(e, Pi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, B = null)) : e = null, e === null) throw Ii(t);
				return t.lanes = 536870912, null;
			}
			return dc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (io(t), a) {
				if (t.flags & 256) t.flags &= -257, t = fc(e, t, n);
				else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
				else throw Error(i(558));
			} else if (rc || Xi(e, t, n, !1), a = (n & e.childLanes) !== 0, rc || a) {
				if (r = q, r !== null && (s = $e(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, ni(e, s), hu(r, e, s), nc;
				Du(), t = fc(e, t, n);
			} else e = o.treeContext, B = cf(s.nextSibling), Mi = t, V = !0, Ni = null, Pi = !1, e !== null && ji(t, e), t = dc(t, r), t.flags |= 4096;
			return t;
		}
		return e = li(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function mc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function hc(e, t, n, r, i) {
		return Qi(t), n = So(e, t, n, r, void 0, i), r = Eo(), e !== null && !rc ? (Do(e, t, i), kc(e, t, i)) : (V && r && ki(t), t.flags |= 1, ic(e, t, n, i), t.child);
	}
	function gc(e, t, n, r, i, a) {
		return Qi(t), t.updateQueue = null, n = wo(t, r, n, i), Co(e), r = Eo(), e !== null && !rc ? (Do(e, t, a), kc(e, t, a)) : (V && r && ki(t), t.flags |= 1, ic(e, t, n, a), t.child);
	}
	function _c(e, t, n, r, i) {
		if (Qi(t), t.stateNode === null) {
			var a = ai, o = n.contextType;
			typeof o == "object" && o && (a = $i(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Us, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, za(t), o = n.contextType, a.context = typeof o == "object" && o ? $i(o) : ai, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Hs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Us.enqueueReplaceState(a, a.state, null), qa(t, r, a, i), Ka(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Ks(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ai, typeof u == "object" && u && (o = $i(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Gs(t, a, r, o), Ra = !1;
			var f = t.memoizedState;
			a.state = f, qa(t, r, a, i), Ka(), l = t.memoizedState, s || f !== l || Ra ? (typeof d == "function" && (Hs(t, n, d, r), l = t.memoizedState), (c = Ra || Ws(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ba(e, t), o = t.memoizedProps, u = Ks(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ai, typeof l == "object" && l && (c = $i(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Gs(t, a, r, c), Ra = !1, f = t.memoizedState, a.state = f, qa(t, r, a, i), Ka();
			var p = t.memoizedState;
			o !== d || f !== p || Ra || e !== null && e.dependencies !== null && Zi(e.dependencies) ? (typeof s == "function" && (Hs(t, n, s, r), p = t.memoizedState), (u = Ra || Ws(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Zi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, mc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ia(t, e.child, null, i), t.child = Ia(t, null, n, i)) : ic(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = kc(e, t, i), e;
	}
	function vc(e, t, n, r) {
		return Bi(), t.flags |= 256, ic(e, t, n, r), t.child;
	}
	var yc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function bc(e) {
		return {
			baseLanes: e,
			cachePool: ya()
		};
	}
	function xc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Jl), e;
	}
	function Sc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(co.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (V) {
				if (a ? ro(t) : oo(t), (e = B) ? (e = rf(e, Pi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: wi === null ? null : {
						id: Ti,
						overflow: Ei
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = mi(e), n.return = t, t.child = n, Mi = t, B = null)) : e = null, e === null) throw Ii(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (oo(t), a = t.mode, c = wc({
				mode: "hidden",
				children: c
			}, a), r = fi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(null, r)) : (ro(t), Cc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (ro(t), t.flags &= -257, t = Tc(e, t, n)) : t.memoizedState === null ? (oo(t), c = r.fallback, a = t.mode, r = wc({
				mode: "visible",
				children: r.children
			}, a), c = fi(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ia(t, e.child, null, n), r = t.child, r.memoizedState = bc(n), r.childLanes = xc(e, s, n), t.memoizedState = yc, t = lc(null, r)) : (oo(t), t.child = e.child, t.flags |= 128, t = null);
			else if (ro(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Hi({
					value: r,
					source: null,
					stack: null
				}), t = Tc(e, t, n);
			} else if (rc || Xi(e, t, n, !1), s = (n & e.childLanes) !== 0, rc || s) {
				if (s = q, s !== null && (r = $e(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, ni(e, r), hu(s, e, r), nc;
				af(c) || Du(), t = Tc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, B = cf(c.nextSibling), Mi = t, V = !0, Ni = null, Pi = !1, e !== null && ji(t, e), t = Cc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (oo(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = li(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = fi(c, a, n, null), c.flags |= 2) : c = li(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, lc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = bc(n) : (a = c.cachePool, a === null ? a = ya() : (l = aa._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = xc(e, s, n), t.memoizedState = yc, lc(e.child, r)) : (ro(t), n = e.child, e = n.sibling, n = li(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Cc(e, t) {
		return t = wc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function wc(e, t) {
		return e = si(22, e, null, t), e.lanes = 0, e;
	}
	function Tc(e, t, n) {
		return Ia(t, e.child, null, n), e = Cc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ec(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ji(e.return, t, n);
	}
	function Dc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Oc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = co.current, s = !!(o & 2);
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, M(co, o), ic(e, t, r, n), r = V ? xi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Ec(e, n, t);
			else if (e.tag === 19) Ec(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && lo(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Dc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && lo(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Dc(t, !0, n, null, a, r);
				break;
			case "together":
				Dc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function kc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Gl |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if (Xi(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = li(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = li(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Ac(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Zi(e)));
	}
	function jc(e, t, n) {
		switch (t.tag) {
			case 3:
				he(t, t.stateNode.containerInfo), Ki(t, aa, e.memoizedState.cache), Bi();
				break;
			case 27:
			case 5:
				N(t);
				break;
			case 4:
				he(t, t.stateNode.containerInfo);
				break;
			case 10:
				Ki(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, io(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (ro(t), e = kc(e, t, n), e === null ? null : e.sibling) : Sc(e, t, n) : (ro(t), t.flags |= 128, null);
				ro(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Xi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return Oc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), M(co, co.current), r) break;
				return null;
			case 22: return t.lanes = 0, cc(e, t, n, t.pendingProps);
			case 24: Ki(t, aa, e.memoizedState.cache);
		}
		return kc(e, t, n);
	}
	function Mc(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) rc = !0;
			else {
				if (!Ac(e, n) && !(t.flags & 128)) return rc = !1, jc(e, t, n);
				rc = !!(e.flags & 131072);
			}
		} else rc = !1, V && t.flags & 1048576 && Oi(t, xi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ea(t.elementType), t.type = e, typeof e == "function") ci(e) ? (r = Ks(e, r), t.tag = 1, t = _c(null, t, e, r, n)) : (t.tag = 0, t = hc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === C) {
								t.tag = 11, t = ac(null, t, e, r, n);
								break a;
							}
							if (a === te) {
								t.tag = 14, t = oc(null, t, e, r, n);
								break a;
							}
						}
						throw t = O(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return hc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Ks(r, t.pendingProps), _c(e, t, r, a, n);
			case 3:
				a: {
					if (he(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ba(e, t), qa(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Ki(t, aa, r), r !== o.cache && Yi(t, [aa], n, !0), Ka(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = vc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = _i(Error(i(424)), t), Hi(a), t = vc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (B = cf(e.firstChild), Mi = t, V = !0, Ni = null, Pi = !0, n = La(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Bi(), r === a) {
							t = kc(e, t, n);
							break a;
						}
						ic(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return mc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : V || (n = t.type, e = t.pendingProps, r = Bd(pe.current).createElement(n), r[at] = t, r[ot] = e, Pd(r, n, e), vt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return N(t), e === null && V && (r = t.stateNode = ff(t.type, t.pendingProps, pe.current), Mi = t, Pi = !0, a = B, Zd(t.type) ? (lf = a, B = cf(r.firstChild)) : B = a), ic(e, t, t.pendingProps.children, n), mc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && V && ((a = r = B) && (r = tf(r, t.type, t.pendingProps, Pi), r === null ? a = !1 : (t.stateNode = r, Mi = t, B = cf(r.firstChild), Pi = !1, a = !0)), a || Ii(t)), N(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = So(e, t, To, null, null, n), Qf._currentValue = a), mc(e, t), ic(e, t, r, n), t.child;
			case 6: return e === null && V && ((e = n = B) && (n = nf(n, t.pendingProps, Pi), n === null ? e = !1 : (t.stateNode = n, Mi = t, B = null, e = !0)), e || Ii(t)), null;
			case 13: return Sc(e, t, n);
			case 4: return he(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ia(t, null, r, n) : ic(e, t, r, n), t.child;
			case 11: return ac(e, t, t.type, t.pendingProps, n);
			case 7: return ic(e, t, t.pendingProps, n), t.child;
			case 8: return ic(e, t, t.pendingProps.children, n), t.child;
			case 12: return ic(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Ki(t, t.type, r.value), ic(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Qi(t), a = $i(a), r = r(a), t.flags |= 1, ic(e, t, r, n), t.child;
			case 14: return oc(e, t, t.type, t.pendingProps, n);
			case 15: return sc(e, t, t.type, t.pendingProps, n);
			case 19: return Oc(e, t, n);
			case 31: return pc(e, t, n);
			case 22: return cc(e, t, n, t.pendingProps);
			case 24: return Qi(t), r = $i(aa), e === null ? (a = _a(), a === null && (a = q, o = oa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, za(t), Ki(t, aa, a)) : ((e.lanes & n) !== 0 && (Ba(e, t), qa(t, null, null, n), Ka()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Ki(t, aa, r), r !== a.cache && Yi(t, [aa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Ki(t, aa, r))), ic(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Nc(e) {
		e.flags |= 4;
	}
	function Pc(e, t, n, r, i) {
		if ((t = !!(e.mode & 32)) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) {
				if (e.stateNode.complete) e.flags |= 8192;
				else if (wu()) e.flags |= 8192;
				else throw Da = Ca, xa;
			}
		} else e.flags &= -16777217;
	}
	function Fc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) {
			if (wu()) e.flags |= 8192;
			else throw Da = Ca, xa;
		}
	}
	function Ic(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : qe(), e.lanes |= t, Yl |= t);
	}
	function Lc(e, t) {
		if (!V) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function W(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Rc(e, t, n) {
		var r = t.pendingProps;
		switch (Ai(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return W(t), null;
			case 1: return W(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), qi(aa), ge(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (zi(t) ? Nc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Vi())), W(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Nc(t), o === null ? (W(t), Pc(t, a, null, r, n)) : (W(t), Fc(t, o))) : o ? o === e.memoizedState ? (W(t), t.flags &= -16777217) : (Nc(t), W(t), Fc(t, o)) : (e = e.memoizedProps, e !== r && Nc(t), W(t), Pc(t, a, e, r, n)), null;
			case 27:
				if (P(t), n = pe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return W(t), null;
					}
					e = de.current, zi(t) ? Li(t, e) : (e = ff(a, r, n), t.stateNode = e, Nc(t));
				}
				return W(t), null;
			case 5:
				if (P(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return W(t), null;
					}
					if (o = de.current, zi(t)) Li(t, o);
					else {
						var s = Bd(pe.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[at] = t, o[ot] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && Nc(t);
					}
				}
				return W(t), Pc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Nc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = pe.current, zi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Mi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[at] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Md(e.nodeValue, n)), e || Ii(t, !0);
					} else e = Bd(e).createTextNode(r), e[at] = t, t.stateNode = e;
				}
				return W(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = zi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[at] = t;
						} else Bi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						W(t), e = !1;
					} else n = Vi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (so(t), t) : (so(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return W(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = zi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[at] = t;
						} else Bi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						W(t), a = !1;
					} else a = Vi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (so(t), t) : (so(t), null);
				}
				return so(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Ic(t, t.updateQueue), W(t), null);
			case 4: return ge(), e === null && Sd(t.stateNode.containerInfo), W(t), null;
			case 10: return qi(t.type), W(t), null;
			case 19:
				if (ue(co), r = t.memoizedState, r === null) return W(t), null;
				if (a = !!(t.flags & 128), o = r.rendering, o === null) {
					if (a) Lc(r, !1);
					else {
						if (Wl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = lo(e), o !== null) {
								for (t.flags |= 128, Lc(r, !1), e = o.updateQueue, t.updateQueue = e, Ic(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) ui(n, e), n = n.sibling;
								return M(co, co.current & 1 | 2), V && Di(t, r.treeForkCount), t.child;
							}
							e = e.sibling;
						}
						r.tail !== null && R() > tu && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
					}
				} else {
					if (!a) {
						if (e = lo(o), e !== null) {
							if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Ic(t, e), Lc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !V) return W(t), null;
						} else 2 * R() - r.renderingStartTime > tu && n !== 536870912 && (t.flags |= 128, a = !0, Lc(r, !1), t.lanes = 4194304);
					}
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (W(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = R(), e.sibling = null, n = co.current, M(co, a ? n & 1 | 2 : n & 1), V && Di(t, r.treeForkCount), e);
			case 22:
			case 23: return so(t), eo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (W(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : W(t), n = t.updateQueue, n !== null && Ic(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && ue(ga), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), qi(aa), W(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function zc(e, t) {
		switch (Ai(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return qi(aa), ge(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return P(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (so(t), t.alternate === null) throw Error(i(340));
					Bi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (so(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Bi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return ue(co), null;
			case 4: return ge(), null;
			case 10: return qi(t.type), null;
			case 22:
			case 23: return so(t), eo(), e !== null && ue(ga), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return qi(aa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Bc(e, t) {
		switch (Ai(t), t.tag) {
			case 3:
				qi(aa), ge();
				break;
			case 26:
			case 27:
			case 5:
				P(t);
				break;
			case 4:
				ge();
				break;
			case 31:
				t.memoizedState !== null && so(t);
				break;
			case 13:
				so(t);
				break;
			case 19:
				ue(co);
				break;
			case 10:
				qi(t.type);
				break;
			case 22:
			case 23:
				so(t), eo(), e !== null && ue(ga);
				break;
			case 24: qi(aa);
		}
	}
	function Vc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Hc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Z(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function Uc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Ya(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Wc(e, t, n) {
		n.props = Ks(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Gc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Kc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) {
			if (typeof r == "function") try {
				r();
			} catch (n) {
				Z(e, t, n);
			} finally {
				e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
			}
			else if (typeof n == "function") try {
				n(null);
			} catch (n) {
				Z(e, t, n);
			}
			else n.current = null;
		}
	}
	function qc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Jc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[ot] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Yc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function Xc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Yc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Zc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Qt));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Zc(e, t, n), e = e.sibling; e !== null;) Zc(e, t, n), e = e.sibling;
	}
	function Qc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (Qc(e, t, n), e = e.sibling; e !== null;) Qc(e, t, n), e = e.sibling;
	}
	function $c(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[at] = e, t[ot] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var el = !1, tl = !1, nl = !1, rl = typeof WeakSet == "function" ? WeakSet : Set, il = null;
	function al(e, t) {
		if (e = e.containerInfo, Rd = sp, e = Er(e), Dr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, il = t; il !== null;) if (t = il, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, il = e;
		else for (; il !== null;) {
			switch (t = il, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Ks(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Z(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								ef(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, il = e;
				break;
			}
			il = t.return;
		}
	}
	function ol(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				bl(e, n), r & 4 && Vc(5, n);
				break;
			case 1:
				if (bl(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = Ks(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Uc(n), r & 512 && Gc(n, n.return);
				break;
			case 3:
				if (bl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Ya(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && $c(n);
			case 26:
			case 5:
				bl(e, n), t === null && r & 4 && qc(n), r & 512 && Gc(n, n.return);
				break;
			case 12:
				bl(e, n);
				break;
			case 31:
				bl(e, n), r & 4 && dl(e, n);
				break;
			case 13:
				bl(e, n), r & 4 && fl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Ju.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || el, !r) {
					t = t !== null && t.memoizedState !== null || tl, i = el;
					var a = tl;
					el = r, (tl = t) && !a ? Sl(e, n, !!(n.subtreeFlags & 8772)) : bl(e, n), el = i, tl = a;
				}
				break;
			case 30: break;
			default: bl(e, n);
		}
	}
	function sl(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, sl(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && pt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var G = null, cl = !1;
	function ll(e, t, n) {
		for (n = n.child; n !== null;) ul(e, t, n), n = n.sibling;
	}
	function ul(e, t, n) {
		if (Pe && typeof Pe.onCommitFiberUnmount == "function") try {
			Pe.onCommitFiberUnmount(Ne, n);
		} catch {}
		switch (n.tag) {
			case 26:
				tl || Kc(n, t), ll(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				tl || Kc(n, t);
				var r = G, i = cl;
				Zd(n.type) && (G = n.stateNode, cl = !1), ll(e, t, n), pf(n.stateNode), G = r, cl = i;
				break;
			case 5: tl || Kc(n, t);
			case 6:
				if (r = G, i = cl, G = null, ll(e, t, n), G = r, cl = i, G !== null) {
					if (cl) try {
						(G.nodeType === 9 ? G.body : G.nodeName === "HTML" ? G.ownerDocument.body : G).removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						G.removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				G !== null && (cl ? (e = G, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(G, n.stateNode));
				break;
			case 4:
				r = G, i = cl, G = n.stateNode.containerInfo, cl = !0, ll(e, t, n), G = r, cl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Hc(2, n, t), tl || Hc(4, n, t), ll(e, t, n);
				break;
			case 1:
				tl || (Kc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Wc(n, t, r)), ll(e, t, n);
				break;
			case 21:
				ll(e, t, n);
				break;
			case 22:
				tl = (r = tl) || n.memoizedState !== null, ll(e, t, n), tl = r;
				break;
			default: ll(e, t, n);
		}
	}
	function dl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Z(t, t.return, e);
			}
		}
	}
	function fl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function pl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new rl()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new rl()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function ml(e, t) {
		var n = pl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Yu.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function hl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							G = c.stateNode, cl = !1;
							break a;
						}
						break;
					case 5:
						G = c.stateNode, cl = !1;
						break a;
					case 3:
					case 4:
						G = c.stateNode.containerInfo, cl = !0;
						break a;
				}
				c = c.return;
			}
			if (G === null) throw Error(i(160));
			ul(o, s, a), G = null, cl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) _l(t, e), t = t.sibling;
	}
	var gl = null;
	function _l(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				hl(t, e), vl(e), r & 4 && (Hc(3, e, e.return), Vc(3, e), Hc(5, e, e.return));
				break;
			case 1:
				hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), r & 64 && el && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = gl;
				if (hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) {
						if (r === null) {
							if (e.stateNode === null) {
								a: {
									r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
									b: switch (r) {
										case "title":
											o = a.getElementsByTagName("title")[0], (!o || o[ft] || o[at] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[at] = e, vt(o), r = o;
											break a;
										case "link":
											var s = Vf("link", "href", a).get(r + (n.href || ""));
											if (s) {
												for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										case "meta":
											if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
												for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
											break;
										default: throw Error(i(468, r));
									}
									o[at] = e, vt(o), r = o;
								}
								e.stateNode = r;
							} else Hf(a, e.type, e.stateNode);
						} else e.stateNode = If(a, r, e.memoizedProps);
					} else o === r ? r === null && e.stateNode !== null && Jc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), n !== null && r & 4 && Jc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (hl(t, e), vl(e), r & 512 && (tl || n === null || Kc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Wt(a, "");
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Jc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (nl = !0);
				break;
			case 6:
				if (hl(t, e), vl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = gl, gl = gf(t.containerInfo), hl(t, e), gl = a, vl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				nl && (nl = !1, yl(e));
				break;
			case 4:
				r = gl, gl = gf(e.stateNode.containerInfo), hl(t, e), vl(e), gl = r;
				break;
			case 12:
				hl(t, e), vl(e);
				break;
			case 31:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 13:
				hl(t, e), vl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($l = R()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = el, d = tl;
				if (el = u || a, tl = d || l, hl(t, e), tl = d, el = u, vl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || el || tl || xl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? $d(m, !0) : $d(l.stateNode, !1);
							} catch (e) {
								Z(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, ml(e, n))));
				break;
			case 19:
				hl(t, e), vl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, ml(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: hl(t, e), vl(e);
		}
	}
	function vl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Yc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						Qc(e, Xc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Wt(o, ""), n.flags &= -33), Qc(e, Xc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Zc(e, Xc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Z(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function yl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			yl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function bl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) ol(e, t.alternate, t), t = t.sibling;
	}
	function xl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Hc(4, t, t.return), xl(t);
					break;
				case 1:
					Kc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Wc(t, t.return, n), xl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Kc(t, t.return), xl(t);
					break;
				case 22:
					t.memoizedState === null && xl(t);
					break;
				case 30:
					xl(t);
					break;
				default: xl(t);
			}
			e = e.sibling;
		}
	}
	function Sl(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Sl(i, a, n), Vc(4, a);
					break;
				case 1:
					if (Sl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ja(c[i], s);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					n && o & 64 && Uc(a), Gc(a, a.return);
					break;
				case 27: $c(a);
				case 26:
				case 5:
					Sl(i, a, n), n && r === null && o & 4 && qc(a), Gc(a, a.return);
					break;
				case 12:
					Sl(i, a, n);
					break;
				case 31:
					Sl(i, a, n), n && o & 4 && dl(i, a);
					break;
				case 13:
					Sl(i, a, n), n && o & 4 && fl(i, a);
					break;
				case 22:
					a.memoizedState === null && Sl(i, a, n), Gc(a, a.return);
					break;
				case 30: break;
				default: Sl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Cl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && sa(n));
	}
	function wl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e));
	}
	function Tl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) El(e, t, n, r), t = t.sibling;
	}
	function El(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Tl(e, t, n, r), i & 2048 && Vc(9, t);
				break;
			case 1:
				Tl(e, t, n, r);
				break;
			case 3:
				Tl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e)));
				break;
			case 12:
				if (i & 2048) {
					Tl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else Tl(e, t, n, r);
				break;
			case 31:
				Tl(e, t, n, r);
				break;
			case 13:
				Tl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Tl(e, t, n, r) : (a._visibility |= 2, Dl(e, t, n, r, !!(t.subtreeFlags & 10256) || !1)) : a._visibility & 2 ? Tl(e, t, n, r) : Ol(e, t), i & 2048 && Cl(o, t);
				break;
			case 24:
				Tl(e, t, n, r), i & 2048 && wl(t.alternate, t);
				break;
			default: Tl(e, t, n, r);
		}
	}
	function Dl(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Dl(a, o, s, c, i), Vc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Dl(a, o, s, c, i)) : u._visibility & 2 ? Dl(a, o, s, c, i) : Ol(a, o), i && l & 2048 && Cl(o.alternate, o);
					break;
				case 24:
					Dl(a, o, s, c, i), i && l & 2048 && wl(o.alternate, o);
					break;
				default: Dl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Ol(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Ol(n, r), i & 2048 && Cl(r.alternate, r);
					break;
				case 24:
					Ol(n, r), i & 2048 && wl(r.alternate, r);
					break;
				default: Ol(n, r);
			}
			t = t.sibling;
		}
	}
	var kl = 8192;
	function Al(e, t, n) {
		if (e.subtreeFlags & kl) for (e = e.child; e !== null;) jl(e, t, n), e = e.sibling;
	}
	function jl(e, t, n) {
		switch (e.tag) {
			case 26:
				Al(e, t, n), e.flags & kl && e.memoizedState !== null && Gf(n, gl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Al(e, t, n);
				break;
			case 3:
			case 4:
				var r = gl;
				gl = gf(e.stateNode.containerInfo), Al(e, t, n), gl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = kl, kl = 16777216, Al(e, t, n), kl = r) : Al(e, t, n));
				break;
			default: Al(e, t, n);
		}
	}
	function Ml(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Nl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				il = r, Il(r, e);
			}
			Ml(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Pl(e), e = e.sibling;
	}
	function Pl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Nl(e), e.flags & 2048 && Hc(9, e, e.return);
				break;
			case 3:
				Nl(e);
				break;
			case 12:
				Nl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Fl(e)) : Nl(e);
				break;
			default: Nl(e);
		}
	}
	function Fl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				il = r, Il(r, e);
			}
			Ml(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Hc(8, t, t.return), Fl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Fl(t));
					break;
				default: Fl(t);
			}
			e = e.sibling;
		}
	}
	function Il(e, t) {
		for (; il !== null;) {
			var n = il;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Hc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: sa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, il = r;
			else a: for (n = e; il !== null;) {
				r = il;
				var i = r.sibling, a = r.return;
				if (sl(r), r === n) {
					il = null;
					break a;
				}
				if (i !== null) {
					i.return = a, il = i;
					break a;
				}
				il = a;
			}
		}
	}
	var Ll = {
		getCacheForType: function(e) {
			var t = $i(aa), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return $i(aa).controller.signal;
		}
	}, Rl = typeof WeakMap == "function" ? WeakMap : Map, K = 0, q = null, J = null, Y = 0, X = 0, zl = null, Bl = !1, Vl = !1, Hl = !1, Ul = 0, Wl = 0, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = 0, Xl = null, Zl = null, Ql = !1, $l = 0, eu = 0, tu = Infinity, nu = null, ru = null, iu = 0, au = null, ou = null, su = 0, cu = 0, lu = null, uu = null, du = 0, fu = null;
	function pu() {
		return K & 2 && Y !== 0 ? Y & -Y : A.T === null ? nt() : dd();
	}
	function mu() {
		if (Jl === 0) {
			if (!(Y & 536870912) || V) {
				var e = Ve;
				Ve <<= 1, !(Ve & 3932160) && (Ve = 262144), Jl = e;
			} else Jl = 536870912;
		}
		return e = to.current, e !== null && (e.flags |= 32), Jl;
	}
	function hu(e, t, n) {
		(e === q && (X === 2 || X === 9) || e.cancelPendingCommit !== null) && (Su(e, 0), yu(e, Y, Jl, !1)), Ye(e, n), (!(K & 2) || e !== q) && (e === q && (!(K & 2) && (Kl |= n), Wl === 4 && yu(e, Y, Jl, !1)), rd(e));
	}
	function gu(e, t, n) {
		if (K & 6) throw Error(i(327));
		var r = !n && !(t & 127) && (t & e.expiredLanes) === 0 || Ge(e, t), a = r ? Au(e, t) : Ou(e, t, !0), o = r;
		do {
			if (a === 0) {
				Vl && !r && yu(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !vu(n)) {
				a = Ou(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = Xl;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (Su(c, s).flags |= 256), s = Ou(c, s, !1), s !== 2) {
							if (Hl && !l) {
								c.errorRecoveryDisabledLanes |= o, Kl |= o, a = 4;
								break a;
							}
							o = Zl, Zl = a, o !== null && (Zl === null ? Zl = o : Zl.push.apply(Zl, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				Su(e, 0), yu(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t) break;
					case 6:
						yu(r, t, Jl, !Bl);
						break a;
					case 2:
						Zl = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = $l + 300 - R(), 10 < a)) {
					if (yu(r, t, Jl, !Bl), We(r, 0, !0) !== 0) break a;
					su = t, r.timeoutHandle = Kd(_u.bind(null, r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, "Throttled", -0, 0), a);
					break a;
				}
				_u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, null, -0, 0);
			}
			break;
		} while (1);
		rd(e);
	}
	function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: Qt
			}, jl(t, a, d);
			var m = (a & 62914560) === a ? $l - R() : (a & 4194048) === a ? eu - R() : 0;
			if (m = qf(d, m), m !== null) {
				su = a, e.cancelPendingCommit = m(Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), yu(e, a, o, !l);
				return;
			}
		}
		Lu(e, t, a, n, r, i, o, s, c);
	}
	function vu(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!xr(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function yu(e, t, n, r) {
		t &= ~ql, t &= ~Kl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Ie(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && Ze(e, n, t);
	}
	function bu() {
		return K & 6 ? !0 : (id(0, !1), !1);
	}
	function xu() {
		if (J !== null) {
			if (X === 0) var e = J.return;
			else e = J, Gi = Wi = null, Oo(e), Aa = null, ja = 0, e = J;
			for (; e !== null;) Bc(e.alternate, e), e = e.return;
			J = null;
		}
	}
	function Su(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), su = 0, xu(), q = e, J = n = li(e.current, null), Y = t, X = 0, zl = null, Bl = !1, Vl = Ge(e, t), Hl = !1, Yl = Jl = ql = Kl = Gl = Wl = 0, Zl = Xl = null, Ql = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Ie(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Ul = t, $r(), n;
	}
	function Cu(e, t) {
		H = null, A.H = Rs, t === ba || t === Sa ? (t = Oa(), X = 3) : t === xa ? (t = Oa(), X = 4) : X = t === nc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, zl = t, J === null && (Wl = 1, Xs(e, _i(t, e.current)));
	}
	function wu() {
		var e = to.current;
		return e === null ? !0 : (Y & 4194048) === Y ? no === null : (Y & 62914560) === Y || Y & 536870912 ? e === no : !1;
	}
	function Tu() {
		var e = A.H;
		return A.H = Rs, e === null ? Rs : e;
	}
	function Eu() {
		var e = A.A;
		return A.A = Ll, e;
	}
	function Du() {
		Wl = 4, Bl || (Y & 4194048) !== Y && to.current !== null || (Vl = !0), !(Gl & 134217727) && !(Kl & 134217727) || q === null || yu(q, Y, Jl, !1);
	}
	function Ou(e, t, n) {
		var r = K;
		K |= 2;
		var i = Tu(), a = Eu();
		(q !== e || Y !== t) && (nu = null, Su(e, t)), t = !1;
		var o = Wl;
		a: do
			try {
				if (X !== 0 && J !== null) {
					var s = J, c = zl;
					switch (X) {
						case 8:
							xu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							to.current === null && (t = !0);
							var l = X;
							if (X = 0, zl = null, Pu(e, s, c, l), n && Vl) {
								o = 0;
								break a;
							}
							break;
						default: l = X, X = 0, zl = null, Pu(e, s, c, l);
					}
				}
				ku(), o = Wl;
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Gi = Wi = null, K = r, A.H = i, A.A = a, J === null && (q = null, Y = 0, $r()), o;
	}
	function ku() {
		for (; J !== null;) Mu(J);
	}
	function Au(e, t) {
		var n = K;
		K |= 2;
		var r = Tu(), a = Eu();
		q !== e || Y !== t ? (nu = null, tu = R() + 500, Su(e, t)) : Vl = Ge(e, t);
		a: do
			try {
				if (X !== 0 && J !== null) {
					t = J;
					var o = zl;
					b: switch (X) {
						case 1:
							X = 0, zl = null, Pu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (wa(o)) {
								X = 0, zl = null, Nu(t);
								break;
							}
							t = function() {
								X !== 2 && X !== 9 || q !== e || (X = 7), rd(e);
							}, o.then(t, t);
							break a;
						case 3:
							X = 7;
							break a;
						case 4:
							X = 5;
							break a;
						case 7:
							wa(o) ? (X = 0, zl = null, Nu(t)) : (X = 0, zl = null, Pu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (J.tag) {
								case 26: s = J.memoizedState;
								case 5:
								case 27:
									var c = J;
									if (s ? Wf(s) : c.stateNode.complete) {
										X = 0, zl = null;
										var l = c.sibling;
										if (l !== null) J = l;
										else {
											var u = c.return;
											u === null ? J = null : (J = u, Fu(u));
										}
										break b;
									}
							}
							X = 0, zl = null, Pu(e, t, o, 5);
							break;
						case 6:
							X = 0, zl = null, Pu(e, t, o, 6);
							break;
						case 8:
							xu(), Wl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				ju();
				break;
			} catch (t) {
				Cu(e, t);
			}
		while (1);
		return Gi = Wi = null, A.H = r, A.A = a, K = n, J === null ? (q = null, Y = 0, $r(), Wl) : 0;
	}
	function ju() {
		for (; J !== null && !we();) Mu(J);
	}
	function Mu(e) {
		var t = Mc(e.alternate, e, Ul);
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : J = t;
	}
	function Nu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = gc(n, t, t.pendingProps, t.type, void 0, Y);
				break;
			case 11:
				t = gc(n, t, t.pendingProps, t.type.render, t.ref, Y);
				break;
			case 5: Oo(t);
			default: Bc(n, t), t = J = ui(t, Ul), t = Mc(n, t, Ul);
		}
		e.memoizedProps = e.pendingProps, t === null ? Fu(e) : J = t;
	}
	function Pu(e, t, n, r) {
		Gi = Wi = null, Oo(t), Aa = null, ja = 0;
		var i = t.return;
		try {
			if (tc(e, i, t, n, Y)) {
				Wl = 1, Xs(e, _i(n, e.current)), J = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw J = i, t;
			Wl = 1, Xs(e, _i(n, e.current)), J = null;
			return;
		}
		t.flags & 32768 ? (V || r === 1 ? e = !0 : Vl || Y & 536870912 ? e = !1 : (Bl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = to.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Iu(t, e)) : Fu(t);
	}
	function Fu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Iu(t, Bl);
				return;
			}
			e = t.return;
			var n = Rc(t.alternate, t, Ul);
			if (n !== null) {
				J = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				J = t;
				return;
			}
			J = t = e;
		} while (t !== null);
		Wl === 0 && (Wl = 5);
	}
	function Iu(e, t) {
		do {
			var n = zc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, J = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				J = e;
				return;
			}
			J = e = n;
		} while (e !== null);
		Wl = 6, J = null;
	}
	function Lu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Hu();
		while (iu !== 0);
		if (K & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Qr, Xe(e, n, o, s, c, l), e === q && (J = q = null, Y = 0), ou = t, au = e, su = n, cu = o, lu = a, uu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Xu(Oe, function() {
				return Uu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = A.T, A.T = null, a = j.p, j.p = 2, s = K, K |= 4;
				try {
					al(e, t, n);
				} finally {
					K = s, j.p = a, A.T = r;
				}
			}
			iu = 1, Ru(), zu(), Bu();
		}
	}
	function Ru() {
		if (iu === 1) {
			iu = 0;
			var e = au, t = ou, n = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = K;
				K |= 4;
				try {
					_l(t, e);
					var a = zd, o = Er(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Tr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Dr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = wr(s, h), v = wr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					K = i, j.p = r, A.T = n;
				}
			}
			e.current = t, iu = 2;
		}
	}
	function zu() {
		if (iu === 2) {
			iu = 0;
			var e = au, t = ou, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = K;
				K |= 4;
				try {
					ol(e, t.alternate, t);
				} finally {
					K = i, j.p = r, A.T = n;
				}
			}
			iu = 3;
		}
	}
	function Bu() {
		if (iu === 4 || iu === 3) {
			iu = 0, Te();
			var e = au, t = ou, n = su, r = uu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? iu = 5 : (iu = 0, ou = au = null, Vu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (ru = null), tt(n), t = t.stateNode, Pe && typeof Pe.onCommitFiberRoot == "function") try {
				Pe.onCommitFiberRoot(Ne, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = A.T, i = j.p, j.p = 2, A.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					A.T = t, j.p = i;
				}
			}
			su & 3 && Hu(), rd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === fu ? du++ : (du = 0, fu = e) : du = 0, id(0, !1);
		}
	}
	function Vu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, sa(t)));
	}
	function Hu() {
		return Ru(), zu(), Bu(), Uu();
	}
	function Uu() {
		if (iu !== 5) return !1;
		var e = au, t = cu;
		cu = 0;
		var n = tt(su), r = A.T, a = j.p;
		try {
			j.p = 32 > n ? 32 : n, A.T = null, n = lu, lu = null;
			var o = au, s = su;
			if (iu = 0, ou = au = null, su = 0, K & 6) throw Error(i(331));
			var c = K;
			if (K |= 4, Pl(o.current), El(o, o.current, s, n), K = c, id(0, !1), Pe && typeof Pe.onPostCommitFiberRoot == "function") try {
				Pe.onPostCommitFiberRoot(Ne, o);
			} catch {}
			return !0;
		} finally {
			j.p = a, A.T = r, Vu(e, t);
		}
	}
	function Wu(e, t, n) {
		t = _i(n, t), t = Qs(e.stateNode, t, 2), e = Ha(e, t, 2), e !== null && (Ye(e, 2), rd(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) Wu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Wu(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (ru === null || !ru.has(r))) {
					e = _i(n, e), n = $s(2), r = Ha(t, n, 2), r !== null && (ec(n, r, t, e), Ye(r, 2), rd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Rl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Hl = !0, i.add(n), e = Ku.bind(null, e, t, n), t.then(e, e));
	}
	function Ku(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, q === e && (Y & n) === n && (Wl === 4 || Wl === 3 && (Y & 62914560) === Y && 300 > R() - $l ? !(K & 2) && Su(e, 0) : ql |= n, Yl === Y && (Yl = 0)), rd(e);
	}
	function qu(e, t) {
		t === 0 && (t = qe()), e = ni(e, t), e !== null && (Ye(e, t), rd(e));
	}
	function Ju(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), qu(e, n);
	}
	function Yu(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), qu(e, n);
	}
	function Xu(e, t) {
		return Se(e, t);
	}
	var Zu = null, Qu = null, $u = !1, ed = !1, td = !1, nd = 0;
	function rd(e) {
		e !== Qu && e.next === null && (Qu === null ? Zu = Qu = e : Qu = Qu.next = e), ed = !0, $u || ($u = !0, ud());
	}
	function id(e, t) {
		if (!td && ed) {
			td = !0;
			do
				for (var n = !1, r = Zu; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - Ie(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, ld(r, a));
						} else a = Y, a = We(r, r === q ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ge(r, a) || (n = !0, ld(r, a));
					}
					r = r.next;
				}
			while (n);
			td = !1;
		}
	}
	function ad() {
		od();
	}
	function od() {
		ed = $u = !1;
		var e = 0;
		nd !== 0 && Gd() && (e = nd);
		for (var t = R(), n = null, r = Zu; r !== null;) {
			var i = r.next, a = sd(r, t);
			a === 0 ? (r.next = null, n === null ? Zu = i : n.next = i, i === null && (Qu = n)) : (n = r, (e !== 0 || a & 3) && (ed = !0)), r = i;
		}
		iu !== 0 && iu !== 5 || id(e, !1), nd !== 0 && (nd = 0);
	}
	function sd(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Ie(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ke(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = q, n = Y, n = We(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (X === 2 || X === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Ce(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ge(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Ce(r), tt(n)) {
				case 2:
				case 8:
					n = De;
					break;
				case 32:
					n = Oe;
					break;
				case 268435456:
					n = Ae;
					break;
				default: n = Oe;
			}
			return r = cd.bind(null, e), n = Se(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Ce(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function cd(e, t) {
		if (iu !== 0 && iu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Hu() && e.callbackNode !== n) return null;
		var r = Y;
		return r = We(e, e === q ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (gu(e, r, t), sd(e, R()), e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null);
	}
	function ld(e, t) {
		if (Hu()) return null;
		gu(e, t, !0);
	}
	function ud() {
		Yd(function() {
			K & 6 ? Se(Ee, ad) : od();
		});
	}
	function dd() {
		if (nd === 0) {
			var e = ua;
			e === 0 && (e = Be, Be <<= 1, !(Be & 261888) && (Be = 256)), nd = e;
		}
		return nd;
	}
	function fd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Zt("" + e);
	}
	function pd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function md(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = fd((i[ot] || null).action), o = r.submitter;
			o && (t = (t = o[ot] || null) ? fd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new bn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (nd !== 0) {
								var e = o ? pd(i, o) : new FormData(i);
								ws(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? pd(i, o) : new FormData(i), ws(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var hd = 0; hd < qr.length; hd++) {
		var gd = qr[hd];
		Jr(gd.toLowerCase(), "on" + (gd[0].toUpperCase() + gd.slice(1)));
	}
	Jr(zr, "onAnimationEnd"), Jr(Br, "onAnimationIteration"), Jr(Vr, "onAnimationStart"), Jr("dblclick", "onDoubleClick"), Jr("focusin", "onFocus"), Jr("focusout", "onBlur"), Jr(Hr, "onTransitionRun"), Jr(Ur, "onTransitionStart"), Jr(Wr, "onTransitionCancel"), Jr(Gr, "onTransitionEnd"), St("onMouseEnter", ["mouseout", "mouseover"]), St("onMouseLeave", ["mouseout", "mouseover"]), St("onPointerEnter", ["pointerout", "pointerover"]), St("onPointerLeave", ["pointerout", "pointerover"]), xt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), xt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), xt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), xt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var _d = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), vd = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(_d));
	function yd(e, t) {
		t = !!(t & 4);
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Yr(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Yr(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[ct];
		n === void 0 && (n = t[ct] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Cd(t, e, 2, !1), n.add(r));
	}
	function bd(e, t, n) {
		var r = 0;
		t && (r |= 4), Cd(n, e, r, t);
	}
	var xd = "_reactListening" + Math.random().toString(36).slice(2);
	function Sd(e) {
		if (!e[xd]) {
			e[xd] = !0, yt.forEach(function(t) {
				t !== "selectionchange" && (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[xd] || (t[xd] = !0, bd("selectionchange", !1, t));
		}
	}
	function Cd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !ln || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function wd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = mt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		on(function() {
			var r = a, i = en(n), s = [];
			a: {
				var c = Kr.get(e);
				if (c !== void 0) {
					var l = bn, u = e;
					switch (e) {
						case "keypress": if (hn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Rn;
							break;
						case "focusin":
							u = "focus", l = kn;
							break;
						case "focusout":
							u = "blur", l = kn;
							break;
						case "beforeblur":
						case "afterblur":
							l = kn;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Dn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = On;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Bn;
							break;
						case zr:
						case Br:
						case Vr:
							l = An;
							break;
						case Gr:
							l = Vn;
							break;
						case "scroll":
						case "scrollend":
							l = Sn;
							break;
						case "wheel":
							l = Hn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = jn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = zn;
							break;
						case "toggle":
						case "beforetoggle": l = Un;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = sn(m, p), g != null && d.push(Td(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== $t && (u = n.relatedTarget || n.fromElement) && (mt(u) || u[st])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? mt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Dn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = zn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : gt(l), h = u == null ? c : gt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, mt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Od(s, c, l, d, !1), u !== null && f !== null && Od(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? gt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = lr;
					else if (rr(c)) {
						if (ur) v = yr;
						else {
							v = _r;
							var y = gr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Jt(r.elementType) && (v = lr) : v = vr;
					if (v &&= v(e, r)) {
						ir(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Bt(c, "number", c.value);
				}
				switch (y = r ? gt(r) : window, e) {
					case "focusin":
						(rr(y) || y.contentEditable === "true") && (kr = y, Ar = r, jr = null);
						break;
					case "focusout":
						jr = Ar = kr = null;
						break;
					case "mousedown":
						Mr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Mr = !1, Nr(s, n, i);
						break;
					case "selectionchange": if (Or) break;
					case "keydown":
					case "keyup": Nr(s, n, i);
				}
				var b;
				if (Gn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else $n ? Zn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Jn && n.locale !== "ko" && ($n || x !== "onCompositionStart" ? x === "onCompositionEnd" && $n && (b = mn()) : (dn = i, fn = "value" in dn ? dn.value : dn.textContent, $n = !0)), y = Ed(r, x), 0 < y.length && (x = new Mn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = Qn(n), b !== null && (x.data = b)))), (b = qn ? er(e, n) : tr(e, n)) && (x = Ed(r, "onBeforeInput"), 0 < x.length && (y = new Mn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), md(s, e, r, n, i);
			}
			yd(s, t);
		});
	}
	function Td(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Ed(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = sn(e, n), i != null && r.unshift(Td(e, i, a)), i = sn(e, t), i != null && r.push(Td(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Dd(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Od(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = sn(n, a), l != null && o.unshift(Td(n, l, c))) : i || (l = sn(n, a), l != null && o.push(Td(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var kd = /\r\n?/g, Ad = /\u0000|\uFFFD/g;
	function jd(e) {
		return (typeof e == "string" ? e : "" + e).replace(kd, "\n").replace(Ad, "");
	}
	function Md(e, t) {
		return t = jd(t), jd(e) === t;
	}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Wt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Wt(e, "" + r);
				break;
			case "className":
				Ot(e, "class", r);
				break;
			case "tabIndex":
				Ot(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Ot(e, n, r);
				break;
			case "style":
				qt(e, r, o);
				break;
			case "data": if (t !== "object") {
				Ot(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Zt("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				}
				if (typeof o == "function" && (n === "formAction" ? (t !== "input" && $(e, t, "name", a.name, a, null), $(e, t, "formEncType", a.formEncType, a, null), $(e, t, "formMethod", a.formMethod, a, null), $(e, t, "formTarget", a.formTarget, a, null)) : ($(e, t, "encType", a.encType, a, null), $(e, t, "method", a.method, a, null), $(e, t, "target", a.target, a, null))), r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Zt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = Qt);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Zt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				Q("beforetoggle", e), Q("toggle", e), Dt(e, "popover", r);
				break;
			case "xlinkActuate":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				kt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				kt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				kt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				kt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Dt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Yt.get(n) || n, Dt(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				qt(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Wt(e, r) : (typeof r == "number" || typeof r == "bigint") && Wt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = Qt);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!bt.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[ot] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Dt(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				Q("error", e), Q("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: $(e, t, o, s, n, null);
					}
				}
				a && $(e, t, "srcSet", n.srcSet, n, null), r && $(e, t, "src", n.src, n, null);
				return;
			case "input":
				Q("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: $(e, t, r, d, n, null);
					}
				}
				zt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in Q("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: $(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Vt(e, !!r, n, !0) : Vt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in Q("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: $(e, t, s, c, n, null);
				}
				Ut(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: $(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				Q("beforetoggle", e), Q("toggle", e), Q("cancel", e), Q("close", e);
				break;
			case "iframe":
			case "object":
				Q("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < _d.length; r++) Q(_d[r], e);
				break;
			case "image":
				Q("error", e), Q("load", e);
				break;
			case "details":
				Q("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": Q("error", e), Q("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: $(e, t, u, r, n, null);
				}
				return;
			default: if (Jt(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || $(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && $(e, t, p, m, r, f);
					}
				}
				Rt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || $(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && $(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Vt(e, !!n, n ? [] : "", !1) : Vt(e, !!n, t, !0)) : Vt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: $(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && $(e, t, s, a, r, o);
				}
				Ht(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: $(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: $(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: $(e, t, u, p, r, m);
				}
				return;
			default: if (Jt(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Ud(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Wd = null;
	function Gd() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== Wd && (Wd = e, !0) : (Wd = null, !1);
	}
	var Kd = typeof setTimeout == "function" ? setTimeout : void 0, qd = typeof clearTimeout == "function" ? clearTimeout : void 0, Jd = typeof Promise == "function" ? Promise : void 0, Yd = typeof queueMicrotask == "function" ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
		return Jd.resolve(null).then(e).catch(Xd);
	};
	function Xd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Zd(e) {
		return e === "head";
	}
	function Qd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) {
				if (n = i.data, n === "/$" || n === "/&") {
					if (r === 0) {
						e.removeChild(i), Np(t);
						return;
					}
					r--;
				} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
				else if (n === "html") pf(e.ownerDocument.documentElement);
				else if (n === "head") {
					n = e.ownerDocument.head, pf(n);
					for (var a = n.firstChild; a;) {
						var o = a.nextSibling, s = a.nodeName;
						a[ft] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
					}
				} else n === "body" && pf(e.ownerDocument.body);
			}
			n = i;
		} while (n);
		Np(t);
	}
	function $d(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) {
				if (n = r.data, n === "/$") {
					if (e === 0) break;
					e--;
				} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			}
			n = r;
		} while (n);
	}
	function ef(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					ef(n), pt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function tf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) {
				if (t === "input" && e.type === "hidden") {
					var a = i.name == null ? null : "" + i.name;
					if (i.type === "hidden" && e.getAttribute("name") === a) return e;
				} else return e;
			} else if (!e[ft]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		pt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = j.d;
	j.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = bu();
		return e || t;
	}
	function yf(e) {
		var t = ht(e);
		t !== null && t.tag === 5 && t.type === "form" ? Es(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = Lt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Lt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Lt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Lt(n.imageSizes) + "\"]")) : i += "[href=\"" + Lt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Lt(r) + "\"][href=\"" + Lt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = h({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), vt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = _t(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					vt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), vt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), vt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = pe.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = _t(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = _t(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = _t(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + Lt(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), vt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + Lt(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Lt(n.href) + "\"]");
				if (r) return t.instance = r, vt(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), vt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, vt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), vt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, vt(a), a) : (r = n, (a = mf.get(o)) && (r = h({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), vt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[ft] || a[at] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, vt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), vt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: S,
		Provider: null,
		Consumer: null,
		_currentValue: oe,
		_currentValue2: oe,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Je(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Je(0), this.hiddenUpdates = Je(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = si(3, null, null, t), e.current = a, a.stateNode = e, t = oa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, za(a), e;
	}
	function tp(e) {
		return e ? (e = ai, e) : ai;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Va(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ha(e, r, t), n !== null && (hu(n, e, t), Ua(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = ni(e, 67108864);
			t !== null && hu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = pu();
			t = et(t);
			var n = ni(e, t);
			n !== null && hu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 2, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 8, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) wd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = ht(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ue(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Ie(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									rd(a), !(K & 6) && (tu = R() + 500, id(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = ni(a, 2), s !== null && hu(s, a, 2), bu(), ip(a, 2);
					}
					if (a = dp(r), a === null && wd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else wd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = en(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = mt(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (z()) {
				case Ee: return 2;
				case De: return 8;
				case Oe:
				case ke: return 32;
				case Ae: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = ht(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = mt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, rt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, rt(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				$t = r, n.target.dispatchEvent(r), $t = null;
			} else return t = ht(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = ht(n);
				a !== null && (e.splice(t, 3), t -= 3, ws(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[ot] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[ot] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, pu(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), bu(), t[st] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = nt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.8") throw Error(i(527, Lp, "19.2.8"));
	j.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.8",
		rendererPackageName: "react-dom",
		currentDispatcherRef: A,
		reconcilerVersion: "19.2.8"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			Ne = zp.inject(Rp), Pe = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = qs, s = Js, c = Ys;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[st] = t.current, Sd(e), new Fp(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u(), 1), v = g(), y = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), b = (/* @__PURE__ */ o(((e, t) => {
	t.exports = y();
})))(), x = "", ee = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), S = (e = 0) => new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD"
}).format(e / 100), C = (e) => e ? (/* @__PURE__ */ new Date(`${e}T00:00:00`)).toLocaleDateString() : "—", w = (e = "") => String(e).replaceAll("_", " ");
function T(e = "chart_of_accounts") {
	return {
		template_key: e,
		filename: `${e}.csv`,
		csv: "",
		mapping: {},
		mapping_profile_id: "",
		mapping_profile_name: "",
		restaged_from_batch_id: "",
		correction_source_filename: "",
		correction_row_count: 0,
		correction_scope: "",
		cash_account_id: "",
		start_date: "",
		end_date: "",
		opening: "",
		closing: ""
	};
}
function te(e) {
	let t = String(e || "").replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0];
	if (!t.trim()) return [];
	let n = [], r = "", i = !1;
	for (let e = 0; e < t.length; e += 1) {
		let a = t[e];
		a === "\"" ? i && t[e + 1] === "\"" ? (r += "\"", e += 1) : i = !i : a === "," && !i ? (n.push(r.trim()), r = "") : r += a;
	}
	return n.push(r.trim()), n.filter(Boolean);
}
function E(e, t, n = {}) {
	let r = new Map(t.map((e) => [e.toLowerCase().replaceAll(" ", "_"), e]));
	return Object.fromEntries(e.fields.map((e) => [e.key, t.includes(n[e.key]) ? n[e.key] : r.get(e.key.toLowerCase()) || ""]));
}
function ne(e, t) {
	return e.length === t.length && e.every((e, n) => e === t[n]);
}
async function D(e, { method: t = "GET", body: n, idempotent: r = !0, headers: i } = {}) {
	let a = { Accept: "application/json" };
	Object.assign(a, i), n !== void 0 && (a["Content-Type"] = "application/json"), t !== "GET" && x && (a["X-CSRF-Token"] = x), t !== "GET" && r && (a["Idempotency-Key"] = crypto.randomUUID());
	let o = await fetch(e, {
		method: t,
		headers: a,
		credentials: "same-origin",
		...n === void 0 ? {} : { body: JSON.stringify(n) }
	}), s = await o.json().catch(() => ({}));
	if (!o.ok) {
		let e = Error(s.error || "The request could not be completed.");
		throw e.status = o.status, e.requestId = s.request_id, e;
	}
	return s.csrf_token && (x = s.csrf_token), s;
}
async function re(e, t, n = 12e4) {
	let r = Date.now() + n;
	for (; Date.now() < r;) {
		let n = await D(`/api/jobs/${e}`);
		if (t?.(n), n.status === "completed") return n;
		if (["dead_letter", "cancelled"].includes(n.status)) throw Error(n.last_error || `Background job ${w(n.status)}.`);
		await new Promise((e) => window.setTimeout(e, 750));
	}
	throw Error("The job is still running. Continue tracking it in Reports & jobs.");
}
function ie(e, t = []) {
	let [n, r] = (0, _.useState)({
		loading: !0,
		data: null,
		error: ""
	}), i = async () => {
		r((e) => ({
			...e,
			loading: !0,
			error: ""
		}));
		try {
			r({
				loading: !1,
				data: await e(),
				error: ""
			});
		} catch (e) {
			r({
				loading: !1,
				data: null,
				error: e.message
			});
		}
	};
	return (0, _.useEffect)(() => void i(), t), {
		...n,
		refresh: i
	};
}
var ae = [
	[
		"overview",
		"Overview",
		"◫"
	],
	[
		"journals",
		"Journal",
		"⇄"
	],
	[
		"revenue",
		"Revenue",
		"◎"
	],
	[
		"receivables",
		"Receivables",
		"▤"
	],
	[
		"bank-close",
		"Bank & close",
		"✓"
	],
	[
		"integrations",
		"Integrations",
		"⇆"
	],
	[
		"imports",
		"Imports",
		"⇩"
	],
	[
		"investments",
		"Investments",
		"↗"
	],
	[
		"fixed-assets",
		"Fixed assets",
		"◇"
	],
	[
		"reports",
		"Reports & jobs",
		"⌁"
	],
	[
		"administration",
		"Administration",
		"⚙"
	]
];
function O() {
	let [e, t] = (0, _.useState)(null), [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)(!0);
	return (0, _.useEffect)(() => {
		D("/api/auth/me").then(t).catch(async (e) => {
			if (e.status !== 401) throw e;
			r((await D("/setup/status")).needs_setup);
		}).finally(() => a(!1));
	}, []), i ? /* @__PURE__ */ (0, b.jsx)(xe, {
		title: "Opening Folio",
		detail: "Checking your secure session…"
	}) : e ? /* @__PURE__ */ (0, b.jsx)(A, {
		auth: e,
		setAuth: t
	}) : /* @__PURE__ */ (0, b.jsx)(k, {
		needsSetup: n,
		onAuthenticated: (e) => t(e)
	});
}
function k({ needsSetup: e, onAuthenticated: t }) {
	let [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)("");
	async function o(n) {
		n.preventDefault();
		let i = new FormData(n.currentTarget);
		r(!0), a("");
		try {
			t(await D(e ? "/api/auth/register" : "/api/auth/login", {
				method: "POST",
				idempotent: !1,
				headers: e ? { "X-Folio-Bootstrap-Token": i.get("bootstrap_token") } : void 0,
				body: {
					email: i.get("email"),
					password: i.get("password"),
					...e ? {
						organization_name: i.get("organization_name"),
						name: i.get("name")
					} : {}
				}
			}));
		} catch (e) {
			a(e.message), r(!1);
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("main", {
		className: "auth-layout",
		children: [/* @__PURE__ */ (0, b.jsxs)("section", {
			className: "auth-story",
			"aria-label": "Folio product summary",
			children: [
				/* @__PURE__ */ (0, b.jsx)(ge, {}),
				/* @__PURE__ */ (0, b.jsx)("p", {
					className: "eyebrow",
					children: "CONTROLLED ACCOUNTING OPERATIONS"
				}),
				/* @__PURE__ */ (0, b.jsx)("h1", { children: "Close with confidence, from contract to financial statement." }),
				/* @__PURE__ */ (0, b.jsx)("p", { children: "One tenant-isolated workspace for accounting workflows, evidence and reconciliations." }),
				/* @__PURE__ */ (0, b.jsxs)("ul", { children: [
					/* @__PURE__ */ (0, b.jsx)("li", { children: "Every posted entry balances and becomes immutable." }),
					/* @__PURE__ */ (0, b.jsx)("li", { children: "Every action retains its authenticated actor." }),
					/* @__PURE__ */ (0, b.jsx)("li", { children: "AI can draft; only authorized people can post." })
				] })
			]
		}), /* @__PURE__ */ (0, b.jsxs)("section", {
			className: "auth-panel",
			"aria-labelledby": "auth-title",
			children: [
				/* @__PURE__ */ (0, b.jsx)("p", {
					className: "eyebrow",
					children: e ? "NEW WORKSPACE" : "WELCOME BACK"
				}),
				/* @__PURE__ */ (0, b.jsx)("h2", {
					id: "auth-title",
					children: e ? "Create your workspace" : "Sign in to Folio"
				}),
				/* @__PURE__ */ (0, b.jsx)("p", { children: e ? "Set up the first administrator." : "Use your organization credentials." }),
				/* @__PURE__ */ (0, b.jsxs)("form", {
					onSubmit: o,
					className: "form-stack",
					children: [
						e && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Organization",
								name: "organization_name",
								autoComplete: "organization"
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Your name",
								name: "name",
								autoComplete: "name"
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Deployment bootstrap token",
								name: "bootstrap_token",
								type: "password",
								autoComplete: "off",
								required: !1,
								hint: "Provided by the person who deployed Folio. Local development may leave this blank."
							})
						] }),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Email",
							name: "email",
							type: "email",
							autoComplete: "email"
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Password",
							name: "password",
							type: "password",
							minLength: 12,
							autoComplete: e ? "new-password" : "current-password",
							hint: e ? "At least 12 characters with upper/lowercase and a number." : ""
						}),
						i && /* @__PURE__ */ (0, b.jsx)(Ce, { children: i }),
						/* @__PURE__ */ (0, b.jsx)("button", {
							className: "primary block",
							disabled: n,
							children: n ? "Please wait…" : e ? "Create secure workspace" : "Sign in"
						})
					]
				})
			]
		})]
	});
}
function A({ auth: e, setAuth: t }) {
	let [n, r] = (0, _.useState)("overview"), [i, a] = (0, _.useState)(null), o = ae.find(([e]) => e === n), s = (t) => e.permissions.includes(t);
	async function c() {
		await D("/api/auth/logout", {
			method: "POST",
			idempotent: !1
		}), x = "", t(null);
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "app-shell",
		children: [/* @__PURE__ */ (0, b.jsxs)("aside", {
			className: "sidebar",
			children: [
				/* @__PURE__ */ (0, b.jsx)(ge, {}),
				/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "workspace-card",
					children: [/* @__PURE__ */ (0, b.jsx)("span", {
						className: "workspace-avatar",
						children: e.organization.name.slice(0, 1).toUpperCase()
					}), /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.organization.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: "USD · Accrual" })] })]
				}),
				/* @__PURE__ */ (0, b.jsx)("nav", {
					"aria-label": "Accounting modules",
					children: ae.map(([e, t, i]) => /* @__PURE__ */ (0, b.jsxs)("button", {
						"aria-current": n === e ? "page" : void 0,
						onClick: () => r(e),
						children: [/* @__PURE__ */ (0, b.jsx)("span", {
							"aria-hidden": "true",
							children: i
						}), t]
					}, e))
				}),
				/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "sidebar-user",
					children: [
						/* @__PURE__ */ (0, b.jsx)("span", {
							className: "avatar",
							children: e.user.name.slice(0, 2).toUpperCase()
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.user.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: w(e.role) })] }),
						/* @__PURE__ */ (0, b.jsx)("button", {
							className: "text-button",
							onClick: c,
							children: "Sign out"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, b.jsxs)("main", {
			className: "workspace-main",
			children: [
				/* @__PURE__ */ (0, b.jsxs)("header", {
					className: "page-header",
					children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("p", {
						className: "eyebrow",
						children: "FINANCE WORKSPACE"
					}), /* @__PURE__ */ (0, b.jsx)("h1", { children: o[1] })] }), /* @__PURE__ */ (0, b.jsx)("span", {
						className: "role-chip",
						children: w(e.role)
					})]
				}),
				i && /* @__PURE__ */ (0, b.jsx)(we, {
					notice: i,
					onClose: () => a(null)
				}),
				/* @__PURE__ */ (0, b.jsx)(j, {
					active: n,
					auth: e,
					can: s,
					notify: a,
					setAuth: t
				})
			]
		})]
	});
}
function j({ active: e, ...t }) {
	let n = {
		overview: ce,
		journals: le,
		revenue: ue,
		receivables: M,
		"bank-close": de,
		integrations: oe,
		imports: se,
		investments: fe,
		"fixed-assets": pe,
		reports: me,
		administration: he
	}[e];
	return /* @__PURE__ */ (0, b.jsx)(n, { ...t });
}
function oe({ can: e, notify: t }) {
	let n = ie(() => D("/api/integrations/overview"), []), r = ie(() => D("/api/integrations/oauth"), []), [i, a] = (0, _.useState)(!1), [o, s] = (0, _.useState)(""), [c, l] = (0, _.useState)(!1), [u, d] = (0, _.useState)(null), [f, p] = (0, _.useState)(null), [m, h] = (0, _.useState)(null), [g, v] = (0, _.useState)(null), [y, x] = (0, _.useState)(null), [ee, C] = (0, _.useState)(null), [T, te] = (0, _.useState)(null), [E, ne] = (0, _.useState)(null), [re, ae] = (0, _.useState)(null), [O, k] = (0, _.useState)(!1);
	(0, _.useEffect)(() => {
		!o && n.data?.connections?.length && s(n.data.connections[0].id);
	}, [n.data, o]);
	let A = ie(() => o ? Promise.all([
		D(`/api/integrations/connections/${o}/records`),
		D(`/api/integrations/mappings?connection_id=${o}`),
		D(`/api/integrations/stripe-reconciliation?connection_id=${o}`),
		D(`/api/payroll?connection_id=${o}`),
		D("/api/accounts"),
		D(`/api/crm?connection_id=${o}`),
		D("/api/saas/overview")
	]) : Promise.resolve([
		[],
		[],
		{
			records: [],
			metrics: {}
		},
		{
			runs: [],
			metrics: {}
		},
		[],
		{
			proposals: [],
			metrics: {}
		},
		{
			customers: [],
			products: [],
			entities: []
		}
	]), [o]);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let j = n.data;
	async function oe(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await D("/api/integrations/connections", {
				method: "POST",
				body: {
					provider: r.get("provider"),
					display_name: r.get("display_name"),
					environment: r.get("environment"),
					external_account_id: r.get("external_account_id") || null,
					credential_secret_ref: r.get("credential_secret_ref"),
					webhook_secret_ref: r.get("webhook_secret_ref") || null,
					scopes: String(r.get("scopes") || "").split(",").map((e) => e.trim()).filter(Boolean),
					settings: {}
				}
			}), a(!1), await n.refresh(), t({
				kind: "success",
				message: "Connector configured without exposing its credentials."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function se(e) {
		try {
			let t = await D(`/api/integrations/oauth/${e.id}/start`, {
				method: "POST",
				body: {}
			});
			window.location.assign(t.authorization_url);
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function ce(e) {
		if (window.confirm(`Revoke ${e.display_name} and stop future provider access?`)) try {
			await D(`/api/integrations/oauth/${e.id}/revoke`, {
				method: "POST",
				body: {}
			}), await Promise.all([n.refresh(), r.refresh()]), t({
				kind: "success",
				message: `${e.display_name} authorization revoked.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function le(e, r) {
		try {
			await D("/api/integrations/connections/status", {
				method: "POST",
				body: {
					connection_id: e.id,
					status: r
				}
			}), await n.refresh(), t({
				kind: "success",
				message: `${e.display_name} is now ${r}.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function ue(e) {
		try {
			await D("/api/integrations/exceptions/status", {
				method: "POST",
				body: {
					id: e.id,
					status: "resolved",
					resolution: "Reviewed and resolved from the integration operations queue"
				}
			}), await n.refresh(), t({
				kind: "success",
				message: "Integration exception resolved."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function M(e) {
		try {
			await D("/api/jobs/provider-syncs", {
				method: "POST",
				body: {
					connection_id: e.id,
					trigger: "manual"
				}
			}), t({
				kind: "success",
				message: `${e.display_name} synchronization was queued. Track it in Reports & jobs.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function de(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget), r = n.get("default");
		try {
			await D("/api/integrations/mappings", {
				method: "POST",
				body: {
					connection_id: o,
					object_type: n.get("object_type"),
					source_field: n.get("source_field"),
					target_field: n.get("target_field"),
					transform: n.get("transform"),
					required: n.get("required") === "on",
					...r === "" ? {} : { default: r }
				}
			}), l(!1), await A.refresh(), t({
				kind: "success",
				message: "Versioned mapping activated for future previews."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function fe(e) {
		try {
			let t = await D(`/api/integrations/records/${e.id}/preview`, {
				method: "POST",
				body: {}
			});
			d(t), t.ready || await Promise.all([n.refresh(), A.refresh()]);
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function pe(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/integrations/records/${u.record.id}/apply`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: r.get("approval_note"),
					mapping_fingerprint: u.mapping_fingerprint
				}
			});
			d(null), await Promise.all([n.refresh(), A.refresh()]), t(e.status === "applied" ? {
				kind: "success",
				message: `Draft journal ${e.journal.id} created for independent posting review.`
			} : {
				kind: "error",
				message: "Record could not be applied and was placed in the exception queue."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function me(e) {
		try {
			let t = await D(`/api/integrations/records/${e.id}/bank-preview`, {
				method: "POST",
				body: {}
			});
			p(t), t.ready || await Promise.all([n.refresh(), A.refresh()]);
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function he(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/integrations/records/${f.record.id}/bank-apply`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: r.get("approval_note")
				}
			});
			p(null), await Promise.all([n.refresh(), A.refresh()]), t(e.status === "applied" ? {
				kind: "success",
				message: e.transaction.status === "matched" ? "Bank activity matched to posted cash with source lineage retained." : `Bank activity entered the ${w(e.transaction.status)} queue.`
			} : {
				kind: "error",
				message: "Bank activity failed validation and was classified."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function ge(e) {
		try {
			let t = await D(`/api/integrations/records/${e.id}/stripe-preview`, {
				method: "POST",
				body: {}
			});
			h(t), t.ready || await Promise.all([n.refresh(), A.refresh()]);
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function ve(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/integrations/records/${m.record.id}/stripe-apply`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: r.get("approval_note"),
					...r.get("target_entity_id") ? { target_entity_id: r.get("target_entity_id") } : {}
				}
			});
			h(null), await Promise.all([n.refresh(), A.refresh()]), t(e.status === "applied" ? {
				kind: "success",
				message: e.reconciliation.status === "component" ? "Stripe payout component retained for net-settlement proof." : "Stripe activity reconciled without creating duplicate accounting."
			} : {
				kind: "error",
				message: "Stripe activity entered the exception queue."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function xe(e) {
		try {
			let t = await D(`/api/integrations/records/${e.id}/payroll-preview`, {
				method: "POST",
				body: {}
			});
			v(t), t.ready || await Promise.all([n.refresh(), A.refresh()]);
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function Ce(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/integrations/records/${g.record.id}/payroll-apply`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: r.get("approval_note")
				}
			});
			v(null), await Promise.all([n.refresh(), A.refresh()]), t(e.status === "applied" ? {
				kind: "success",
				message: e.journal ? `Payroll draft ${e.journal.id} created for independent posting.` : "Unposted payroll source version removed with lineage retained."
			} : {
				kind: "error",
				message: "Payroll entered the controlled exception queue."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function we(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/payroll/settlements/${y.id}/draft`, {
				method: "POST",
				body: {
					approved: !0,
					cash_account_id: Number(n.get("cash_account_id")),
					settlement_date: n.get("settlement_date"),
					approval_note: n.get("approval_note")
				}
			});
			x(null), await A.refresh(), t({
				kind: "success",
				message: `Settlement draft ${e.journal.id} created for independent posting and bank matching.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function Ee(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget);
		k(!0);
		try {
			await D(`/api/payroll/settlements/${ee.id}/reconcile`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: n.get("approval_note")
				}
			}), C(null), await A.refresh(), t({
				kind: "success",
				message: "Gusto settlement reconciled to the native bank feed and posted cash."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function De(e) {
		try {
			te(await D(`/api/integrations/records/${e.id}/crm-preview`, {
				method: "POST",
				body: {}
			}));
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function Oe(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget), r = E.object_type === "hubspot_company";
		k(!0);
		try {
			await D(r ? "/api/crm/customer-links" : "/api/crm/product-links", {
				method: "POST",
				body: {
					record_id: E.id,
					[r ? "customer_id" : "product_id"]: Number(n.get("local_id")),
					approved: !0,
					approval_note: n.get("approval_note")
				}
			}), ne(null), await A.refresh(), t({
				kind: "success",
				message: `HubSpot ${r ? "company" : "product"} identity linked with approval lineage.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function ke(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget);
		k(!0);
		try {
			let e = await D(`/api/integrations/records/${T.record.id}/crm-prepare`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: n.get("approval_note"),
					entity_id: Number(n.get("entity_id")),
					contract_number: n.get("contract_number"),
					signed_date: n.get("signed_date"),
					start_date: n.get("start_date"),
					end_date: n.get("end_date"),
					recognition_method: n.get("recognition_method")
				}
			});
			if (e.status === "error") {
				te(e.preview);
				return;
			}
			te(null), await A.refresh(), t({
				kind: "success",
				message: "Contract proposal prepared. A different controller must approve it before creation."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			k(!1);
		}
	}
	async function Ae(e) {
		e.preventDefault();
		let n = new FormData(e.currentTarget).get("approval_note");
		try {
			await D(`/api/crm/proposals/${re.id}/approve`, {
				method: "POST",
				body: {
					approved: !0,
					approval_note: n
				}
			}), ae(null), await A.refresh(), t({
				kind: "success",
				message: "CRM contract proposal approved."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function je(e) {
		try {
			let n = await D(`/api/crm/proposals/${e.id}/apply`, {
				method: "POST",
				body: {}
			});
			await A.refresh(), t({
				kind: "success",
				message: `Folio contract ${n.contract.contract_number} created with revenue schedules.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	let [Me, Ne, Pe, Fe, Ie, Le, Re] = A.data || [
		[],
		[],
		{
			records: [],
			metrics: {}
		},
		{
			runs: [],
			metrics: {}
		},
		[],
		{
			proposals: [],
			metrics: {}
		},
		{
			customers: [],
			products: [],
			entities: []
		}
	], ze = j.connections.find((e) => e.id === o), Be = r.data || [], Ve = /* @__PURE__ */ new Set([
		"stripe",
		"gusto",
		"hubspot"
	]);
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Connected systems",
				detail: "Observable, tenant-scoped data connections without browser-visible secrets",
				action: e("admin") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => a(!0),
					children: "Configure connector"
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Connections",
						value: j.connections.length,
						detail: "Configured providers"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Active",
						value: j.metrics.active_connections,
						detail: "Eligible to synchronize"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Provider errors",
						value: j.metrics.error_connections,
						detail: "Connections needing attention",
						warning: j.metrics.error_connections > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Exceptions",
						value: j.metrics.open_exceptions,
						detail: "Open connector failures",
						warning: j.metrics.open_exceptions > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsx)(P, {
					title: "Connections",
					subtitle: "Status, environment and latest successful synchronization",
					children: /* @__PURE__ */ (0, b.jsx)(I, {
						columns: [
							"Provider",
							"Connection",
							"Environment",
							"Last sync",
							"Status",
							"Action"
						],
						rows: j.connections.map((t) => [
							w(t.provider),
							t.display_name,
							w(t.environment),
							t.last_synced_at ? new Date(t.last_synced_at).toLocaleString() : "Never",
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "status-stack",
								children: [/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }), Ve.has(t.provider) && /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									"OAuth:",
									" ",
									Be.find((e) => e.connection_id === t.id)?.status || "not authorized"
								] })]
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "button-row",
								children: [
									e("admin") && Ve.has(t.provider) && /* @__PURE__ */ (0, b.jsx)("button", {
										className: "small-button",
										onClick: () => se(t),
										children: Be.some((e) => e.connection_id === t.id && e.status === "active") ? "Reauthorize" : "Authorize"
									}),
									e("admin") && Be.some((e) => e.connection_id === t.id && e.status === "active") && /* @__PURE__ */ (0, b.jsx)("button", {
										className: "small-button",
										onClick: () => ce(t),
										children: "Revoke"
									}),
									t.status === "active" && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
										className: "small-button",
										onClick: () => M(t),
										children: "Sync now"
									}),
									e("admin") && !Ve.has(t.provider) && (t.status === "configured" || t.status === "paused" || t.status === "error" ? /* @__PURE__ */ (0, b.jsx)("button", {
										className: "small-button",
										onClick: () => le(t, "active"),
										children: "Activate"
									}) : t.status === "active" ? /* @__PURE__ */ (0, b.jsx)("button", {
										className: "small-button",
										onClick: () => le(t, "paused"),
										children: "Pause"
									}) : null)
								]
							})
						])
					})
				}), /* @__PURE__ */ (0, b.jsx)(P, {
					title: "Initial connector catalog",
					subtitle: "Approved production-integration targets",
					children: /* @__PURE__ */ (0, b.jsx)("div", {
						className: "attention-list",
						children: j.catalog.map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "attention",
							children: [
								/* @__PURE__ */ (0, b.jsx)("span", {
									className: "workspace-avatar small",
									children: e.name.slice(0, 1)
								}),
								/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									w(e.domain),
									" · ",
									e.capabilities.length,
									" capabilities"
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(L, { value: "available" })
							]
						}, e.provider))
					})
				})]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Synchronization history",
				subtitle: "Cursors, pages and idempotent source-record outcomes",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Started",
						"Provider connection",
						"Trigger",
						"Added",
						"Modified",
						"Removed",
						"Status"
					],
					rows: j.runs.map((e) => [
						(/* @__PURE__ */ new Date(`${e.started_at}Z`)).toLocaleString(),
						j.connections.find((t) => t.id === e.connection_id)?.display_name,
						w(e.trigger),
						e.added,
						e.modified,
						e.removed,
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Accounting application workbench",
				subtitle: "Route provider records into native subledgers or controlled draft journals",
				action: e("admin") && ze && ![
					"plaid",
					"stripe",
					"gusto",
					"hubspot"
				].includes(ze.provider) ? /* @__PURE__ */ (0, b.jsx)("button", {
					className: "secondary",
					onClick: () => l(!0),
					children: "Add mapping"
				}) : null,
				children: j.connections.length ? /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "workflow-toolbar",
					children: [/* @__PURE__ */ (0, b.jsx)(z, {
						label: "Connection",
						name: "workbench_connection",
						as: "select",
						value: o,
						onChange: (e) => s(e.target.value),
						options: j.connections.map((e) => [e.id, e.display_name])
					}), /* @__PURE__ */ (0, b.jsx)("span", { children: ze?.provider === "plaid" ? "Plaid bank transactions reconcile to posted cash through the native bank feed" : ze?.provider === "stripe" ? "Stripe billing and payment objects reconcile to Folio subledgers; payouts prove net settlement through the bank feed" : ze?.provider === "gusto" ? "Gusto payrolls accrue wages, taxes, benefits and deductions before each disclosed cash component reconciles independently" : ze?.provider === "hubspot" ? "HubSpot associations flow through approved identity links and contract proposals; CRM never posts accounting" : `${Ne.length} active mapping${Ne.length === 1 ? "" : "s"} · records become drafts, never automatically posted journals` })]
				}), A.loading ? /* @__PURE__ */ (0, b.jsx)(be, {}) : A.error ? /* @__PURE__ */ (0, b.jsx)(Se, {
					error: A.error,
					retry: A.refresh
				}) : /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "Provider accounting application queue",
					emptyTitle: "No synchronized records",
					emptyDetail: "Run a provider synchronization to stage normalized records for review.",
					columns: [
						"Type",
						"Provider ID",
						"Operation",
						"Effective",
						"Status",
						"Action"
					],
					rows: Me.map((t) => [
						w(t.object_type),
						t.external_id,
						w(t.operation),
						t.effective_at ? t.effective_at.slice(0, 10) : "—",
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
						["staged", "error"].includes(t.status) && e("operate") ? ze?.provider === "plaid" && t.object_type === "bank_transaction" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => me(t),
							children: "Review bank feed"
						}) : ze?.provider === "stripe" && t.object_type.startsWith("stripe_") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => ge(t),
							children: "Reconcile Stripe"
						}) : ze?.provider === "gusto" && t.object_type === "payroll_run" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => xe(t),
							children: "Review payroll"
						}) : ze?.provider === "hubspot" && ["hubspot_company", "hubspot_product"].includes(t.object_type) ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => ne(t),
							children: "Link identity"
						}) : ze?.provider === "hubspot" && t.object_type === "hubspot_deal" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => De(t),
							children: "Prepare contract"
						}) : ze?.provider === "hubspot" ? "Association component" : /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => fe(t),
							children: "Review mapping"
						}) : t.applied_entity_id ? t.applied_entity_type === "bank_feed_transaction" ? "Bank feed applied" : t.applied_entity_type === "stripe_reconciliation" ? "Stripe reconciled" : t.applied_entity_type === "payroll_run" ? "Payroll subledger applied" : t.applied_entity_type?.startsWith("crm_") ? "CRM handoff controlled" : `Draft ${t.applied_entity_id}` : "—"
					])
				})] }) : /* @__PURE__ */ (0, b.jsx)(ye, {
					title: "No connector configured",
					detail: "Configure a provider connection before building an accounting mapping."
				})
			}),
			ze?.provider === "stripe" && /* @__PURE__ */ (0, b.jsxs)(P, {
				title: "Stripe settlement ledger",
				subtitle: "Immutable provider versions linked to contracts, AR activity, fees and matched bank deposits",
				children: [/* @__PURE__ */ (0, b.jsx)("div", {
					className: "workflow-toolbar",
					children: /* @__PURE__ */ (0, b.jsxs)("span", { children: [
						Pe.metrics?.matched || 0,
						" matched ·",
						" ",
						Pe.metrics?.components || 0,
						" payout components ·",
						" ",
						Pe.metrics?.exceptions || 0,
						" exceptions"
					] })
				}), /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "Stripe reconciliation decisions",
					emptyTitle: "No reconciled Stripe activity",
					emptyDetail: "Synchronize Stripe and reconcile staged source versions above.",
					columns: [
						"Type",
						"Stripe ID",
						"Amount",
						"Folio target",
						"Status",
						"Reviewed by"
					],
					rows: Pe.records.map((e) => [
						w(e.object_type),
						e.external_id,
						Number.isSafeInteger(e.amount_cents) ? S(e.amount_cents) : "—",
						e.matched_entity_type ? `${w(e.matched_entity_type)} ${e.matched_entity_id}` : e.status === "component" ? `Payout ${e.payout_external_id}` : "—",
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status }),
						e.approved_by
					])
				})]
			}),
			ze?.provider === "gusto" && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsxs)(P, {
				title: "Payroll accrual ledger",
				subtitle: "Gross wages, employer costs and employee deductions with source-version and journal lineage",
				children: [/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "workflow-toolbar",
					children: [/* @__PURE__ */ (0, b.jsxs)("span", { children: [
						Fe.metrics?.runs || 0,
						" current runs · ",
						Fe.metrics?.draft_accruals || 0,
						" ",
						"accrual drafts · ",
						Fe.metrics?.open_settlements || 0,
						" settlement actions"
					] }), /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: A.refresh,
						children: "Refresh posting state"
					})]
				}), /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "Native payroll subledger",
					emptyTitle: "No applied payroll runs",
					emptyDetail: "Synchronize Gusto and approve a validated payroll source version above.",
					columns: [
						"Check date",
						"Gusto payroll",
						"Gross pay",
						"Employer cost",
						"Journal",
						"Status"
					],
					rows: Fe.runs.map((e) => [
						e.check_date,
						e.external_id,
						S(e.gross_pay_cents),
						S(e.gross_pay_cents + e.employer_taxes_cents + e.employer_benefits_cents + e.reimbursements_cents),
						e.accounting_journal_id ? `${w(e.accounting_status)} · ${e.accounting_journal_id}` : "No journal",
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
					])
				})]
			}), /* @__PURE__ */ (0, b.jsx)(P, {
				title: "Payroll settlement queue",
				subtitle: "Each provider-disclosed debit clears its own liability, posts independently, then ties to Plaid",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "Gusto cash and liability settlements",
					emptyTitle: "No provider-initiated payroll debits",
					emptyDetail: "Manual checks and employer-paid liabilities remain in the GL; Gusto bank debits appear here.",
					columns: [
						"Payroll",
						"Component",
						"Expected",
						"Liability",
						"State",
						"Action"
					],
					rows: Fe.runs.flatMap((t) => t.settlements.map((n) => [
						`${t.external_id} · ${t.check_date}`,
						w(n.component_type),
						S(n.expected_cents),
						n.liability_account_code,
						/* @__PURE__ */ (0, b.jsx)(L, { value: n.effective_status }),
						e("operate") && n.effective_status === "open" ? t.accounting_status === "posted" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => x({
								...n,
								payroll_external_id: t.external_id,
								check_date: t.check_date
							}),
							children: "Prepare settlement"
						}) : "Post accrual first" : e("operate") && n.effective_status === "posted" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => C({
								...n,
								payroll_external_id: t.external_id,
								check_date: t.check_date
							}),
							children: "Reconcile bank match"
						}) : n.effective_status === "draft" ? `Post draft ${n.journal_entry_id}` : n.effective_status === "reconciled" ? `Plaid ${n.bank_feed_transaction_id}` : "—"
					]))
				})
			})] }),
			ze?.provider === "hubspot" && /* @__PURE__ */ (0, b.jsxs)(P, {
				title: "CRM contract proposal ledger",
				subtitle: "Closed-won deals remain non-accounting proposals until identity, economics, dates, SSPs and controller approval are complete",
				children: [/* @__PURE__ */ (0, b.jsx)("div", {
					className: "workflow-toolbar",
					children: /* @__PURE__ */ (0, b.jsxs)("span", { children: [
						Le.metrics?.prepared || 0,
						" prepared · ",
						Le.metrics?.approved || 0,
						" approved ·",
						" ",
						Le.metrics?.applied || 0,
						" contracts created"
					] })
				}), /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "HubSpot to Folio controlled handoffs",
					emptyTitle: "No contract proposals",
					emptyDetail: "Link company and product identities, then prepare a synchronized closed-won deal above.",
					columns: [
						"Deal",
						"Customer",
						"Contract",
						"Value",
						"Status",
						"Action"
					],
					rows: Le.proposals.map((t) => [
						t.deal_external_id,
						t.customer_name,
						t.contract_number,
						S(t.transaction_price_cents),
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
						e("post") && t.status === "prepared" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => ae(t),
							children: "Approve proposal"
						}) : e("operate") && t.status === "approved" ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => je(t),
							children: "Create contract"
						}) : t.status === "applied" ? `Contract ${t.contract_id}` : "—"
					])
				})]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Integration exception queue",
				subtitle: "Provider failures remain visible until an authorized operator records a disposition",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Created",
						"Connection",
						"Code",
						"Message",
						"Status",
						"Action"
					],
					rows: j.dead_letters.map((t) => [
						(/* @__PURE__ */ new Date(`${t.created_at}Z`)).toLocaleString(),
						j.connections.find((e) => e.id === t.connection_id)?.display_name,
						t.error_code,
						t.error_message,
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
						t.status === "open" && e("operate") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => ue(t),
							children: "Resolve"
						}) : "—"
					])
				})
			}),
			i && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Configure connector",
				subtitle: "Enter secret-manager reference names only. Tokens and client secrets never belong in this form.",
				close: () => a(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: oe,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Provider",
								name: "provider",
								as: "select",
								options: j.catalog.map((e) => [e.provider, e.name])
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Environment",
								name: "environment",
								as: "select",
								options: [["sandbox", "Sandbox"], ["production", "Production"]]
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Connection name",
							name: "display_name"
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "External account ID",
							name: "external_account_id",
							required: !1,
							hint: "Optional for hosted OAuth; Folio binds the provider account returned by authorization."
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "OAuth scopes",
							name: "scopes",
							required: !1,
							placeholder: "crm.objects.companies.read, crm.objects.deals.read",
							hint: "Comma-separated. HubSpot requires explicit read scopes; Stripe accepts read_only or read_write."
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Credential secret reference",
								name: "credential_secret_ref",
								placeholder: "STRIPE_OAUTH_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Webhook secret reference",
								name: "webhook_secret_ref",
								required: !1,
								placeholder: "STRIPE_WEBHOOK_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => a(!1),
							label: "Save configuration"
						})
					]
				})
			}),
			c && ze && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Add versioned accounting mapping",
				subtitle: `Map one ${ze.display_name} source field into the controlled journal draft shape.`,
				close: () => l(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: de,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Provider object type",
								name: "object_type",
								placeholder: "bank_transaction"
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Source field path",
								name: "source_field",
								placeholder: "amount_cents"
							})]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Journal target",
								name: "target_field",
								as: "select",
								options: [
									["date", "Date"],
									["memo", "Memo"],
									["amount_cents", "Amount (cents)"],
									["debit_account_code", "Debit account code"],
									["credit_account_code", "Credit account code"]
								]
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Transform",
								name: "transform",
								as: "select",
								options: [
									["identity", "Use as supplied"],
									["date", "ISO date"],
									["cents", "Integer cents"],
									["lowercase", "Lowercase"],
									["uppercase", "Uppercase"]
								]
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Fallback value",
							name: "default",
							required: !1,
							hint: "Useful for a fixed Folio account code. Folio increments mapping versions automatically."
						}),
						/* @__PURE__ */ (0, b.jsxs)("label", {
							className: "check-row",
							children: [/* @__PURE__ */ (0, b.jsx)("input", {
								type: "checkbox",
								name: "required"
							}), "Fail validation when the source field and fallback are both empty"]
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => l(!1),
							label: "Activate mapping"
						})
					]
				})
			}),
			u && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Review accounting application",
				subtitle: `${w(u.record.object_type)} · ${u.record.external_id}`,
				close: () => d(null),
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "application-review",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Date",
									value: u.mapped.date || "Not mapped"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Amount",
									value: u.mapped.amount_cents ? S(u.mapped.amount_cents) : "Not mapped"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Debit",
									value: u.mapped.debit_account_code || "Not mapped"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Credit",
									value: u.mapped.credit_account_code || "Not mapped"
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: u.ready ? "control-note" : "control-note warning-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: u.ready ? "Ready for approval" : "Mapping needs attention" }), /* @__PURE__ */ (0, b.jsx)("span", { children: u.ready ? u.mapped.memo : u.issues.join(" · ") })]
						}),
						u.ready ? /* @__PURE__ */ (0, b.jsxs)("form", {
							className: "form-stack",
							onSubmit: pe,
							children: [
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Approval note",
									name: "approval_note",
									as: "textarea",
									minLength: "5",
									placeholder: "Describe the source evidence and account mapping reviewed."
								}),
								/* @__PURE__ */ (0, b.jsx)("p", {
									className: "form-hint",
									children: "Approval creates a draft only. A user with posting permission must independently review and post it from Journals."
								}),
								/* @__PURE__ */ (0, b.jsx)(R, {
									close: () => d(null),
									label: O ? "Applying…" : "Approve and create draft"
								})
							]
						}) : /* @__PURE__ */ (0, b.jsx)("div", {
							className: "dialog-actions",
							children: /* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								onClick: () => d(null),
								children: "Return to mappings"
							})
						})
					]
				})
			}),
			re && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Approve CRM contract proposal",
				subtitle: `${re.contract_number} · prepared by ${re.prepared_by}`,
				close: () => ae(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ae,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Customer",
									value: re.customer_name
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Value",
									value: S(re.transaction_price_cents)
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Service period",
									value: `${re.start_date} → ${re.end_date}`
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Prepared by",
									value: re.prepared_by
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Controller approval rationale",
							name: "approval_note",
							as: "textarea",
							minLength: "5",
							placeholder: "Confirm executed evidence, customer identity, consideration, dates, SSP and recognition policy."
						}),
						/* @__PURE__ */ (0, b.jsx)("p", {
							className: "form-hint",
							children: "Folio rejects self-approval. Approval still does not create a contract; the proposal returns to the queue for a deliberate apply action."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => ae(null),
							label: "Approve proposal"
						})
					]
				})
			}),
			E && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: `Link HubSpot ${E.object_type === "hubspot_company" ? "company" : "product"}`,
				subtitle: `${E.external_id} · immutable identity decision`,
				close: () => ne(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Oe,
					children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: E.object_type === "hubspot_company" ? "Folio customer" : "Folio product",
							name: "local_id",
							as: "select",
							options: (E.object_type === "hubspot_company" ? Re.customers : Re.products).map((e) => [e.id, E.object_type === "hubspot_company" ? e.name : `${e.sku} · ${e.name}`])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Identity approval rationale",
							name: "approval_note",
							as: "textarea",
							minLength: "5",
							placeholder: "Document the legal name, domain, SKU or catalog evidence used to establish identity."
						}),
						/* @__PURE__ */ (0, b.jsx)("p", {
							className: "form-hint",
							children: "An external identity cannot later be silently relinked to a different Folio record."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => ne(null),
							label: O ? "Linking…" : "Approve identity link",
							disabled: O
						})
					]
				})
			}),
			T && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Prepare HubSpot contract proposal",
				subtitle: `${T.record.external_id} · no journal posting`,
				close: () => te(null),
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "application-review",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Customer",
									value: T.customer?.name || "Not linked"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Deal",
									value: T.deal.name || T.record.external_id
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Amount",
									value: S(T.deal.amount_cents)
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Currency",
									value: T.deal.currency
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: T.ready ? "control-note" : "control-note warning-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: T.ready ? "Association and amount crossfoot passed" : "Contract handoff blocked" }), /* @__PURE__ */ (0, b.jsx)("span", { children: T.ready ? `${T.line_items.length} linked performance-obligation candidate${T.line_items.length === 1 ? "" : "s"}` : T.issues.join(" · ") })]
						}),
						T.ready ? /* @__PURE__ */ (0, b.jsxs)("form", {
							className: "form-stack",
							onSubmit: ke,
							children: [
								/* @__PURE__ */ (0, b.jsx)(I, {
									caption: "Synchronized deal economics",
									columns: [
										"Line item",
										"Product",
										"Quantity",
										"Amount",
										"SSP"
									],
									rows: T.line_items.map((e) => [
										e.description,
										e.product_name,
										e.quantity,
										S(e.line_amount_cents),
										S(e.ssp_cents)
									])
								}),
								/* @__PURE__ */ (0, b.jsxs)("div", {
									className: "form-grid",
									children: [/* @__PURE__ */ (0, b.jsx)(z, {
										label: "Folio entity",
										name: "entity_id",
										as: "select",
										options: Re.entities.map((e) => [e.id, e.name])
									}), /* @__PURE__ */ (0, b.jsx)(z, {
										label: "Contract number",
										name: "contract_number",
										placeholder: `HS-${T.record.external_id}`
									})]
								}),
								/* @__PURE__ */ (0, b.jsxs)("div", {
									className: "form-grid",
									children: [
										/* @__PURE__ */ (0, b.jsx)(z, {
											label: "Signed date",
											name: "signed_date",
											type: "date",
											defaultValue: T.deal.close_date
										}),
										/* @__PURE__ */ (0, b.jsx)(z, {
											label: "Service start",
											name: "start_date",
											type: "date"
										}),
										/* @__PURE__ */ (0, b.jsx)(z, {
											label: "Service end",
											name: "end_date",
											type: "date"
										})
									]
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Recognition policy",
									name: "recognition_method",
									as: "select",
									options: [
										["straight_line", "Straight line"],
										["point_in_time", "Point in time"],
										["usage", "Usage"],
										["milestone", "Milestone"]
									]
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Preparation rationale",
									name: "approval_note",
									as: "textarea",
									minLength: "5",
									placeholder: "Reference the executed agreement, service dates, consideration, SSP evidence and policy conclusion."
								}),
								/* @__PURE__ */ (0, b.jsx)("p", {
									className: "form-hint",
									children: "Preparation does not create a contract. A different controller approves the immutable proposal before a separate apply action creates schedules."
								}),
								/* @__PURE__ */ (0, b.jsx)(R, {
									close: () => te(null),
									label: O ? "Preparing…" : "Prepare controlled proposal",
									disabled: O
								})
							]
						}) : /* @__PURE__ */ (0, b.jsx)(R, {
							close: () => te(null),
							label: "Close and resolve links"
						})
					]
				})
			}),
			f && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Review native bank-feed application",
				subtitle: `Plaid transaction · ${f.record.external_id}`,
				close: () => p(null),
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "application-review",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Cash account",
									value: f.feed_account ? `${f.feed_account.cash_account_code} · ${f.feed_account.display_name}` : "Not bound"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Date",
									value: f.normalized.occurred_on || f.previous?.transaction_date || "—"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Cash amount",
									value: Number.isSafeInteger(f.normalized.cash_amount_cents) ? S(f.normalized.cash_amount_cents) : "Source removal"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Operation",
									value: w(f.record.operation)
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: f.ready ? "control-note" : "control-note warning-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: f.ready ? "Ready for bank review" : "Binding or source issue" }), /* @__PURE__ */ (0, b.jsx)("span", { children: f.ready ? "Folio will match one unique posted cash line. It will not create, post, reverse, or modify a journal." : f.issues.join(" · ") })]
						}),
						f.ready ? /* @__PURE__ */ (0, b.jsxs)("form", {
							className: "form-stack",
							onSubmit: he,
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Reviewer rationale",
								name: "approval_note",
								as: "textarea",
								hint: "Confirm the source version, account binding and effect of a modification or removal."
							}), /* @__PURE__ */ (0, b.jsx)(R, {
								close: () => p(null),
								label: O ? "Applying…" : "Apply to bank feed",
								disabled: O
							})]
						}) : /* @__PURE__ */ (0, b.jsx)(R, {
							close: () => p(null),
							label: "Close and correct"
						})
					]
				})
			}),
			m && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Reconcile native Stripe activity",
				subtitle: `${w(m.record.object_type)} · ${m.record.external_id}`,
				close: () => h(null),
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "application-review",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Operation",
									value: w(m.record.operation)
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Amount",
									value: Number.isSafeInteger(m.normalized.amount_cents) ? S(m.normalized.amount_cents) : "—"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Currency",
									value: m.normalized.currency?.toUpperCase() || "—"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Target",
									value: w(m.target_type)
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: m.ready ? "control-note" : "control-note warning-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: m.ready ? "Ready for controller reconciliation" : "Reconciliation blocked" }), /* @__PURE__ */ (0, b.jsx)("span", { children: m.ready ? "This records a source-to-subledger decision only. Folio will not create or post a duplicate journal." : m.issues.join(" · ") })]
						}),
						m.ready ? /* @__PURE__ */ (0, b.jsxs)("form", {
							className: "form-stack",
							onSubmit: ve,
							children: [
								!["component", "removed"].includes(m.target_type) && /* @__PURE__ */ (0, b.jsx)(z, {
									label: `Eligible ${w(m.target_type)}`,
									name: "target_entity_id",
									as: "select",
									options: m.candidates.map((e) => [e.id, `${e.label || e.name || e.id}${Number.isSafeInteger(e.amount_cents) ? ` · ${S(e.amount_cents)}` : ""}`])
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Controller rationale",
									name: "approval_note",
									as: "textarea",
									minLength: "5",
									placeholder: "Document the customer identity, amount, currency and supporting evidence reviewed."
								}),
								/* @__PURE__ */ (0, b.jsx)(R, {
									close: () => h(null),
									label: O ? "Reconciling…" : "Approve reconciliation",
									disabled: O
								})
							]
						}) : /* @__PURE__ */ (0, b.jsx)(R, {
							close: () => h(null),
							label: "Close and resolve"
						})
					]
				})
			}),
			g && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Review native payroll accrual",
				subtitle: `Gusto payroll · ${g.record.external_id}`,
				close: () => v(null),
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "application-review",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "source-summary",
							children: [
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Check date",
									value: g.normalized.check_date || "—"
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Gross pay",
									value: S(g.normalized.gross_pay_cents)
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Employer taxes",
									value: S(g.normalized.employer_taxes_cents)
								}),
								/* @__PURE__ */ (0, b.jsx)(F, {
									label: "Company debit",
									value: S(g.normalized.company_debit_cents)
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: g.ready ? "control-note" : "control-note warning-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: g.ready ? "Crossfoot passed" : "Payroll blocked" }), /* @__PURE__ */ (0, b.jsx)("span", { children: g.ready ? `${g.journal_lines.length || "Reversal"} controlled journal lines · ${g.settlement_components.length} disclosed bank-debit components` : g.issues.join(" · ") })]
						}),
						g.ready ? /* @__PURE__ */ (0, b.jsxs)("form", {
							className: "form-stack",
							onSubmit: Ce,
							children: [
								g.journal_lines.length > 0 && /* @__PURE__ */ (0, b.jsx)(I, {
									caption: "Payroll journal blueprint",
									columns: [
										"Account",
										"Description",
										"Debit",
										"Credit"
									],
									rows: g.journal_lines.map((e) => [
										e.account_code,
										e.description,
										e.side === "debit" ? S(e.amount_cents) : "—",
										e.side === "credit" ? S(e.amount_cents) : "—"
									])
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Controller rationale",
									name: "approval_note",
									as: "textarea",
									minLength: "5",
									placeholder: "Document the payroll register, totals crossfoot, period, taxes, benefits and debit evidence reviewed."
								}),
								/* @__PURE__ */ (0, b.jsx)("p", {
									className: "form-hint",
									children: "Approval creates an accrual or reversal draft only. Another authorized user must post it before settlement can begin."
								}),
								/* @__PURE__ */ (0, b.jsx)(R, {
									close: () => v(null),
									label: O ? "Applying…" : "Approve payroll draft",
									disabled: O
								})
							]
						}) : /* @__PURE__ */ (0, b.jsx)(R, {
							close: () => v(null),
							label: "Close and resolve"
						})
					]
				})
			}),
			y && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Prepare payroll settlement",
				subtitle: `${y.payroll_external_id} · ${w(y.component_type)} · ${S(y.expected_cents)}`,
				close: () => x(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: we,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Cash account",
								name: "cash_account_id",
								as: "select",
								options: Ie.filter((e) => e.active && e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Settlement date",
								name: "settlement_date",
								type: "date",
								defaultValue: y.check_date
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Preparation rationale",
							name: "approval_note",
							as: "textarea",
							minLength: "5",
							placeholder: "Confirm the Gusto debit component, liability account, cash account and expected date."
						}),
						/* @__PURE__ */ (0, b.jsx)("p", {
							className: "form-hint",
							children: "This creates a draft liability-clearing entry. A different user posts it; Plaid then matches the posted cash line."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => x(null),
							label: O ? "Preparing…" : "Create settlement draft",
							disabled: O
						})
					]
				})
			}),
			ee && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Reconcile payroll settlement",
				subtitle: `${ee.payroll_external_id} · ${w(ee.component_type)} · ${S(ee.expected_cents)}`,
				close: () => C(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ee,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "control-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "Exact three-way evidence required" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Folio will accept only one matched Plaid transaction tied to this settlement journal's posted cash line." })]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Reconciliation rationale",
							name: "approval_note",
							as: "textarea",
							minLength: "5",
							placeholder: "Confirm the Gusto component, posted liability clearing and Plaid bank evidence."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => C(null),
							label: O ? "Reconciling…" : "Approve three-way match",
							disabled: O
						})
					]
				})
			})
		]
	});
}
function se({ can: e, notify: t }) {
	let [n, r] = (0, _.useState)("open"), [i, a] = (0, _.useState)(1), o = ie(() => Promise.all([
		D("/api/imports/templates"),
		D("/api/imports/batches"),
		D("/api/accounts"),
		D("/api/imports/mapping-profiles"),
		D("/api/imports/duplicate-policies")
	]), []), s = ie(() => D(`/api/imports/exceptions?status=${encodeURIComponent(n)}&page=${i}&page_size=20`), [n, i]), [c, l] = (0, _.useState)(!1), [u, d] = (0, _.useState)(1), [f, p] = (0, _.useState)(T()), [m, h] = (0, _.useState)(null), [g, v] = (0, _.useState)(!1), [y, x] = (0, _.useState)(""), [ee, S] = (0, _.useState)(!1), [C, ae] = (0, _.useState)({
		template_key: "customers",
		field_key: "name",
		threshold_percent: "88",
		active: !0
	}), [O, k] = (0, _.useState)(null), [A, j] = (0, _.useState)(""), [oe, se] = (0, _.useState)(null);
	if (o.loading || s.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (o.error || s.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: o.error || s.error,
		retry: () => Promise.all([o.refresh(), s.refresh()])
	});
	let [ce, le, ue, M, de] = o.data, { items: fe, page: pe, open_total: me } = s.data, he = ce.find((e) => e.key === f.template_key) || ce[0], ge = M.find((e) => e.id === f.mapping_profile_id), F = te(f.csv), ye = he.fields.filter((e) => e.required).every((e) => f.mapping[e.key]), xe = le.filter((e) => `${e.filename} ${e.template_key} ${e.status}`.toLowerCase().includes(y.trim().toLowerCase())), we = m?.mapping_profile_id ? M.find((e) => e.id === m.mapping_profile_id) : null, Ee = (ce.find((e) => e.key === C.template_key) || ce[0]).fields.filter((e) => e.type === "string");
	function De() {
		p(T()), d(1), l(!0);
	}
	function Oe(e) {
		p((t) => ({
			...t,
			...e
		}));
	}
	function ke(e) {
		p(T(e));
	}
	function Ae(e = "customers") {
		let t = ce.find((t) => t.key === e) || ce[0], n = de.find((e) => e.template_key === t.key), r = t.fields.filter((e) => e.type === "string");
		ae({
			template_key: t.key,
			field_key: n?.field_key || r[0]?.key || "",
			threshold_percent: String(n?.threshold_percent || 88),
			active: n?.active ?? !0
		}), S(!0);
	}
	async function je(e) {
		e.preventDefault(), v(!0);
		try {
			let e = await D("/api/imports/duplicate-policies", {
				method: "POST",
				body: {
					...C,
					threshold_percent: Number(C.threshold_percent)
				}
			});
			await o.refresh(), S(!1), t({
				kind: "success",
				message: `${w(e.template_key)} candidate policy v${e.version} saved; ${e.indexed_rows} applied rows indexed.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			v(!1);
		}
	}
	async function Me(e) {
		let n = e.target.files?.[0];
		if (!n) return;
		if (n.size > 5e6) {
			t({
				kind: "error",
				message: "CSV files are limited to 5 MB."
			}), e.target.value = "";
			return;
		}
		let r = await n.text();
		Oe({
			filename: n.name,
			csv: r,
			mapping: ne(F, te(r)) ? f.mapping : {}
		});
	}
	function Ne() {
		let e = new Blob([`${he.sample_header}\n`], { type: "text/csv;charset=utf-8" }), t = URL.createObjectURL(e), n = document.createElement("a");
		n.href = t, n.download = `${he.key}-v${he.version}-template.csv`, document.body.append(n), n.click(), n.remove(), URL.revokeObjectURL(t);
	}
	function Pe() {
		if (!f.filename.trim() || !f.csv.trim()) {
			t({
				kind: "error",
				message: "Choose a CSV file or paste CSV data first."
			});
			return;
		}
		if (!F.length) {
			t({
				kind: "error",
				message: "The CSV header row could not be read."
			});
			return;
		}
		if (f.template_key === "bank_transactions" && ![
			f.cash_account_id,
			f.start_date,
			f.end_date,
			f.opening,
			f.closing
		].every((e) => String(e).trim())) {
			t({
				kind: "error",
				message: "Complete every bank statement control total."
			});
			return;
		}
		Oe({ mapping: E(he, F, f.mapping) }), d(2);
	}
	function Fe(e) {
		let t = M.find((t) => t.id === e);
		Oe({
			mapping_profile_id: t?.id || "",
			mapping: t ? E(he, F, t.mapping) : E(he, F, f.mapping)
		});
	}
	async function Ie(e) {
		if (e.preventDefault(), u === 3) {
			v(!0);
			try {
				let e = f.template_key === "bank_transactions" ? {
					cash_account_id: Number(f.cash_account_id),
					start_date: f.start_date,
					end_date: f.end_date,
					opening_cents: Math.round(Number(f.opening) * 100),
					closing_cents: Math.round(Number(f.closing) * 100)
				} : {}, n = await D("/api/jobs/imports/stage", {
					method: "POST",
					body: {
						template_key: f.template_key,
						filename: f.filename,
						csv: f.csv,
						mapping: f.mapping,
						mapping_profile_id: f.mapping_profile_id || void 0,
						restaged_from_batch_id: f.restaged_from_batch_id || void 0,
						options: e
					}
				});
				se(n), l(!1), t({
					kind: "success",
					message: "Import source secured and queued for validation. No accounting records were created."
				});
				let r = await D(`/api/imports/batches/${(await re(n.id, se)).result.batch_id}?page=1&page_size=100`), i = !1, a = "";
				if (f.mapping_profile_name.trim()) try {
					await D("/api/imports/mapping-profiles", {
						method: "POST",
						body: {
							name: f.mapping_profile_name,
							template_key: f.template_key,
							mapping: f.mapping
						}
					}), i = !0;
				} catch (e) {
					a = e.message;
				}
				h(r), await Promise.all([o.refresh(), s.refresh()]), t({
					kind: a ? "error" : "success",
					message: a ? `Import validated, but the optional mapping profile was not saved: ${a}` : `Import validation completed and is ready for review${i ? "; mapping profile saved" : ""}.`
				});
			} catch (e) {
				t({
					kind: "error",
					message: e.message
				});
			} finally {
				v(!1);
			}
		}
	}
	async function Le(e, n = 1) {
		try {
			h(await D(`/api/imports/batches/${e}?page=${n}&page_size=100`));
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function Re() {
		v(!0);
		try {
			let e = await D(`/api/imports/batches/${m.id}/correction-source`);
			p({
				...T(e.template_key),
				filename: e.filename,
				csv: e.csv,
				mapping: e.mapping,
				restaged_from_batch_id: e.source_batch_id,
				correction_source_filename: e.source_filename,
				correction_row_count: e.row_count,
				correction_scope: e.scope,
				cash_account_id: e.options.cash_account_id ? String(e.options.cash_account_id) : "",
				start_date: e.options.start_date || "",
				end_date: e.options.end_date || "",
				opening: e.options.opening_cents === void 0 ? "" : String(e.options.opening_cents / 100),
				closing: e.options.closing_cents === void 0 ? "" : String(e.options.closing_cents / 100)
			}), d(1), l(!0), t({
				kind: "success",
				message: `${e.row_count} ${e.scope === "full_replacement" ? "source" : "exception"} row${e.row_count === 1 ? "" : "s"} loaded for correction with source lineage.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			v(!1);
		}
	}
	async function ze() {
		v(!0);
		try {
			let e = m.error_count > 0 || m.duplicate_count > 0;
			await D(`/api/imports/batches/${m.id}/approve`, {
				method: "POST",
				body: { apply_valid_rows: e }
			});
			let n = await D("/api/jobs/imports/apply", {
				method: "POST",
				body: { batch_id: m.id }
			});
			se(n), t({
				kind: "success",
				message: "Approved import queued for controlled application."
			});
			let r = await D(`/api/imports/batches/${(await re(n.id, se)).result.batch_id}?page=1&page_size=100`);
			h(r), await Promise.all([o.refresh(), s.refresh()]), t({
				kind: "success",
				message: `${r.applied_count} validated rows applied with retained lineage.`
			});
		} catch (e) {
			try {
				let e = await D(`/api/imports/batches/${m.id}?page=1&page_size=100`);
				h(e), await Promise.all([o.refresh(), s.refresh()]);
			} catch {}
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			v(!1);
		}
	}
	async function Be(e) {
		try {
			await D("/api/imports/exceptions/status", {
				method: "POST",
				body: {
					id: e.id,
					status: "resolved",
					resolution: "Reviewed in the import operations workbench"
				}
			}), await Promise.all([o.refresh(), s.refresh()]), t({
				kind: "success",
				message: "Import exception resolved."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function Ve(e) {
		e.preventDefault(), v(!0);
		try {
			let e = await D(`/api/imports/exceptions/${O.id}/accept-distinct`, {
				method: "POST",
				body: { resolution: A }
			});
			m?.id === e.batch.id && h(e.batch), await Promise.all([o.refresh(), s.refresh()]), k(null), j(""), t({
				kind: "success",
				message: "Candidate accepted as distinct; the reviewer rationale and match evidence were retained."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		} finally {
			v(!1);
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Controlled imports",
				detail: "Versioned templates, validation previews, duplicate controls and traceable application",
				action: (e("operate") || e("admin")) && /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "button-row",
					children: [e("admin") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => Ae(),
						children: "Matching policies"
					}), e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "primary",
						onClick: De,
						children: "New import"
					})]
				})
			}),
			oe && /* @__PURE__ */ (0, b.jsx)(P, {
				title: "Import processing",
				subtitle: "Durable work continues if this page closes; retry and failure details remain auditable.",
				children: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "review-strip",
					"aria-live": "polite",
					children: [/* @__PURE__ */ (0, b.jsx)(ve, { items: [
						["Operation", w(oe.kind)],
						["Status", /* @__PURE__ */ (0, b.jsx)(L, { value: oe.status })],
						["Attempts", `${oe.attempts} of ${oe.max_attempts}`],
						["Outcome", oe.result?.batch_id ? `Batch ${oe.result.batch_id.slice(0, 8)}…` : oe.last_error || "Waiting for a worker"]
					] }), oe.status === "completed" && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => se(null),
						children: "Dismiss"
					})]
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Templates",
						value: ce.length,
						detail: "Versioned entity formats"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Staged",
						value: le.filter((e) => e.status === "staged").length,
						detail: "Awaiting approval"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Applied rows",
						value: le.reduce((e, t) => e + t.applied_count, 0),
						detail: "With entity lineage"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Open exceptions",
						value: me,
						detail: "Validation or apply issues",
						warning: me > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Duplicate candidate controls",
				subtitle: "Versioned tenant policies compare normalized text without auto-merging records",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Template",
						"Match field",
						"Threshold",
						"Indexed history",
						"Status",
						"Action"
					],
					caption: "Configured duplicate candidate policies",
					emptyTitle: "Exact-key checks only",
					emptyDetail: "An administrator can add a fuzzy candidate policy for a text field.",
					rows: de.map((t) => [
						w(t.template_key),
						w(t.field_key),
						`${t.threshold_percent}% · v${t.version}`,
						t.indexed_rows,
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.active ? "active" : "disabled" }),
						e("admin") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => Ae(t.template_key),
							children: "Configure"
						}) : "—"
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsxs)(P, {
					title: "Import batches",
					subtitle: "Files remain staged until an operator reviews the preview",
					children: [/* @__PURE__ */ (0, b.jsxs)("div", {
						className: "workflow-toolbar",
						children: [/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Find a batch",
							type: "search",
							value: y,
							onChange: (e) => x(e.target.value),
							placeholder: "Filename, template or status",
							required: !1
						}), /* @__PURE__ */ (0, b.jsxs)("span", { children: [xe.length, " shown"] })]
					}), /* @__PURE__ */ (0, b.jsx)(I, {
						columns: [
							"File",
							"Template",
							"Rows",
							"Valid",
							"Exceptions",
							"Status",
							"Review"
						],
						caption: "Import batches",
						emptyTitle: "No matching batches",
						emptyDetail: "Change the search or start a new controlled import.",
						rows: xe.map((e) => [
							e.filename,
							w(e.template_key),
							e.row_count,
							e.valid_count,
							e.error_count + e.duplicate_count,
							/* @__PURE__ */ (0, b.jsx)(L, { value: e.status }),
							/* @__PURE__ */ (0, b.jsx)("button", {
								className: "small-button",
								onClick: () => Le(e.id),
								children: "Review"
							})
						])
					})]
				}), /* @__PURE__ */ (0, b.jsxs)(P, {
					title: "Exception queue",
					subtitle: "Warnings and blocking rows require an explicit disposition",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "workflow-toolbar",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Exception status",
								as: "select",
								value: n,
								onChange: (e) => {
									r(e.target.value), a(1);
								},
								options: [
									["open", "Open"],
									["acknowledged", "Acknowledged"],
									["resolved", "Resolved"],
									["ignored", "Ignored"],
									["all", "All statuses"]
								]
							}), /* @__PURE__ */ (0, b.jsx)("span", { children: pe.total ? `${pe.from}–${pe.to} of ${pe.total}` : "Queue clear" })]
						}),
						/* @__PURE__ */ (0, b.jsx)(I, {
							columns: [
								"Code",
								"Severity",
								"Message",
								"Status",
								"Resolution",
								"Action"
							],
							caption: "Import exception queue",
							emptyTitle: "No matching exceptions",
							emptyDetail: "This queue is clear for the selected status.",
							rows: fe.map((t) => [
								w(t.code),
								/* @__PURE__ */ (0, b.jsx)(L, { value: t.severity }),
								t.message,
								/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
								t.resolution ? `${t.resolution} · ${t.owner || "reviewer"}` : "—",
								t.status === "open" && e("operate") ? t.code === "FUZZY_DUPLICATE" ? /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => {
										k(t), j("");
									},
									children: "Compare"
								}) : /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => Be(t),
									children: "Resolve"
								}) : "—"
							])
						}),
						pe.total_pages > 1 && /* @__PURE__ */ (0, b.jsxs)("nav", {
							className: "table-pagination",
							"aria-label": "Import exception pages",
							children: [
								/* @__PURE__ */ (0, b.jsx)("button", {
									className: "secondary",
									disabled: pe.page === 1,
									onClick: () => a((e) => e - 1),
									children: "Previous"
								}),
								/* @__PURE__ */ (0, b.jsxs)("span", {
									"aria-live": "polite",
									children: [
										"Page ",
										pe.page,
										" of ",
										pe.total_pages
									]
								}),
								/* @__PURE__ */ (0, b.jsx)("button", {
									className: "secondary",
									disabled: pe.page === pe.total_pages,
									onClick: () => a((e) => e + 1),
									children: "Next"
								})
							]
						})
					]
				})]
			}),
			m && /* @__PURE__ */ (0, b.jsxs)(P, {
				title: `Review ${m.filename}`,
				subtitle: `SHA-256 ${m.file_sha256.slice(0, 16)}… · template v${m.template_version}`,
				children: [
					/* @__PURE__ */ (0, b.jsxs)("div", {
						className: "review-strip",
						children: [/* @__PURE__ */ (0, b.jsx)(ve, { items: [
							["Rows", m.row_count],
							["Valid", m.valid_count],
							["Errors", m.error_count],
							["Duplicates", m.duplicate_count],
							["Candidate policy", m.duplicate_policy ? `${w(m.duplicate_policy.field_key)} · ${m.duplicate_policy.threshold_percent}% · v${m.duplicate_policy.version}` : "Exact natural keys only"],
							["Mapping", we ? `${we.name} · v${m.mapping_profile_version}` : "Exact batch snapshot"],
							["Correction lineage", m.restaged_from_batch_id ? `Restaged from ${m.restaged_from_batch_id.slice(0, 8)}…` : "Original source batch"],
							["Status", /* @__PURE__ */ (0, b.jsx)(L, { value: m.status })]
						] }), /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "button-row",
							children: [(m.error_count > 0 || m.duplicate_count > 0 || m.status === "failed") && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: g,
								onClick: Re,
								children: "Correct and restage"
							}), m.status === "staged" && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
								className: "primary",
								disabled: g || !m.valid_count,
								onClick: ze,
								children: g ? "Applying…" : m.error_count || m.duplicate_count ? "Apply valid rows only" : "Approve and apply"
							})]
						})]
					}),
					/* @__PURE__ */ (0, b.jsx)(I, {
						columns: [
							"CSV row",
							"Natural key",
							"Status",
							"Validation result",
							"Created record"
						],
						caption: `Validation preview for ${m.filename}`,
						rows: m.rows.map((e) => [
							e.row_number,
							e.natural_key,
							/* @__PURE__ */ (0, b.jsx)(L, { value: e.status }),
							e.errors.length ? e.errors.join("; ") : "Passed",
							e.applied_entity_id ? `${w(e.applied_entity_type)} ${e.applied_entity_id}` : "—"
						])
					}),
					m.row_page && m.row_page.total_pages > 1 && /* @__PURE__ */ (0, b.jsxs)("nav", {
						className: "table-pagination",
						"aria-label": "Import validation preview pages",
						children: [
							/* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: m.row_page.page === 1 || g,
								onClick: () => Le(m.id, m.row_page.page - 1),
								children: "Previous 100"
							}),
							/* @__PURE__ */ (0, b.jsxs)("span", {
								"aria-live": "polite",
								children: [
									"Rows ",
									m.row_page.from,
									"–",
									m.row_page.to,
									" of ",
									m.row_page.total_rows,
									" ",
									"· page ",
									m.row_page.page,
									" of ",
									m.row_page.total_pages
								]
							}),
							/* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: m.row_page.page === m.row_page.total_pages || g,
								onClick: () => Le(m.id, m.row_page.page + 1),
								children: "Next 100"
							})
						]
					})
				]
			}),
			ee && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Duplicate candidate policy",
				subtitle: "Choose one text field and a review threshold. Changes are versioned and rebuild the applied-import index.",
				close: () => S(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: je,
					children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Import template",
							as: "select",
							value: C.template_key,
							onChange: (e) => {
								let t = ce.find((t) => t.key === e.target.value), n = de.find((t) => t.template_key === e.target.value), r = t.fields.filter((e) => e.type === "string");
								ae({
									template_key: t.key,
									field_key: n?.field_key || r[0]?.key || "",
									threshold_percent: String(n?.threshold_percent || 88),
									active: n?.active ?? !0
								});
							},
							options: ce.filter((e) => e.fields.some((e) => e.type === "string")).map((e) => [e.key, e.name])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Text field to compare",
							as: "select",
							value: C.field_key,
							onChange: (e) => ae((t) => ({
								...t,
								field_key: e.target.value
							})),
							options: Ee.map((e) => [e.key, e.label])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Similarity threshold",
							type: "number",
							min: "70",
							max: "99",
							value: C.threshold_percent,
							onChange: (e) => ae((t) => ({
								...t,
								threshold_percent: e.target.value
							})),
							hint: "70–99%. Lower values surface more candidates for human review."
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Policy status",
							as: "select",
							value: C.active ? "active" : "disabled",
							onChange: (e) => ae((t) => ({
								...t,
								active: e.target.value === "active"
							})),
							options: [["active", "Active — flag matching candidates"], ["disabled", "Disabled — exact natural keys only"]]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "review-notice",
							role: "note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "Review control" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Candidate rows remain blocked until corrected or explicitly accepted as distinct with a reviewer rationale. Folio never merges records automatically." })]
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => S(!1),
							label: g ? "Saving…" : "Save policy"
						})
					]
				})
			}),
			O && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Compare duplicate candidate",
				subtitle: O.message,
				close: () => k(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ve,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "review-notice",
							role: "note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "No automatic merge" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Accepting makes this row eligible for the batch. The similarity evidence, policy version, reviewer and rationale remain attached to the import history." })]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Reviewer rationale",
							as: "textarea",
							minLength: "8",
							maxLength: "500",
							value: A,
							onChange: (e) => j(e.target.value),
							hint: "Describe the source evidence that proves these are separate records."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => k(null),
							label: g ? "Recording…" : "Accept as distinct"
						})
					]
				})
			}),
			c && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "New controlled import",
				subtitle: "Choose the source, map its columns, then review before server validation. Nothing posts automatically.",
				close: () => l(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ie,
					children: [
						/* @__PURE__ */ (0, b.jsx)("ol", {
							className: "wizard-steps",
							"aria-label": "Import workflow progress",
							children: [
								"Source",
								"Map columns",
								"Review"
							].map((e, t) => /* @__PURE__ */ (0, b.jsxs)("li", {
								"aria-current": u === t + 1 ? "step" : void 0,
								children: [/* @__PURE__ */ (0, b.jsx)("span", { children: t + 1 }), e]
							}, e))
						}),
						u === 1 && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Import template",
								as: "select",
								value: f.template_key,
								onChange: (e) => ke(e.target.value),
								options: ce.map((e) => [e.key, `${e.name} · version ${e.version}`])
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "template-download",
								children: [/* @__PURE__ */ (0, b.jsxs)("button", {
									type: "button",
									className: "secondary",
									onClick: Ne,
									children: [
										"Download blank ",
										he.name.toLowerCase(),
										" template"
									]
								}), /* @__PURE__ */ (0, b.jsxs)("span", { children: [
									"CSV headers match template version ",
									he.version,
									"."
								] })]
							}),
							f.restaged_from_batch_id && /* @__PURE__ */ (0, b.jsxs)("div", {
								className: "review-notice",
								role: "note",
								children: [/* @__PURE__ */ (0, b.jsxs)("strong", { children: ["Correcting ", f.correction_source_filename] }), /* @__PURE__ */ (0, b.jsxs)("span", { children: [
									"Edit the ",
									f.correction_row_count,
									" row",
									f.correction_row_count === 1 ? "" : "s",
									" below. The new batch will retain a link to its source.",
									" ",
									f.correction_scope === "full_replacement" ? "This is a full replacement because the source batch was not applied." : "Previously applied rows are excluded; only exception rows are restaged."
								] })]
							}),
							/* @__PURE__ */ (0, b.jsxs)("label", {
								className: "file-drop",
								children: [
									/* @__PURE__ */ (0, b.jsx)("input", {
										type: "file",
										accept: ".csv,text/csv",
										onChange: Me
									}),
									/* @__PURE__ */ (0, b.jsx)("strong", { children: f.csv ? "Replace CSV file" : "Choose CSV file" }),
									/* @__PURE__ */ (0, b.jsx)("span", { children: "Up to 5 MB and 10,000 data rows. The file stays tenant-scoped." })
								]
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Source filename",
								value: f.filename,
								onChange: (e) => Oe({ filename: e.target.value }),
								placeholder: `${f.template_key}.csv`
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "CSV data",
								as: "textarea",
								value: f.csv,
								onChange: (e) => {
									let t = e.target.value;
									Oe({
										csv: t,
										mapping: ne(F, te(t)) ? f.mapping : {}
									});
								},
								placeholder: `${he.sample_header}\n`,
								hint: `Choose a file above or paste its contents. Expected fields: ${he.fields.map((e) => e.key).join(", ")}.`
							}),
							f.template_key === "bank_transactions" && /* @__PURE__ */ (0, b.jsxs)("div", {
								className: "source-options",
								"aria-label": "Bank statement details",
								children: [
									/* @__PURE__ */ (0, b.jsx)("h3", { children: "Statement control totals" }),
									/* @__PURE__ */ (0, b.jsx)(z, {
										label: "Cash account",
										as: "select",
										value: f.cash_account_id,
										onChange: (e) => Oe({ cash_account_id: e.target.value }),
										options: [["", "Select a cash account"], ...ue.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])]
									}),
									/* @__PURE__ */ (0, b.jsxs)("div", {
										className: "form-grid",
										children: [
											/* @__PURE__ */ (0, b.jsx)(z, {
												label: "Statement start",
												type: "date",
												value: f.start_date,
												onChange: (e) => Oe({ start_date: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(z, {
												label: "Statement end",
												type: "date",
												value: f.end_date,
												onChange: (e) => Oe({ end_date: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(z, {
												label: "Opening balance",
												type: "number",
												step: "0.01",
												value: f.opening,
												onChange: (e) => Oe({ opening: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(z, {
												label: "Closing balance",
												type: "number",
												step: "0.01",
												value: f.closing,
												onChange: (e) => Oe({ closing: e.target.value })
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "step-actions",
								children: [/* @__PURE__ */ (0, b.jsx)("button", {
									type: "button",
									className: "secondary",
									onClick: () => l(!1),
									children: "Cancel"
								}), /* @__PURE__ */ (0, b.jsx)("button", {
									type: "button",
									className: "primary",
									onClick: Pe,
									children: "Map columns"
								})]
							})
						] }),
						u === 2 && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "source-summary",
								children: [
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Source" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: f.filename })] }),
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Detected columns" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: F.length })] }),
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Target" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: he.name })] })
								]
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Use a saved mapping",
								as: "select",
								required: !1,
								defaultValue: "",
								onChange: (e) => Fe(e.target.value),
								options: [["", "Automatic exact-name mapping"], ...M.filter((e) => e.template_key === f.template_key).map((e) => [e.id, `${e.name} · version ${e.version}`])],
								hint: "Profiles are tenant-scoped and retain their template version."
							}),
							/* @__PURE__ */ (0, b.jsx)("div", {
								className: "mapping-list",
								role: "group",
								"aria-label": "Column mappings",
								children: he.fields.map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
									className: "mapping-row",
									children: [
										/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.label }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
											e.key,
											" · ",
											e.type,
											" · ",
											e.required ? "required" : "optional"
										] })] }),
										/* @__PURE__ */ (0, b.jsx)("span", {
											"aria-hidden": "true",
											children: "←"
										}),
										/* @__PURE__ */ (0, b.jsx)(z, {
											label: `Source column for ${e.label}`,
											as: "select",
											required: e.required,
											value: f.mapping[e.key] || "",
											onChange: (t) => Oe({
												mapping_profile_id: "",
												mapping: {
													...f.mapping,
													[e.key]: t.target.value
												}
											}),
											options: [["", e.required ? "Select a source column" : "Not mapped"], ...F.map((e) => [e, e])]
										})
									]
								}, e.key))
							}),
							e("admin") && /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Save this mapping for reuse",
								value: f.mapping_profile_name,
								onChange: (e) => Oe({ mapping_profile_name: e.target.value }),
								required: !1,
								placeholder: "Optional profile name",
								hint: "Saved only after this file passes server validation."
							}),
							!ye && /* @__PURE__ */ (0, b.jsx)(Ce, { children: "Map every required target field before continuing." }),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "step-actions",
								children: [/* @__PURE__ */ (0, b.jsx)("button", {
									type: "button",
									className: "secondary",
									onClick: () => d(1),
									children: "Back"
								}), /* @__PURE__ */ (0, b.jsx)("button", {
									type: "button",
									className: "primary",
									disabled: !ye,
									onClick: () => d(3),
									children: "Review import"
								})]
							})
						] }),
						u === 3 && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsx)("div", {
								className: "review-card",
								children: /* @__PURE__ */ (0, b.jsx)(ve, { items: [
									["Source file", f.filename],
									["Template", `${he.name} · v${he.version}`],
									["Detected columns", F.length],
									["Mapped fields", Object.values(f.mapping).filter(Boolean).length],
									["Correction source", f.restaged_from_batch_id ? `${f.correction_source_filename} · ${f.correction_row_count} rows` : "Original source batch"],
									["Mapping lineage", ge ? `${ge.name} · v${ge.version}` : "Exact batch snapshot"],
									["Saved profile", f.mapping_profile_name || "Not requested"]
								] })
							}),
							/* @__PURE__ */ (0, b.jsx)(I, {
								caption: "Import mapping review",
								columns: [
									"Target field",
									"Source column",
									"Requirement"
								],
								rows: he.fields.map((e) => [
									e.label,
									f.mapping[e.key] || "Not mapped",
									e.required ? "Required" : "Optional"
								])
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "review-notice",
								role: "note",
								children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "Next: server validation" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Formula-like content, duplicates, types and natural keys are checked before a row preview is created. No accounting record is created at this step." })]
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "step-actions",
								children: [/* @__PURE__ */ (0, b.jsx)("button", {
									type: "button",
									className: "secondary",
									onClick: () => d(2),
									children: "Back"
								}), /* @__PURE__ */ (0, b.jsx)("button", {
									className: "primary",
									disabled: g,
									children: g ? "Validating source…" : "Stage and validate"
								})]
							})
						] })
					]
				})
			})
		]
	});
}
function ce() {
	let e = ie(() => Promise.all([D("/api/dashboard"), D("/api/reconciliation-exceptions")]), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: e.error,
		retry: e.refresh
	});
	let [t, n] = e.data, r = n.filter((e) => e.status !== "resolved");
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [/* @__PURE__ */ (0, b.jsxs)("section", {
			className: "kpi-grid",
			"aria-label": "Financial overview",
			children: [
				/* @__PURE__ */ (0, b.jsx)(N, {
					label: "Cash",
					value: S(t.cash_cents),
					detail: "Posted cash balance"
				}),
				/* @__PURE__ */ (0, b.jsx)(N, {
					label: "Revenue",
					value: S(t.revenue_cents),
					detail: "Posted revenue"
				}),
				/* @__PURE__ */ (0, b.jsx)(N, {
					label: "Net income",
					value: S(t.net_income_cents),
					detail: "Current ledger"
				}),
				/* @__PURE__ */ (0, b.jsx)(N, {
					label: "Drafts",
					value: t.drafts,
					detail: "Awaiting approval",
					warning: t.drafts > 0
				})
			]
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Monthly performance",
				subtitle: "Revenue and expense activity by posting month",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Month",
						"Revenue",
						"Expenses"
					],
					rows: t.monthly.map((e) => [
						e.month,
						S(e.revenue_cents),
						S(e.expense_cents)
					])
				})
			}), /* @__PURE__ */ (0, b.jsx)(P, {
				title: "Close attention",
				subtitle: "Open reconciliation items that need an owner",
				children: r.length ? /* @__PURE__ */ (0, b.jsx)("div", {
					className: "attention-list",
					children: r.slice(0, 6).map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "attention",
						children: [
							/* @__PURE__ */ (0, b.jsx)("span", { className: "status-dot warning" }),
							/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: w(e.kind) }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
								e.reference,
								" · ",
								S(e.amount_cents)
							] })] }),
							/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
						]
					}, e.id))
				}) : /* @__PURE__ */ (0, b.jsx)(ye, {
					title: "Everything reconciles",
					detail: "No unresolved reconciliation exceptions."
				})
			})]
		})]
	});
}
function le({ can: e, notify: t }) {
	let n = ie(() => Promise.all([D("/api/journals"), D("/api/accounts")]), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let [a, o] = n.data;
	async function s(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget), a = Math.round(Number(r.get("amount")) * 100);
		try {
			await D("/api/journals", {
				method: "POST",
				body: {
					date: r.get("date"),
					memo: r.get("memo"),
					source: "manual",
					lines: [{
						account_id: Number(r.get("debit_account")),
						description: r.get("description"),
						debit_cents: a
					}, {
						account_id: Number(r.get("credit_account")),
						description: r.get("description"),
						credit_cents: a
					}]
				}
			}), i(!1), await n.refresh(), t({
				kind: "success",
				message: "Balanced journal draft saved for approval."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function c(e) {
		if (window.confirm("Post this journal? Posted entries are immutable.")) try {
			await D(`/api/journals/${e}/post`, { method: "POST" }), await n.refresh(), t({
				kind: "success",
				message: "Journal posted and integrity-sealed."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Journal register",
				detail: `${a.length} entries with controlled approval and posting`,
				action: e("draft") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => i(!0),
					children: "New journal"
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(P, { children: /* @__PURE__ */ (0, b.jsx)(I, {
				columns: [
					"Date",
					"Memo",
					"Source",
					"Amount",
					"Status",
					"Action"
				],
				rows: a.map((t) => [
					C(t.entry_date),
					t.memo,
					w(t.source),
					S(t.total_cents),
					/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
					t.status === "draft" && e("post") ? /* @__PURE__ */ (0, b.jsx)("button", {
						className: "small-button",
						onClick: () => c(t.id),
						children: "Post"
					}) : "—"
				])
			}) }),
			r && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Create balanced journal",
				subtitle: "Save a draft for review; this does not post to the ledger.",
				close: () => i(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: s,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Entry date",
									name: "date",
									type: "date",
									defaultValue: ee
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Debit account",
									name: "debit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Credit account",
									name: "credit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Memo",
							name: "memo",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Line description",
							name: "description",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => i(!1),
							label: "Save draft"
						})
					]
				})
			})
		]
	});
}
function ue({ can: e, notify: t }) {
	let n = ie(() => D("/api/saas/overview"), []);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let r = n.data;
	async function i() {
		try {
			let e = await D("/api/revenue/recognize", {
				method: "POST",
				body: { as_of: ee }
			});
			await n.refresh(), t({
				kind: "success",
				message: `${e.recognized_schedules} revenue schedules recognized.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Contract-to-ledger",
				detail: "ASC 606 contracts, obligations, billing and recognition",
				action: e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: i,
					children: "Recognize through today"
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Contracts",
						value: r.contracts.length,
						detail: "Customer arrangements"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Schedules",
						value: r.schedules.length,
						detail: "Recognition periods"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Invoices",
						value: r.invoices.length,
						detail: "Billing records"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "RPO",
						value: S(r.rpo_cents || 0),
						detail: "Remaining obligations"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Contracts",
				subtitle: "Signed arrangements and allocated transaction price",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Contract",
						"Customer",
						"Start",
						"End",
						"Transaction price"
					],
					rows: r.contracts.map((e) => [
						e.contract_number,
						e.customer_name,
						C(e.start_date),
						C(e.end_date),
						S(e.transaction_price_cents)
					])
				})
			})
		]
	});
}
function M({ can: e, notify: t }) {
	let n = ie(() => Promise.all([D("/api/receivables"), D("/api/saas/overview")]), []), [r, i] = (0, _.useState)(null);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let [a, o] = n.data, s = a.invoices.filter((e) => e.balance_cents > 0 && e.status !== "void");
	async function c(e) {
		e.preventDefault();
		let a = new FormData(e.currentTarget), o = Math.round(Number(a.get("amount")) * 100), s, c;
		if (r === "invoice") s = "/api/invoices", c = {
			contract_id: Number(a.get("contract_id")),
			invoice_number: a.get("number"),
			invoice_date: a.get("date"),
			due_date: a.get("due_date"),
			amount_cents: o
		};
		else {
			s = "/api/receivables/payments";
			let e = Number(a.get("invoice_id"));
			c = {
				customer_id: Number(a.get("customer_id")),
				payment_number: a.get("number"),
				payment_date: a.get("date"),
				amount_cents: o,
				method: a.get("method"),
				reference: a.get("reference"),
				applications: e ? [{
					invoice_id: e,
					amount_cents: o
				}] : []
			};
		}
		try {
			await D(s, {
				method: "POST",
				body: c
			}), i(null), await n.refresh(), t({
				kind: "success",
				message: r === "invoice" ? "Invoice posted." : "Payment recorded and applied."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Receivables operations",
				detail: `Aging as of ${C(a.as_of)}`,
				action: e("operate") && /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "button-row",
					children: [/* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => i("payment"),
						children: "Record payment"
					}), /* @__PURE__ */ (0, b.jsx)("button", {
						className: "primary",
						onClick: () => i("invoice"),
						children: "New invoice"
					})]
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Open AR",
						value: S(a.aging.total_cents),
						detail: `${s.length} open invoices`
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Overdue",
						value: S(a.aging.overdue_cents),
						detail: "Past due balance",
						warning: a.aging.overdue_cents > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Disputed",
						value: S(a.aging.disputed_cents),
						detail: "Active disputes"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "GL difference",
						value: S(a.reconciliation.ar_difference_cents),
						detail: a.reconciliation.balanced ? "Subledger agrees" : "Requires resolution",
						warning: !a.reconciliation.balanced
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Invoice aging",
				subtitle: "Outstanding customer invoices and application status",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Invoice",
						"Customer",
						"Due",
						"Original",
						"Balance",
						"Status"
					],
					rows: a.invoices.map((e) => [
						e.invoice_number,
						e.customer_name,
						C(e.due_date),
						S(e.amount_cents),
						S(e.balance_cents),
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
					])
				})
			}),
			r && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: r === "invoice" ? "Create customer invoice" : "Record customer payment",
				subtitle: "The resulting accounting entry retains this workflow's audit lineage.",
				close: () => i(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: c,
					children: [r === "invoice" ? /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)(z, {
						label: "Contract",
						name: "contract_id",
						as: "select",
						options: o.contracts.map((e) => [e.id, `${e.contract_number} · ${e.customer_name}`])
					}), /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "form-grid",
						children: [
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Invoice number",
								name: "number",
								defaultValue: `INV-${Date.now().toString().slice(-6)}`
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Amount",
								name: "amount",
								type: "number",
								min: "0.01",
								step: "0.01"
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Invoice date",
								name: "date",
								type: "date",
								defaultValue: ee
							}),
							/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Due date",
								name: "due_date",
								type: "date",
								defaultValue: ee
							})
						]
					})] }) : /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Customer",
							name: "customer_id",
							as: "select",
							options: o.customers.map((e) => [e.id, e.name])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Apply to invoice (optional)",
							name: "invoice_id",
							as: "select",
							required: !1,
							options: [["", "Leave unapplied"], ...s.map((e) => [e.id, `${e.invoice_number} · ${S(e.balance_cents)}`])]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Payment number",
									name: "number",
									defaultValue: `PAY-${Date.now().toString().slice(-6)}`
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Received date",
									name: "date",
									type: "date",
									defaultValue: ee
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Method",
									name: "method",
									as: "select",
									options: [
										["ach", "ACH"],
										["wire", "Wire"],
										["check", "Check"],
										["card", "Card"]
									]
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Bank reference",
							name: "reference",
							required: !1
						})
					] }), /* @__PURE__ */ (0, b.jsx)(R, {
						close: () => i(null),
						label: "Post and save"
					})]
				})
			})
		]
	});
}
function de({ can: e, notify: t }) {
	let n = ie(() => Promise.all([
		D("/api/bank-statements"),
		D("/api/bank-feed"),
		D("/api/reconciliation-exceptions"),
		D("/api/accounts"),
		D("/api/integrations/connections")
	]), []), [r, i] = (0, _.useState)(!1), [a, o] = (0, _.useState)(!1), [s, c] = (0, _.useState)(null);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let [l, u, d, f, p] = n.data;
	async function m(e, r) {
		try {
			await D(`/api/reconciliation-exceptions/${e.id}`, {
				method: "PATCH",
				body: {
					status: r,
					resolution: r === "resolved" ? "Reviewed and resolved in the close workbench." : "Assigned for investigation."
				}
			}), await n.refresh(), t({
				kind: "success",
				message: `Exception ${r}.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function h(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await D("/api/bank-statements/import", {
				method: "POST",
				body: {
					cash_account_id: Number(r.get("cash_account_id")),
					start_date: r.get("start_date"),
					end_date: r.get("end_date"),
					opening_cents: Math.round(Number(r.get("opening")) * 100),
					closing_cents: Math.round(Number(r.get("closing")) * 100),
					csv: r.get("csv")
				}
			}), i(!1), await n.refresh(), t({
				kind: "success",
				message: "Bank statement validated, imported and matched."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function g(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await D("/api/bank-feed/accounts", {
				method: "POST",
				body: {
					connection_id: r.get("connection_id"),
					external_account_id: r.get("external_account_id"),
					cash_account_id: Number(r.get("cash_account_id")),
					display_name: r.get("display_name"),
					currency: r.get("currency")
				}
			}), o(!1), await n.refresh(), t({
				kind: "success",
				message: "Plaid account bound to the Folio cash subledger."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function v(e) {
		try {
			c(await D(`/api/bank-feed/transactions/${e.id}/candidates`));
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function y(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await D(`/api/bank-feed/transactions/${s.transaction.id}/match`, {
				method: "POST",
				body: {
					journal_line_id: Number(r.get("journal_line_id")),
					approved: !0,
					rationale: r.get("rationale")
				}
			}), c(null), await n.refresh(), t({
				kind: "success",
				message: "Exact posted-cash match approved and recorded."
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Bank reconciliation & close",
				detail: "Cash matching, assigned exceptions and evidence",
				action: /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "button-row",
					children: [e("admin") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => o(!0),
						children: "Bind Plaid account"
					}), e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "primary",
						onClick: () => i(!0),
						children: "Import statement"
					})]
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Feed accounts",
						value: u.metrics.active_accounts,
						detail: "Active bindings"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Matched",
						value: u.metrics.matched,
						detail: "Unique posted cash lines"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Pending",
						value: u.metrics.pending,
						detail: "Awaiting provider posting"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Needs review",
						value: u.metrics.needs_review,
						detail: "Unmatched or ambiguous",
						warning: u.metrics.needs_review > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Native bank feed",
				subtitle: "Versioned Plaid activity matched to posted cash without creating journals",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					caption: "Current bank-feed transaction versions",
					emptyTitle: "No bank-feed activity",
					emptyDetail: "Bind a Plaid account, synchronize it, then review staged records in Integrations.",
					columns: [
						"Date",
						"Account",
						"Description",
						"Amount",
						"Source",
						"Status",
						"Match",
						"Action"
					],
					rows: u.transactions.map((t) => [
						C(t.transaction_date),
						`${t.cash_account_code} · ${t.feed_name}`,
						t.merchant_name || t.description,
						S(t.amount_cents),
						`${w(t.operation)} · ${t.source_version}`,
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
						t.matched_journal_id ? `Journal ${t.matched_journal_id}${t.match_decided_by ? ` · ${t.match_decided_by}` : ""}` : "—",
						["unmatched", "exception"].includes(t.status) && e("operate") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => v(t),
							children: "Review match"
						}) : "—"
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsx)(P, {
					title: "Bank statements",
					subtitle: "Imported statements and match status",
					children: /* @__PURE__ */ (0, b.jsx)(I, {
						columns: [
							"Period",
							"Closing",
							"Transactions",
							"Unmatched",
							"Status"
						],
						rows: l.map((e) => [
							`${C(e.start_date)} – ${C(e.end_date)}`,
							S(e.closing_cents),
							e.transaction_count,
							e.unmatched_count,
							/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
						])
					})
				}), /* @__PURE__ */ (0, b.jsx)(P, {
					title: "Exception queue",
					subtitle: "Resolve material differences before close",
					children: d.length ? /* @__PURE__ */ (0, b.jsx)("div", {
						className: "attention-list",
						children: d.map((t) => /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "attention exception",
							children: [
								/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: w(t.kind) }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									t.reference,
									" · ",
									S(t.amount_cents)
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
								e("operate") && t.status === "open" && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => m(t, "acknowledged"),
									children: "Acknowledge"
								}),
								e("close") && t.status !== "resolved" && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => m(t, "resolved"),
									children: "Resolve"
								})
							]
						}, t.id))
					}) : /* @__PURE__ */ (0, b.jsx)(ye, {
						title: "No close exceptions",
						detail: "All synchronized reconciliations agree."
					})
				})]
			}),
			r && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Import bank statement",
				subtitle: "Validate a versioned CSV before matching it against posted cash entries.",
				close: () => i(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: h,
					children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Cash account",
							name: "cash_account_id",
							as: "select",
							options: f.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Start date",
									name: "start_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "End date",
									name: "end_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Opening balance",
									name: "opening",
									type: "number",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(z, {
									label: "Closing balance",
									name: "closing",
									type: "number",
									step: "0.01"
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Statement CSV",
							name: "csv",
							as: "textarea",
							hint: "Required columns: date, description and amount. Include external_id when available. Never paste bank credentials."
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => i(!1),
							label: "Validate and import"
						})
					]
				})
			}),
			a && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Bind Plaid account",
				subtitle: "Map a provider account identifier to one active Folio cash account and currency.",
				close: () => o(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: g,
					children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Plaid connection",
							name: "connection_id",
							as: "select",
							options: p.filter((e) => e.provider === "plaid").map((e) => [e.id, e.display_name])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Provider account ID",
							name: "external_account_id",
							placeholder: "Plaid account_id",
							hint: "Use the account_external_id present on normalized Plaid transactions."
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Display name",
							name: "display_name",
							placeholder: "Operating checking"
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(z, {
								label: "Folio cash account",
								name: "cash_account_id",
								as: "select",
								options: f.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])
							}), /* @__PURE__ */ (0, b.jsx)(z, {
								label: "Currency",
								name: "currency",
								defaultValue: "USD",
								pattern: "[A-Za-z]{3}"
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => o(!1),
							label: "Save binding"
						})
					]
				})
			}),
			s && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Review exact cash matches",
				subtitle: `${s.transaction.description} · ${S(s.transaction.amount_cents)}`,
				close: () => c(null),
				children: s.candidates.length ? /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: y,
					children: [
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Posted journal candidate",
							name: "journal_line_id",
							as: "select",
							options: s.candidates.map((e) => [e.id, `Journal ${e.entry_id} · ${e.entry_date} · ${e.memo}`])
						}),
						/* @__PURE__ */ (0, b.jsx)(z, {
							label: "Match rationale",
							name: "rationale",
							as: "textarea",
							minLength: "5",
							hint: "Document the remittance, statement or other evidence distinguishing this exact candidate."
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "control-note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "Controlled match" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Folio revalidates account, date, signed amount and availability at approval time. The posted journal remains immutable." })]
						}),
						/* @__PURE__ */ (0, b.jsx)(R, {
							close: () => c(null),
							label: "Approve match"
						})
					]
				}) : /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "control-note warning-note",
					children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "No exact posted-cash candidate" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Post or correct the underlying journal, then reopen this review. Folio will not manufacture a journal from bank activity." })]
				}), /* @__PURE__ */ (0, b.jsx)("div", {
					className: "dialog-actions",
					children: /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => c(null),
						children: "Close"
					})
				})] })
			})
		]
	});
}
function fe() {
	let e = ie(() => D("/api/investments/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Investment subledger",
				detail: "Positions, measurement models and ledger reconciliation"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Instruments",
						value: t.instruments.length,
						detail: "Active and disposed"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Carrying value",
						value: S(t.totals?.carrying_value_cents || 0),
						detail: "Subledger basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Fair value",
						value: S(t.totals?.fair_value_cents || 0),
						detail: "Latest measurements"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "GL difference",
						value: S(t.reconciliation?.difference_cents || 0),
						detail: "Control reconciliation",
						warning: !!t.reconciliation?.difference_cents
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Positions",
				subtitle: "Accounting model, classification and current carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Instrument",
						"Issuer",
						"Security",
						"Model",
						"Status"
					],
					rows: t.instruments.map((e) => [
						e.instrument_number,
						e.issuer,
						w(e.security_type),
						w(e.accounting_model),
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
					])
				})
			})
		]
	});
}
function pe() {
	let e = ie(() => D("/api/fixed-assets/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Fixed-asset register",
				detail: "PP&E, depreciation, CIP, impairment, disposals and ARO"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Assets",
						value: t.assets.length,
						detail: "Register records"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Gross PP&E",
						value: S(t.totals?.gross_carrying_cents || t.totals?.cost_cents || 0),
						detail: "Capitalized basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "Net book value",
						value: S(t.totals?.net_book_value_cents || 0),
						detail: "After depreciation"
					}),
					/* @__PURE__ */ (0, b.jsx)(N, {
						label: "CIP",
						value: S(t.totals?.cip_cents || 0),
						detail: "Construction in progress"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Asset register",
				subtitle: "Class, custody, lifecycle status and carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Asset",
						"Description",
						"Class",
						"Placed in service",
						"Net book value",
						"Status"
					],
					rows: t.assets.map((e) => [
						e.asset_number,
						e.description,
						e.class_code,
						C(e.placed_in_service_date),
						S(e.net_book_value_cents),
						/* @__PURE__ */ (0, b.jsx)(L, { value: e.status })
					])
				})
			})
		]
	});
}
function me({ can: e, notify: t }) {
	let n = [
		"trial_balance",
		"income_statement",
		"balance_sheet",
		"cash_flow",
		"comprehensive_income",
		"changes_in_equity"
	], r = ie(() => D("/api/jobs?limit=100"), []), [i, a] = (0, _.useState)(ee);
	(0, _.useEffect)(() => {
		let e = setInterval(() => void r.refresh(), 3e3);
		return () => clearInterval(e);
	}, []);
	async function o(e, n) {
		try {
			await D("/api/jobs/reports", {
				method: "POST",
				body: {
					type: e,
					format: n,
					as_of: i
				}
			}), await r.refresh(), t({
				kind: "success",
				message: `${w(e)} ${n.toUpperCase()} was queued.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function s(e, n) {
		try {
			await D(`/api/jobs/${e.id}/${n}`, {
				method: "POST",
				idempotent: !1
			}), await r.refresh(), t({
				kind: "success",
				message: `Job ${n === "retry" ? "requeued" : "cancelled"}.`
			});
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(_e, {
				title: "Financial statements",
				detail: "Queue durable statement exports and track all report and connector work"
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Export date",
				subtitle: "Reports use posted entries through this as-of date",
				children: /* @__PURE__ */ (0, b.jsx)(z, {
					label: "As-of date",
					name: "as_of",
					type: "date",
					value: i,
					onChange: (e) => a(e.target.value)
				})
			}),
			/* @__PURE__ */ (0, b.jsx)("div", {
				className: "report-grid",
				children: n.map((t) => /* @__PURE__ */ (0, b.jsxs)("article", {
					className: "report-card",
					children: [
						/* @__PURE__ */ (0, b.jsx)("span", {
							"aria-hidden": "true",
							children: "⌁"
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: w(t) }), /* @__PURE__ */ (0, b.jsx)("p", { children: "Generated from posted journals with current report mappings." })] }),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "button-row",
							children: [/* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: !e("operate"),
								onClick: () => o(t, "pdf"),
								children: "Queue PDF"
							}), /* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: !e("operate"),
								onClick: () => o(t, "csv"),
								children: "Queue CSV"
							})]
						})
					]
				}, t))
			}),
			/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Background work",
				subtitle: "Durable status, retry evidence and completed downloads",
				children: r.loading ? /* @__PURE__ */ (0, b.jsx)(be, {}) : r.error ? /* @__PURE__ */ (0, b.jsx)(Se, {
					error: r.error,
					retry: r.refresh
				}) : /* @__PURE__ */ (0, b.jsx)(I, {
					columns: [
						"Created",
						"Kind",
						"Output",
						"Attempts",
						"Status",
						"Result or error",
						"Action"
					],
					rows: r.data.map((t) => [
						(/* @__PURE__ */ new Date(`${t.created_at}Z`)).toLocaleString(),
						w(t.kind),
						t.artifact_filename || t.result?.sync_run_id || "—",
						`${t.attempts} / ${t.max_attempts}`,
						/* @__PURE__ */ (0, b.jsx)(L, { value: t.status }),
						t.last_error || (t.result ? `${t.result.rows ?? ""} ${t.result.rows ? "rows" : t.result.status || "complete"}` : "—"),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "button-row",
							children: [
								t.has_artifact && /* @__PURE__ */ (0, b.jsx)("a", {
									className: "small-button",
									href: `/api/jobs/${t.id}/download`,
									children: "Download"
								}),
								["queued", "retry"].includes(t.status) && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => s(t, "cancel"),
									children: "Cancel"
								}),
								t.status === "dead_letter" && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => s(t, "retry"),
									children: "Retry"
								})
							]
						})
					])
				})
			})
		]
	});
}
function he({ auth: e, setAuth: t, notify: n }) {
	async function r(e) {
		try {
			let r = await D("/api/auth/switch-org", {
				method: "POST",
				body: { org_id: e },
				idempotent: !1
			});
			t(r), n({
				kind: "success",
				message: `Switched to ${r.organization.name}.`
			});
		} catch (e) {
			n({
				kind: "error",
				message: e.message
			});
		}
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [/* @__PURE__ */ (0, b.jsx)(_e, {
			title: "Workspace administration",
			detail: "Identity, organization access and controlled configuration"
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(P, {
				title: "Signed-in identity",
				children: /* @__PURE__ */ (0, b.jsx)(ve, { items: [
					["Name", e.user.name],
					["Email", e.user.email],
					["Role", w(e.role)],
					["Permissions", e.permissions.map(w).join(", ")]
				] })
			}), /* @__PURE__ */ (0, b.jsx)(P, {
				title: "Organization access",
				subtitle: "Tenant context comes only from verified membership",
				children: /* @__PURE__ */ (0, b.jsx)("div", {
					className: "attention-list",
					children: e.organizations.map((t) => /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "attention",
						children: [
							/* @__PURE__ */ (0, b.jsx)("span", {
								className: "workspace-avatar small",
								children: t.name.slice(0, 1)
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: w(t.role) })] }),
							t.org_id === e.organization.id ? /* @__PURE__ */ (0, b.jsx)(L, { value: "current" }) : /* @__PURE__ */ (0, b.jsx)("button", {
								className: "small-button",
								onClick: () => r(t.org_id),
								children: "Switch"
							})
						]
					}, t.org_id))
				})
			})]
		})]
	});
}
function ge() {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "brand",
		children: [/* @__PURE__ */ (0, b.jsx)("span", {
			className: "brand-mark",
			children: "F"
		}), /* @__PURE__ */ (0, b.jsx)("span", { children: "Folio" })]
	});
}
function N({ label: e, value: t, detail: n, warning: r }) {
	return /* @__PURE__ */ (0, b.jsxs)("article", {
		className: `kpi-card${r ? " warning" : ""}`,
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", { children: e }),
			/* @__PURE__ */ (0, b.jsx)("strong", { children: t }),
			/* @__PURE__ */ (0, b.jsx)("small", { children: n })
		]
	});
}
function P({ title: e, subtitle: t, action: n, children: r }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "panel",
		children: [e && /* @__PURE__ */ (0, b.jsxs)("header", { children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), t && /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }), n && /* @__PURE__ */ (0, b.jsx)("div", { children: n })] }), /* @__PURE__ */ (0, b.jsx)("div", {
			className: "panel-body",
			children: r
		})]
	});
}
function F({ label: e, value: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: e }), /* @__PURE__ */ (0, b.jsx)("strong", {
		title: String(t),
		children: t
	})] });
}
function _e({ title: e, detail: t, action: n }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "module-bar",
		children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }), n && /* @__PURE__ */ (0, b.jsx)("div", { children: n })]
	});
}
function I({ columns: e, rows: t, caption: n, emptyTitle: r = "Nothing here yet", emptyDetail: i = "New records will appear here." }) {
	return t.length ? /* @__PURE__ */ (0, b.jsx)("div", {
		className: "table-wrap",
		children: /* @__PURE__ */ (0, b.jsxs)("table", { children: [
			n && /* @__PURE__ */ (0, b.jsx)("caption", {
				className: "sr-only",
				children: n
			}),
			/* @__PURE__ */ (0, b.jsx)("thead", { children: /* @__PURE__ */ (0, b.jsx)("tr", { children: e.map((e) => /* @__PURE__ */ (0, b.jsx)("th", {
				scope: "col",
				children: e
			}, e)) }) }),
			/* @__PURE__ */ (0, b.jsx)("tbody", { children: t.map((e, t) => /* @__PURE__ */ (0, b.jsx)("tr", { children: e.map((e, t) => /* @__PURE__ */ (0, b.jsx)("td", { children: e ?? "—" }, t)) }, t)) })
		] })
	}) : /* @__PURE__ */ (0, b.jsx)(ye, {
		title: r,
		detail: i
	});
}
function L({ value: e }) {
	let t = String(e || "unknown").toLowerCase();
	return /* @__PURE__ */ (0, b.jsx)("span", {
		className: `status status-${t.replaceAll(" ", "-")}`,
		children: w(e)
	});
}
function ve({ items: e }) {
	return /* @__PURE__ */ (0, b.jsx)("dl", {
		className: "description-list",
		children: e.map(([e, t]) => /* @__PURE__ */ (0, b.jsxs)(_.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)("dt", { children: e }), /* @__PURE__ */ (0, b.jsx)("dd", { children: t })] }, e))
	});
}
function ye({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "empty",
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", {
				"aria-hidden": "true",
				children: "✓"
			}),
			/* @__PURE__ */ (0, b.jsx)("strong", { children: e }),
			/* @__PURE__ */ (0, b.jsx)("p", { children: t })
		]
	});
}
function be() {
	return /* @__PURE__ */ (0, b.jsx)(xe, {
		title: "Loading workspace",
		detail: "Retrieving current accounting data…"
	});
}
function xe({ title: e, detail: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("main", {
		className: "centered-status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", { className: "loader" }),
			/* @__PURE__ */ (0, b.jsx)("h1", { children: e }),
			/* @__PURE__ */ (0, b.jsx)("p", { children: t })
		]
	});
}
function Se({ error: e, retry: t }) {
	return /* @__PURE__ */ (0, b.jsxs)(Ce, {
		action: /* @__PURE__ */ (0, b.jsx)("button", {
			className: "small-button",
			onClick: t,
			children: "Try again"
		}),
		children: [
			/* @__PURE__ */ (0, b.jsx)("strong", { children: "Could not load this module." }),
			" ",
			e
		]
	});
}
function Ce({ children: e, action: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "alert",
		role: "alert",
		children: [/* @__PURE__ */ (0, b.jsx)("div", { children: e }), t]
	});
}
function we({ notice: e, onClose: t }) {
	return (0, _.useEffect)(() => {
		let e = setTimeout(t, 5e3);
		return () => clearTimeout(e);
	}, [t]), /* @__PURE__ */ (0, b.jsxs)("div", {
		className: `toast toast-${e.kind}`,
		role: "status",
		children: [/* @__PURE__ */ (0, b.jsx)("span", { children: e.message }), /* @__PURE__ */ (0, b.jsx)("button", {
			onClick: t,
			"aria-label": "Dismiss notification",
			children: "×"
		})]
	});
}
function Te({ title: e, subtitle: t, close: n, children: r }) {
	let i = (0, _.useRef)(null), a = (0, _.useRef)(null), o = (0, _.useRef)(null), s = (0, _.useRef)(n), c = (0, _.useRef)(document.activeElement);
	return s.current = n, (0, _.useEffect)(() => {
		let e = document.body.style.overflow;
		document.body.style.overflow = "hidden", o.current?.focus();
		let t = (e) => {
			if (e.key === "Escape") return s.current();
			if (e.key !== "Tab") return;
			let t = [...a.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex=\"-1\"])")].filter((e) => e.getClientRects().length);
			if (!t.length) return e.preventDefault();
			let n = t[0], r = t.at(-1);
			e.shiftKey && document.activeElement === n ? (e.preventDefault(), r.focus()) : !e.shiftKey && document.activeElement === r && (e.preventDefault(), n.focus());
		};
		return window.addEventListener("keydown", t), () => {
			window.removeEventListener("keydown", t), document.body.style.overflow = e, c.current?.focus?.();
		};
	}, []), /* @__PURE__ */ (0, b.jsx)("div", {
		className: "dialog-backdrop",
		onMouseDown: (e) => e.target === e.currentTarget && n(),
		children: /* @__PURE__ */ (0, b.jsxs)("section", {
			ref: a,
			className: "dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "dialog-title",
			children: [/* @__PURE__ */ (0, b.jsxs)("header", { children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [
				/* @__PURE__ */ (0, b.jsx)("p", {
					className: "eyebrow",
					children: "CONTROLLED WORKFLOW"
				}),
				/* @__PURE__ */ (0, b.jsx)("h2", {
					ref: o,
					tabIndex: "-1",
					id: "dialog-title",
					children: e
				}),
				/* @__PURE__ */ (0, b.jsx)("p", { children: t })
			] }), /* @__PURE__ */ (0, b.jsx)("button", {
				ref: i,
				className: "icon-button",
				onClick: n,
				"aria-label": "Close dialog",
				children: "×"
			})] }), r]
		})
	});
}
function R({ close: e, label: t, disabled: n = !1 }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "dialog-actions",
		children: [/* @__PURE__ */ (0, b.jsx)("button", {
			type: "button",
			className: "secondary",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ (0, b.jsx)("button", {
			className: "primary",
			disabled: n,
			children: t
		})]
	});
}
function z({ label: e, hint: t, as: n = "input", options: r = [], required: i = !0, ...a }) {
	let o = n;
	return /* @__PURE__ */ (0, b.jsxs)("label", {
		className: "field",
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", { children: e }),
			o === "select" ? /* @__PURE__ */ (0, b.jsx)("select", {
				required: i,
				...a,
				children: r.map(([e, t]) => /* @__PURE__ */ (0, b.jsx)("option", {
					value: e,
					children: t
				}, e))
			}) : o === "textarea" ? /* @__PURE__ */ (0, b.jsx)("textarea", {
				rows: 7,
				required: i,
				...a
			}) : /* @__PURE__ */ (0, b.jsx)("input", {
				required: i,
				...a
			}),
			t && /* @__PURE__ */ (0, b.jsx)("small", { children: t })
		]
	});
}
var Ee = document.querySelector("#root");
Ee && (0, v.createRoot)(Ee).render(/* @__PURE__ */ (0, b.jsx)(O, {}));
//#endregion
