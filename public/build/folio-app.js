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
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.iterator;
	function p(e) {
		return typeof e != "object" || !e ? null : (e = f && e[f] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var m = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, h = Object.assign, g = {};
	function _(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	_.prototype.isReactComponent = {}, _.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, _.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function v() {}
	v.prototype = _.prototype;
	function y(e, t, n) {
		this.props = e, this.context = t, this.refs = g, this.updater = n || m;
	}
	var b = y.prototype = new v();
	b.constructor = y, h(b, _.prototype), b.isPureReactComponent = !0;
	var ee = Array.isArray, x = {
		H: null,
		A: null,
		T: null,
		S: null,
		V: null
	}, S = Object.prototype.hasOwnProperty;
	function te(e, n, r, i, a, o) {
		return r = o.ref, {
			$$typeof: t,
			type: e,
			key: n,
			ref: r === void 0 ? null : r,
			props: o
		};
	}
	function C(e, t) {
		return te(e.type, t, void 0, void 0, void 0, e.props);
	}
	function w(e) {
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
	var re = /\/+/g;
	function ie(e, t) {
		return typeof e == "object" && e && e.key != null ? ne("" + e.key) : t.toString(36);
	}
	function ae() {}
	function oe(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(ae, ae) : (e.status = "pending", e.then(function(t) {
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
	function se(e, r, i, a, o) {
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
				case d: return c = e._init, se(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ie(e, 0) : a, ee(o) ? (i = "", c != null && (i = c.replace(re, "$&/") + "/"), se(o, r, i, "", function(e) {
			return e;
		})) : o != null && (w(o) && (o = C(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(re, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (ee(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ie(a, u), c += se(a, r, i, s, o);
		else if (u = p(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ie(a, u++), c += se(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return se(oe(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ce(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return se(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function le(e) {
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
	var ue = typeof reportError == "function" ? reportError : function(e) {
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
	};
	function T() {}
	e.Children = {
		map: ce,
		forEach: function(e, t, n) {
			ce(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ce(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ce(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!w(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	}, e.Component = _, e.Fragment = r, e.Profiler = a, e.PureComponent = y, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = x, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return x.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = h({}, e.props), i = e.key, a = void 0;
		if (t != null) for (o in t.ref !== void 0 && (a = void 0), t.key !== void 0 && (i = "" + t.key), t) !S.call(t, o) || o === "key" || o === "__self" || o === "__source" || o === "ref" && t.ref === void 0 || (r[o] = t[o]);
		var o = arguments.length - 2;
		if (o === 1) r.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			r.children = s;
		}
		return te(e.type, i, void 0, void 0, a, r);
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
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) S.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return te(e, a, void 0, void 0, null, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = w, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: le
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = x.T, n = {};
		x.T = n;
		try {
			var r = e(), i = x.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(T, ue);
		} catch (e) {
			ue(e);
		} finally {
			x.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return x.H.useCacheRefresh();
	}, e.use = function(e) {
		return x.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return x.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return x.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return x.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return x.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t, n) {
		var r = x.H;
		if (typeof n == "function") throw Error("useEffect CRUD overload is not enabled in this build of React.");
		return r.useEffect(e, t);
	}, e.useId = function() {
		return x.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return x.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return x.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return x.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return x.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return x.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return x.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return x.H.useRef(e);
	}, e.useState = function(e) {
		return x.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return x.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return x.H.useTransition();
	}, e.version = "19.1.1";
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
	function ee(e) {
		if (h = !1, b(e), !m) {
			if (n(c) !== null) m = !0, x || (x = !0, re());
			else {
				var t = n(l);
				t !== null && oe(ee, t.startTime - e);
			}
		}
	}
	var x = !1, S = -1, te = 5, C = -1;
	function w() {
		return g ? !0 : !(e.unstable_now() - C < te);
	}
	function ne() {
		if (g = !1, x) {
			var t = e.unstable_now();
			C = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(S), S = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && w());) {
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
								u !== null && oe(ee, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? re() : x = !1;
			}
		}
	}
	var re;
	if (typeof y == "function") re = function() {
		y(ne);
	};
	else if (typeof MessageChannel < "u") {
		var ie = new MessageChannel(), ae = ie.port2;
		ie.port1.onmessage = ne, re = function() {
			ae.postMessage(null);
		};
	} else re = function() {
		_(ne, 0);
	};
	function oe(t, n) {
		S = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : te = 0 < e ? Math.floor(1e3 / e) : 5;
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(S), S = -1) : h = !0, oe(ee, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, x || (x = !0, re()))), r;
	}, e.unstable_shouldYield = w, e.unstable_wrapCallback = function(e) {
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
	}, e.version = "19.1.1";
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
		if (o(e) !== e) throw Error(i(188));
	}
	function l(e) {
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
					if (s === n) return c(a), e;
					if (s === r) return c(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var l = !1, u = a.child; u;) {
					if (u === n) {
						l = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						l = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!l) {
					for (u = s.child; u;) {
						if (u === n) {
							l = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							l = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!l) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function d(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = d(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var p = Object.assign, h = Symbol.for("react.element"), g = Symbol.for("react.transitional.element"), _ = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), b = Symbol.for("react.profiler"), ee = Symbol.for("react.provider"), x = Symbol.for("react.consumer"), S = Symbol.for("react.context"), te = Symbol.for("react.forward_ref"), C = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), ne = Symbol.for("react.memo"), re = Symbol.for("react.lazy"), ie = Symbol.for("react.activity"), ae = Symbol.for("react.memo_cache_sentinel"), oe = Symbol.iterator;
	function se(e) {
		return typeof e != "object" || !e ? null : (e = oe && e[oe] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ce = Symbol.for("react.client.reference");
	function le(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ce ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case v: return "Fragment";
			case b: return "Profiler";
			case y: return "StrictMode";
			case C: return "Suspense";
			case w: return "SuspenseList";
			case ie: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case _: return "Portal";
			case S: return (e.displayName || "Context") + ".Provider";
			case x: return (e._context.displayName || "Context") + ".Consumer";
			case te:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case ne: return t = e.displayName || null, t === null ? le(e.type) || "Memo" : t;
			case re:
				t = e._payload, e = e._init;
				try {
					return le(e(t));
				} catch {}
		}
		return null;
	}
	var ue = Array.isArray, T = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, E = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, de = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, fe = [], pe = -1;
	function me(e) {
		return { current: e };
	}
	function D(e) {
		0 > pe || (e.current = fe[pe], fe[pe] = null, pe--);
	}
	function O(e, t) {
		pe++, fe[pe] = e.current, e.current = t;
	}
	var k = me(null), A = me(null), he = me(null), ge = me(null);
	function _e(e, t) {
		switch (O(he, t), O(A, e), O(k, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Dd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Dd(t), e = Od(t, e);
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
		D(k), O(k, e);
	}
	function ve() {
		D(k), D(A), D(he);
	}
	function ye(e) {
		e.memoizedState !== null && O(ge, e);
		var t = k.current, n = Od(t, e.type);
		t !== n && (O(A, e), O(k, n));
	}
	function be(e) {
		A.current === e && (D(k), D(A)), ge.current === e && (D(ge), Ff._currentValue = de);
	}
	var xe = Object.prototype.hasOwnProperty, Se = t.unstable_scheduleCallback, Ce = t.unstable_cancelCallback, we = t.unstable_shouldYield, Te = t.unstable_requestPaint, Ee = t.unstable_now, j = t.unstable_getCurrentPriorityLevel, De = t.unstable_ImmediatePriority, Oe = t.unstable_UserBlockingPriority, ke = t.unstable_NormalPriority, Ae = t.unstable_LowPriority, je = t.unstable_IdlePriority, Me = t.log, Ne = t.unstable_setDisableYieldValue, Pe = null, Fe = null;
	function Ie(e) {
		if (typeof Me == "function" && Ne(e), Fe && typeof Fe.setStrictMode == "function") try {
			Fe.setStrictMode(Pe, e);
		} catch {}
	}
	var Le = Math.clz32 ? Math.clz32 : Be, Re = Math.log, ze = Math.LN2;
	function Be(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Re(e) / ze | 0) | 0;
	}
	var Ve = 256, He = 4194304;
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
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 4194048;
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
		var e = Ve;
		return Ve <<= 1, !(Ve & 4194048) && (Ve = 256), e;
	}
	function Je() {
		var e = He;
		return He <<= 1, !(He & 62914560) && (He = 4194304), e;
	}
	function Ye(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function Xe(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Ze(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Le(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && Qe(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function Qe(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Le(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 4194090;
	}
	function $e(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Le(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
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
		var e = E.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Xf(e.type)) : e;
	}
	function rt(e, t) {
		var n = E.p;
		try {
			return E.p = e, t();
		} finally {
			E.p = n;
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
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Kd(e); e !== null;) {
					if (n = e[at]) return n;
					e = Kd(e);
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
			if (t === 5 || t === 6 || t === 13 || t === 26 || t === 27 || t === 3) return e;
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
	var At, jt;
	function Mt(e) {
		if (At === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			At = t && t[1] || "", jt = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + At + e + jt;
	}
	var Nt = !1;
	function Pt(e, t) {
		if (!e || Nt) return "";
		Nt = !0;
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
			Nt = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Mt(n) : "";
	}
	function Ft(e) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Mt(e.type);
			case 16: return Mt("Lazy");
			case 13: return Mt("Suspense");
			case 19: return Mt("SuspenseList");
			case 0:
			case 15: return Pt(e.type, !1);
			case 11: return Pt(e.type.render, !1);
			case 1: return Pt(e.type, !0);
			case 31: return Mt("Activity");
			default: return "";
		}
	}
	function It(e) {
		try {
			var t = "";
			do
				t += Ft(e), e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	function Lt(e) {
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
	function Rt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function zt(e) {
		var t = Rt(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
		if (!e.hasOwnProperty(t) && n !== void 0 && typeof n.get == "function" && typeof n.set == "function") {
			var i = n.get, a = n.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					r = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: n.enumerable }), {
				getValue: function() {
					return r;
				},
				setValue: function(e) {
					r = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Bt(e) {
		e._valueTracker ||= zt(e);
	}
	function Vt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Rt(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function Ht(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Ut = /[\n"\\]/g;
	function Wt(e) {
		return e.replace(Ut, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Gt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Lt(t)) : e.value !== "" + Lt(t) && (e.value = "" + Lt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : qt(e, o, Lt(n)) : qt(e, o, Lt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Lt(s) : e.removeAttribute("name");
	}
	function Kt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) return;
			n = n == null ? "" : "" + Lt(n), t = t == null ? n : "" + Lt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o);
	}
	function qt(e, t, n) {
		t === "number" && Ht(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Jt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Lt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Yt(e, t, n) {
		if (t != null && (t = "" + Lt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Lt(n);
	}
	function Xt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (ue(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Lt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r);
	}
	function Zt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Qt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function $t(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Qt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function en(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && $t(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && $t(e, o, t[o]);
	}
	function tn(e) {
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
	var nn = /* @__PURE__ */ new Map([
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
	]), rn = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function an(e) {
		return rn.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	var on = null;
	function sn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var cn = null, ln = null;
	function un(e) {
		var t = ht(e);
		if (t && (e = t.stateNode)) {
			var n = e[ot] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Gt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Wt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[ot] || null;
								if (!a) throw Error(i(90));
								Gt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Vt(r);
					}
					break a;
				case "textarea":
					Yt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Jt(e, !!n.multiple, t, !1);
			}
		}
	}
	var dn = !1;
	function fn(e, t, n) {
		if (dn) return e(t, n);
		dn = !0;
		try {
			return e(t);
		} finally {
			if (dn = !1, (cn !== null || ln !== null) && (cu(), cn && (t = cn, e = ln, ln = cn = null, un(t), e))) for (t = 0; t < e.length; t++) un(e[t]);
		}
	}
	function pn(e, t) {
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
	var mn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), hn = !1;
	if (mn) try {
		var gn = {};
		Object.defineProperty(gn, "passive", { get: function() {
			hn = !0;
		} }), window.addEventListener("test", gn, gn), window.removeEventListener("test", gn, gn);
	} catch {
		hn = !1;
	}
	var _n = null, vn = null, yn = null;
	function bn() {
		if (yn) return yn;
		var e, t = vn, n = t.length, r, i = "value" in _n ? _n.value : _n.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return yn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function xn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Sn() {
		return !0;
	}
	function Cn() {
		return !1;
	}
	function wn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Sn : Cn, this.isPropagationStopped = Cn, this;
		}
		return p(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Sn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Sn);
			},
			persist: function() {},
			isPersistent: Sn
		}), t;
	}
	var Tn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, En = wn(Tn), Dn = p({}, Tn, {
		view: 0,
		detail: 0
	}), On = wn(Dn), kn, An, jn, Mn = p({}, Dn, {
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
		getModifierState: Un,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== jn && (jn && e.type === "mousemove" ? (kn = e.screenX - jn.screenX, An = e.screenY - jn.screenY) : An = kn = 0, jn = e), kn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : An;
		}
	}), Nn = wn(Mn), Pn = wn(p({}, Mn, { dataTransfer: 0 })), Fn = wn(p({}, Dn, { relatedTarget: 0 })), In = wn(p({}, Tn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Ln = wn(p({}, Tn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Rn = wn(p({}, Tn, { data: 0 })), zn = {
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
	}, Bn = {
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
	}, Vn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Hn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Vn[e]) ? !!t[e] : !1;
	}
	function Un() {
		return Hn;
	}
	var Wn = wn(p({}, Dn, {
		key: function(e) {
			if (e.key) {
				var t = zn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = xn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Bn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Un,
		charCode: function(e) {
			return e.type === "keypress" ? xn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? xn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Gn = wn(p({}, Mn, {
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
	})), Kn = wn(p({}, Dn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Un
	})), qn = wn(p({}, Tn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Jn = wn(p({}, Mn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Yn = wn(p({}, Tn, {
		newState: 0,
		oldState: 0
	})), Xn = [
		9,
		13,
		27,
		32
	], Zn = mn && "CompositionEvent" in window, Qn = null;
	mn && "documentMode" in document && (Qn = document.documentMode);
	var $n = mn && "TextEvent" in window && !Qn, er = mn && (!Zn || Qn && 8 < Qn && 11 >= Qn), tr = " ", nr = !1;
	function rr(e, t) {
		switch (e) {
			case "keyup": return Xn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function ir(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var ar = !1;
	function or(e, t) {
		switch (e) {
			case "compositionend": return ir(t);
			case "keypress": return t.which === 32 ? (nr = !0, tr) : null;
			case "textInput": return e = t.data, e === tr && nr ? null : e;
			default: return null;
		}
	}
	function sr(e, t) {
		if (ar) return e === "compositionend" || !Zn && rr(e, t) ? (e = bn(), yn = vn = _n = null, ar = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return er && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var cr = {
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
	function lr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!cr[e.type] : t === "textarea";
	}
	function ur(e, t, n, r) {
		cn ? ln ? ln.push(r) : ln = [r] : cn = r, t = pd(t, "onChange"), 0 < t.length && (n = new En("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var dr = null, fr = null;
	function pr(e) {
		od(e, 0);
	}
	function mr(e) {
		if (Vt(gt(e))) return e;
	}
	function hr(e, t) {
		if (e === "change") return t;
	}
	var gr = !1;
	if (mn) {
		var _r;
		if (mn) {
			var vr = "oninput" in document;
			if (!vr) {
				var yr = document.createElement("div");
				yr.setAttribute("oninput", "return;"), vr = typeof yr.oninput == "function";
			}
			_r = vr;
		} else _r = !1;
		gr = _r && (!document.documentMode || 9 < document.documentMode);
	}
	function br() {
		dr && (dr.detachEvent("onpropertychange", xr), fr = dr = null);
	}
	function xr(e) {
		if (e.propertyName === "value" && mr(fr)) {
			var t = [];
			ur(t, fr, e, sn(e)), fn(pr, t);
		}
	}
	function Sr(e, t, n) {
		e === "focusin" ? (br(), dr = t, fr = n, dr.attachEvent("onpropertychange", xr)) : e === "focusout" && br();
	}
	function Cr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return mr(fr);
	}
	function wr(e, t) {
		if (e === "click") return mr(t);
	}
	function Tr(e, t) {
		if (e === "input" || e === "change") return mr(t);
	}
	function Er(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Dr = typeof Object.is == "function" ? Object.is : Er;
	function Or(e, t) {
		if (Dr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!xe.call(t, i) || !Dr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function kr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Ar(e, t) {
		var n = kr(e);
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
			n = kr(n);
		}
	}
	function jr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? jr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Mr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Ht(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Ht(e.document);
		}
		return t;
	}
	function Nr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Pr = mn && "documentMode" in document && 11 >= document.documentMode, Fr = null, Ir = null, Lr = null, Rr = !1;
	function zr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Rr || Fr == null || Fr !== Ht(r) || (r = Fr, "selectionStart" in r && Nr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Lr && Or(Lr, r) || (Lr = r, r = pd(Ir, "onSelect"), 0 < r.length && (t = new En("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Fr)));
	}
	function Br(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Vr = {
		animationend: Br("Animation", "AnimationEnd"),
		animationiteration: Br("Animation", "AnimationIteration"),
		animationstart: Br("Animation", "AnimationStart"),
		transitionrun: Br("Transition", "TransitionRun"),
		transitionstart: Br("Transition", "TransitionStart"),
		transitioncancel: Br("Transition", "TransitionCancel"),
		transitionend: Br("Transition", "TransitionEnd")
	}, Hr = {}, Ur = {};
	mn && (Ur = document.createElement("div").style, "AnimationEvent" in window || (delete Vr.animationend.animation, delete Vr.animationiteration.animation, delete Vr.animationstart.animation), "TransitionEvent" in window || delete Vr.transitionend.transition);
	function Wr(e) {
		if (Hr[e]) return Hr[e];
		if (!Vr[e]) return e;
		var t = Vr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Ur) return Hr[e] = t[n];
		return e;
	}
	var Gr = Wr("animationend"), Kr = Wr("animationiteration"), qr = Wr("animationstart"), Jr = Wr("transitionrun"), Yr = Wr("transitionstart"), Xr = Wr("transitioncancel"), Zr = Wr("transitionend"), Qr = /* @__PURE__ */ new Map(), $r = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	$r.push("scrollEnd");
	function ei(e, t) {
		Qr.set(e, t), xt(t, [e]);
	}
	var ti = /* @__PURE__ */ new WeakMap();
	function ni(e, t) {
		if (typeof e == "object" && e) {
			var n = ti.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: It(t)
			}, ti.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: It(t)
		};
	}
	var ri = [], ii = 0, ai = 0;
	function oi() {
		for (var e = ii, t = ai = ii = 0; t < e;) {
			var n = ri[t];
			ri[t++] = null;
			var r = ri[t];
			ri[t++] = null;
			var i = ri[t];
			ri[t++] = null;
			var a = ri[t];
			if (ri[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ui(n, i, a);
		}
	}
	function si(e, t, n, r) {
		ri[ii++] = e, ri[ii++] = t, ri[ii++] = n, ri[ii++] = r, ai |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ci(e, t, n, r) {
		return si(e, t, n, r), di(e);
	}
	function li(e, t) {
		return si(e, null, null, t), di(e);
	}
	function ui(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Le(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function di(e) {
		if (50 < $l) throw $l = 0, eu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var fi = {};
	function pi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function mi(e, t, n, r) {
		return new pi(e, t, n, r);
	}
	function hi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function gi(e, t) {
		var n = e.alternate;
		return n === null ? (n = mi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function _i(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function vi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") hi(e) && (s = 1);
		else if (typeof e == "string") s = Tf(e, n, k.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ie: return e = mi(31, n, t, a), e.elementType = ie, e.lanes = o, e;
			case v: return yi(n.children, a, o, t);
			case y:
				s = 8, a |= 24;
				break;
			case b: return e = mi(12, n, t, a | 2), e.elementType = b, e.lanes = o, e;
			case C: return e = mi(13, n, t, a), e.elementType = C, e.lanes = o, e;
			case w: return e = mi(19, n, t, a), e.elementType = w, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case ee:
					case S:
						s = 10;
						break a;
					case x:
						s = 9;
						break a;
					case te:
						s = 11;
						break a;
					case ne:
						s = 14;
						break a;
					case re:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = mi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function yi(e, t, n, r) {
		return e = mi(7, e, r, t), e.lanes = n, e;
	}
	function bi(e, t, n) {
		return e = mi(6, e, null, t), e.lanes = n, e;
	}
	function xi(e, t, n) {
		return t = mi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var Si = [], Ci = 0, wi = null, Ti = 0, Ei = [], Di = 0, Oi = null, ki = 1, Ai = "";
	function ji(e, t) {
		Si[Ci++] = Ti, Si[Ci++] = wi, wi = e, Ti = t;
	}
	function Mi(e, t, n) {
		Ei[Di++] = ki, Ei[Di++] = Ai, Ei[Di++] = Oi, Oi = e;
		var r = ki;
		e = Ai;
		var i = 32 - Le(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Le(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, ki = 1 << 32 - Le(t) + i | n << i | r, Ai = a + e;
		} else ki = 1 << a | n << i | r, Ai = e;
	}
	function Ni(e) {
		e.return !== null && (ji(e, 1), Mi(e, 1, 0));
	}
	function Pi(e) {
		for (; e === wi;) wi = Si[--Ci], Si[Ci] = null, Ti = Si[--Ci], Si[Ci] = null;
		for (; e === Oi;) Oi = Ei[--Di], Ei[Di] = null, Ai = Ei[--Di], Ei[Di] = null, ki = Ei[--Di], Ei[Di] = null;
	}
	var Fi = null, M = null, N = !1, Ii = null, Li = !1, Ri = Error(i(519));
	function zi(e) {
		throw Gi(ni(Error(i(418, "")), e)), Ri;
	}
	function Bi(e) {
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
				for (n = 0; n < id.length; n++) Q(id[n], t);
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
				Q("invalid", t), Kt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0), Bt(t);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), Xt(t, r.value, r.defaultValue, r.children), Bt(t);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || yd(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = bd), t = !0) : t = !1, t || zi(e);
	}
	function Vi(e) {
		for (Fi = e.return; Fi;) switch (Fi.tag) {
			case 5:
			case 13:
				Li = !1;
				return;
			case 27:
			case 3:
				Li = !0;
				return;
			default: Fi = Fi.return;
		}
	}
	function Hi(e) {
		if (e !== Fi) return !1;
		if (!N) return Vi(e), N = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || kd(e.type, e.memoizedProps)), n = !n), n && M && zi(e), Vi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						if (n = e.data, n === "/$") {
							if (t === 0) {
								M = Wd(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				M = null;
			}
		} else t === 27 ? (t = M, Ld(e.type) ? (e = Gd, Gd = null, M = e) : M = t) : M = Fi ? Wd(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Ui() {
		M = Fi = null, N = !1;
	}
	function Wi() {
		var e = Ii;
		return e !== null && (Bl === null ? Bl = e : Bl.push.apply(Bl, e), Ii = null), e;
	}
	function Gi(e) {
		Ii === null ? Ii = [e] : Ii.push(e);
	}
	var Ki = me(null), qi = null, Ji = null;
	function Yi(e, t, n) {
		O(Ki, t._currentValue), t._currentValue = n;
	}
	function Xi(e) {
		e._currentValue = Ki.current, D(Ki);
	}
	function Zi(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Qi(e, t, n, r) {
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
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), Zi(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), Zi(s, n, e), s = null;
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
	function $i(e, t, n, r) {
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
					Dr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === ge.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Ff] : e.push(Ff));
			}
			a = a.return;
		}
		e !== null && Qi(t, e, n, r), t.flags |= 262144;
	}
	function ea(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Dr(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ta(e) {
		qi = e, Ji = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function na(e) {
		return ia(qi, e);
	}
	function ra(e, t) {
		return qi === null && ta(e), ia(e, t);
	}
	function ia(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Ji === null) {
			if (e === null) throw Error(i(308));
			Ji = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Ji = Ji.next = t;
		return n;
	}
	var aa = typeof AbortController < "u" ? AbortController : function() {
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
	}, oa = t.unstable_scheduleCallback, sa = t.unstable_NormalPriority, P = {
		$$typeof: S,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ca() {
		return {
			controller: new aa(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function la(e) {
		e.refCount--, e.refCount === 0 && oa(sa, function() {
			e.controller.abort();
		});
	}
	var ua = null, da = 0, fa = 0, pa = null;
	function ma(e, t) {
		if (ua === null) {
			var n = ua = [];
			da = 0, fa = Qu(), pa = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return da++, t.then(ha, ha), t;
	}
	function ha() {
		if (--da === 0 && ua !== null) {
			pa !== null && (pa.status = "fulfilled");
			var e = ua;
			ua = null, fa = 0, pa = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ga(e, t) {
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
	var _a = T.S;
	T.S = function(e, t) {
		typeof t == "object" && t && typeof t.then == "function" && ma(e, t), _a !== null && _a(e, t);
	};
	var va = me(null);
	function ya() {
		var e = va.current;
		return e === null ? K.pooledCache : e;
	}
	function ba(e, t) {
		t === null ? O(va, va.current) : O(va, t.pool);
	}
	function xa() {
		var e = ya();
		return e === null ? null : {
			parent: P._currentValue,
			pool: e
		};
	}
	var Sa = Error(i(460)), Ca = Error(i(474)), wa = Error(i(542)), Ta = { then: function() {} };
	function Ea(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Da() {}
	function Oa(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Da, Da), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, ja(e), e;
			default:
				if (typeof t.status == "string") t.then(Da, Da);
				else {
					if (e = K, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
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
					case "rejected": throw e = t.reason, ja(e), e;
				}
				throw ka = t, Sa;
		}
	}
	var ka = null;
	function Aa() {
		if (ka === null) throw Error(i(459));
		var e = ka;
		return ka = null, e;
	}
	function ja(e) {
		if (e === Sa || e === wa) throw Error(i(483));
	}
	var Ma = !1;
	function Na(e) {
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
	function Pa(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Fa(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ia(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, G & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = di(e), ui(e, null, n), t;
		}
		return si(e, r, t, n), di(e);
	}
	function La(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, $e(e, n);
		}
	}
	function Ra(e, t) {
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
	var za = !1;
	function Ba() {
		if (za) {
			var e = pa;
			if (e !== null) throw e;
		}
	}
	function Va(e, t, n, r) {
		za = !1;
		var i = e.updateQueue;
		Ma = !1;
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
				var f = s.lane & -536870913, m = f !== s.lane;
				if (m ? (J & f) === f : (r & f) === f) {
					f !== 0 && f === fa && (za = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var h = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (h = g.payload, typeof h == "function") {
									d = h.call(_, d, f);
									break a;
								}
								d = h;
								break a;
							case 3: h.flags = h.flags & -65537 | 128;
							case 0:
								if (h = g.payload, f = typeof h == "function" ? h.call(_, d, f) : h, f == null) break a;
								d = p({}, d, f);
								break a;
							case 2: Ma = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, m && (e.flags |= 8192), m = i.callbacks, m === null ? i.callbacks = [f] : m.push(f));
				} else m = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = m, c = d) : u = u.next = m, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					m = s, s = m.next, m.next = null, i.lastBaseUpdate = m, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Pl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ha(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Ua(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ha(n[e], t);
	}
	var Wa = me(null), Ga = me(0);
	function Ka(e, t) {
		e = Nl, O(Ga, e), O(Wa, t), Nl = e | t.baseLanes;
	}
	function qa() {
		O(Ga, Nl), O(Wa, Wa.current);
	}
	function Ja() {
		Nl = Ga.current, D(Wa), D(Ga);
	}
	var Ya = 0, F = null, I = null, L = null, Xa = !1, Za = !1, Qa = !1, $a = 0, eo = 0, to = null, no = 0;
	function R() {
		throw Error(i(321));
	}
	function ro(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Dr(e[n], t[n])) return !1;
		return !0;
	}
	function io(e, t, n, r, i, a) {
		return Ya = a, F = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, T.H = e === null || e.memoizedState === null ? bs : xs, Qa = !1, a = n(r, i), Qa = !1, Za && (a = oo(t, n, r, i)), ao(e), a;
	}
	function ao(e) {
		T.H = ys;
		var t = I !== null && I.next !== null;
		if (Ya = 0, L = I = F = null, Xa = !1, eo = 0, to = null, t) throw Error(i(300));
		e === null || V || (e = e.dependencies, e !== null && ea(e) && (V = !0));
	}
	function oo(e, t, n, r) {
		F = e;
		var a = 0;
		do {
			if (Za && (to = null), eo = 0, Za = !1, 25 <= a) throw Error(i(301));
			if (a += 1, L = I = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			T.H = Ss, o = t(n, r);
		} while (Za);
		return o;
	}
	function so() {
		var e = T.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? mo(t) : t, e = e.useState()[0], (I === null ? null : I.memoizedState) !== e && (F.flags |= 1024), t;
	}
	function co() {
		var e = $a !== 0;
		return $a = 0, e;
	}
	function lo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function uo(e) {
		if (Xa) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Xa = !1;
		}
		Ya = 0, L = I = F = null, Za = !1, eo = $a = 0, to = null;
	}
	function fo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return L === null ? F.memoizedState = L = e : L = L.next = e, L;
	}
	function z() {
		if (I === null) {
			var e = F.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = I.next;
		var t = L === null ? F.memoizedState : L.next;
		if (t !== null) L = t, I = e;
		else {
			if (e === null) throw F.alternate === null ? Error(i(467)) : Error(i(310));
			I = e, e = {
				memoizedState: I.memoizedState,
				baseState: I.baseState,
				baseQueue: I.baseQueue,
				queue: I.queue,
				next: null
			}, L === null ? F.memoizedState = L = e : L = L.next = e;
		}
		return L;
	}
	function po() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function mo(e) {
		var t = eo;
		return eo += 1, to === null && (to = []), e = Oa(to, e, t), t = F, (L === null ? t.memoizedState : L.next) === null && (t = t.alternate, T.H = t === null || t.memoizedState === null ? bs : xs), e;
	}
	function ho(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return mo(e);
			if (e.$$typeof === S) return na(e);
		}
		throw Error(i(438, String(e)));
	}
	function go(e) {
		var t = null, n = F.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = F.alternate;
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
		}, n === null && (n = po(), F.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ae;
		return t.index++, n;
	}
	function _o(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function vo(e) {
		return yo(z(), I, e);
	}
	function yo(e, t, n) {
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
				if (f === u.lane ? (Ya & f) === f : (J & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === fa && (d = !0);
					else if ((Ya & p) === p) {
						u = u.next, p === fa && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, F.lanes |= p, Pl |= p;
					f = u.action, Qa && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, F.lanes |= f, Pl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Dr(o, e.memoizedState) && (V = !0, d && (n = pa, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function bo(e) {
		var t = z(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Dr(o, t.memoizedState) || (V = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function xo(e, t, n) {
		var r = F, a = z(), o = N;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Dr((I || a).memoizedState, n);
		if (s && (a.memoizedState = n, V = !0), a = a.queue, Go(2048, 8, wo.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || L !== null && L.memoizedState.tag & 1) {
			if (r.flags |= 2048, Vo(9, Ho(), Co.bind(null, r, a, n, t), null), K === null) throw Error(i(349));
			o || Ya & 124 || So(r, t, n);
		}
		return n;
	}
	function So(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = F.updateQueue, t === null ? (t = po(), F.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Co(e, t, n, r) {
		t.value = n, t.getSnapshot = r, To(t) && Eo(e);
	}
	function wo(e, t, n) {
		return n(function() {
			To(t) && Eo(e);
		});
	}
	function To(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Dr(e, n);
		} catch {
			return !0;
		}
	}
	function Eo(e) {
		var t = li(e, 2);
		t !== null && ru(t, e, 2);
	}
	function Do(e) {
		var t = fo();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Qa) {
				Ie(!0);
				try {
					n();
				} finally {
					Ie(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: _o,
			lastRenderedState: e
		}, t;
	}
	function Oo(e, t, n, r) {
		return e.baseState = n, yo(e, I, typeof r == "function" ? r : _o);
	}
	function ko(e, t, n, r, a) {
		if (gs(e)) throw Error(i(485));
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
			T.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Ao(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Ao(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = T.T, o = {};
			T.T = o;
			try {
				var s = n(i, r), c = T.S;
				c !== null && c(o, s), jo(e, t, s);
			} catch (n) {
				No(e, t, n);
			} finally {
				T.T = a;
			}
		} else try {
			a = n(i, r), jo(e, t, a);
		} catch (n) {
			No(e, t, n);
		}
	}
	function jo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Mo(e, t, n);
		}, function(n) {
			return No(e, t, n);
		}) : Mo(e, t, n);
	}
	function Mo(e, t, n) {
		t.status = "fulfilled", t.value = n, Po(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Ao(e, n)));
	}
	function No(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Po(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Po(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Fo(e, t) {
		return t;
	}
	function Io(e, t) {
		if (N) {
			var n = K.formState;
			if (n !== null) {
				a: {
					var r = F;
					if (N) {
						if (M) {
							b: {
								for (var i = M, a = Li; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = Wd(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								M = Wd(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						zi(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = fo(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Fo,
			lastRenderedState: t
		}, n.queue = r, n = ps.bind(null, F, r), r.dispatch = n, r = Do(!1), a = hs.bind(null, F, !1, r.queue), r = fo(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = ko.bind(null, F, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Lo(e) {
		return Ro(z(), I, e);
	}
	function Ro(e, t, n) {
		if (t = yo(e, t, Fo)[0], e = vo(_o)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = mo(t);
		} catch (e) {
			throw e === Sa ? wa : e;
		}
		else r = t;
		t = z();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (F.flags |= 2048, Vo(9, Ho(), zo.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function zo(e, t) {
		e.action = t;
	}
	function Bo(e) {
		var t = z(), n = I;
		if (n !== null) return Ro(t, n, e);
		z(), t = t.memoizedState, n = z();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function Vo(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = F.updateQueue, t === null && (t = po(), F.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Ho() {
		return {
			destroy: void 0,
			resource: void 0
		};
	}
	function Uo() {
		return z().memoizedState;
	}
	function Wo(e, t, n, r) {
		var i = fo();
		r = r === void 0 ? null : r, F.flags |= e, i.memoizedState = Vo(1 | t, Ho(), n, r);
	}
	function Go(e, t, n, r) {
		var i = z();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		I !== null && r !== null && ro(r, I.memoizedState.deps) ? i.memoizedState = Vo(t, a, n, r) : (F.flags |= e, i.memoizedState = Vo(1 | t, a, n, r));
	}
	function Ko(e, t) {
		Wo(8390656, 8, e, t);
	}
	function qo(e, t) {
		Go(2048, 8, e, t);
	}
	function Jo(e, t) {
		return Go(4, 2, e, t);
	}
	function Yo(e, t) {
		return Go(4, 4, e, t);
	}
	function Xo(e, t) {
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
	function Zo(e, t, n) {
		n = n == null ? null : n.concat([e]), Go(4, 4, Xo.bind(null, t, e), n);
	}
	function Qo() {}
	function $o(e, t) {
		var n = z();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && ro(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function es(e, t) {
		var n = z();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && ro(t, r[1])) return r[0];
		if (r = e(), Qa) {
			Ie(!0);
			try {
				e();
			} finally {
				Ie(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function ts(e, t, n) {
		return n === void 0 || Ya & 1073741824 ? e.memoizedState = t : (e.memoizedState = n, e = nu(), F.lanes |= e, Pl |= e, n);
	}
	function ns(e, t, n, r) {
		return Dr(n, t) ? n : Wa.current === null ? Ya & 42 ? (e = nu(), F.lanes |= e, Pl |= e, t) : (V = !0, e.memoizedState = n) : (e = ts(e, n, r), Dr(e, t) || (V = !0), e);
	}
	function rs(e, t, n, r, i) {
		var a = E.p;
		E.p = a !== 0 && 8 > a ? a : 8;
		var o = T.T, s = {};
		T.T = s, hs(e, !1, t, n);
		try {
			var c = i(), l = T.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? ms(e, t, ga(c, r), tu(e)) : ms(e, t, r, tu(e));
		} catch (n) {
			ms(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, tu());
		} finally {
			E.p = a, T.T = o;
		}
	}
	function is() {}
	function as(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = os(e).queue;
		rs(e, a, t, de, n === null ? is : function() {
			return ss(e), n(r);
		});
	}
	function os(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: de,
			baseState: de,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: _o,
				lastRenderedState: de
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
				lastRenderedReducer: _o,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function ss(e) {
		var t = os(e).next.queue;
		ms(e, t, {}, tu());
	}
	function cs() {
		return na(Ff);
	}
	function ls() {
		return z().memoizedState;
	}
	function us() {
		return z().memoizedState;
	}
	function ds(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = tu();
					e = Fa(n);
					var r = Ia(t, e, n);
					r !== null && (ru(r, t, n), La(r, t, n)), t = { cache: ca() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function fs(e, t, n) {
		var r = tu();
		n = {
			lane: r,
			revertLane: 0,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, gs(e) ? _s(t, n) : (n = ci(e, t, n, r), n !== null && (ru(n, e, r), vs(n, t, r)));
	}
	function ps(e, t, n) {
		ms(e, t, n, tu());
	}
	function ms(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (gs(e)) _s(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Dr(s, o)) return si(e, t, i, 0), K === null && oi(), !1;
			} catch {}
			if (n = ci(e, t, i, r), n !== null) return ru(n, e, r), vs(n, t, r), !0;
		}
		return !1;
	}
	function hs(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Qu(),
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, gs(e)) {
			if (t) throw Error(i(479));
		} else t = ci(e, n, r, 2), t !== null && ru(t, e, 2);
	}
	function gs(e) {
		var t = e.alternate;
		return e === F || t !== null && t === F;
	}
	function _s(e, t) {
		Za = Xa = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function vs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, $e(e, n);
		}
	}
	var ys = {
		readContext: na,
		use: ho,
		useCallback: R,
		useContext: R,
		useEffect: R,
		useImperativeHandle: R,
		useLayoutEffect: R,
		useInsertionEffect: R,
		useMemo: R,
		useReducer: R,
		useRef: R,
		useState: R,
		useDebugValue: R,
		useDeferredValue: R,
		useTransition: R,
		useSyncExternalStore: R,
		useId: R,
		useHostTransitionStatus: R,
		useFormState: R,
		useActionState: R,
		useOptimistic: R,
		useMemoCache: R,
		useCacheRefresh: R
	}, bs = {
		readContext: na,
		use: ho,
		useCallback: function(e, t) {
			return fo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: na,
		useEffect: Ko,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Wo(4194308, 4, Xo.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Wo(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Wo(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = fo();
			t = t === void 0 ? null : t;
			var r = e();
			if (Qa) {
				Ie(!0);
				try {
					e();
				} finally {
					Ie(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = fo();
			if (n !== void 0) {
				var i = n(t);
				if (Qa) {
					Ie(!0);
					try {
						n(t);
					} finally {
						Ie(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = fs.bind(null, F, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = fo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Do(e);
			var t = e.queue, n = ps.bind(null, F, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Qo,
		useDeferredValue: function(e, t) {
			return ts(fo(), e, t);
		},
		useTransition: function() {
			var e = Do(!1);
			return e = rs.bind(null, F, e.queue, !0, !1), fo().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = F, a = fo();
			if (N) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), K === null) throw Error(i(349));
				J & 124 || So(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Ko(wo.bind(null, r, o, e), [e]), r.flags |= 2048, Vo(9, Ho(), Co.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = fo(), t = K.identifierPrefix;
			if (N) {
				var n = Ai, r = ki;
				n = (r & ~(1 << 32 - Le(r) - 1)).toString(32) + n, t = "«" + t + "R" + n, n = $a++, 0 < n && (t += "H" + n.toString(32)), t += "»";
			} else n = no++, t = "«" + t + "r" + n.toString(32) + "»";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: cs,
		useFormState: Io,
		useActionState: Io,
		useOptimistic: function(e) {
			var t = fo();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = hs.bind(null, F, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: go,
		useCacheRefresh: function() {
			return fo().memoizedState = ds.bind(null, F);
		}
	}, xs = {
		readContext: na,
		use: ho,
		useCallback: $o,
		useContext: na,
		useEffect: qo,
		useImperativeHandle: Zo,
		useInsertionEffect: Jo,
		useLayoutEffect: Yo,
		useMemo: es,
		useReducer: vo,
		useRef: Uo,
		useState: function() {
			return vo(_o);
		},
		useDebugValue: Qo,
		useDeferredValue: function(e, t) {
			return ns(z(), I.memoizedState, e, t);
		},
		useTransition: function() {
			var e = vo(_o)[0], t = z().memoizedState;
			return [typeof e == "boolean" ? e : mo(e), t];
		},
		useSyncExternalStore: xo,
		useId: ls,
		useHostTransitionStatus: cs,
		useFormState: Lo,
		useActionState: Lo,
		useOptimistic: function(e, t) {
			return Oo(z(), I, e, t);
		},
		useMemoCache: go,
		useCacheRefresh: us
	}, Ss = {
		readContext: na,
		use: ho,
		useCallback: $o,
		useContext: na,
		useEffect: qo,
		useImperativeHandle: Zo,
		useInsertionEffect: Jo,
		useLayoutEffect: Yo,
		useMemo: es,
		useReducer: bo,
		useRef: Uo,
		useState: function() {
			return bo(_o);
		},
		useDebugValue: Qo,
		useDeferredValue: function(e, t) {
			var n = z();
			return I === null ? ts(n, e, t) : ns(n, I.memoizedState, e, t);
		},
		useTransition: function() {
			var e = bo(_o)[0], t = z().memoizedState;
			return [typeof e == "boolean" ? e : mo(e), t];
		},
		useSyncExternalStore: xo,
		useId: ls,
		useHostTransitionStatus: cs,
		useFormState: Bo,
		useActionState: Bo,
		useOptimistic: function(e, t) {
			var n = z();
			return I === null ? (n.baseState = e, [e, n.queue.dispatch]) : Oo(n, I, e, t);
		},
		useMemoCache: go,
		useCacheRefresh: us
	}, Cs = null, ws = 0;
	function Ts(e) {
		var t = ws;
		return ws += 1, Cs === null && (Cs = []), Oa(Cs, e, t);
	}
	function Es(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Ds(e, t) {
		throw t.$$typeof === h ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Os(e) {
		var t = e._init;
		return t(e._payload);
	}
	function ks(e) {
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
			return e = gi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = bi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === v ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === re && Os(i) === t.type) ? (t = a(t, n.props), Es(t, n), t.return = e, t) : (t = vi(n.type, n.key, n.props, null, e.mode, r), Es(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = xi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = yi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = bi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case g: return n = vi(t.type, t.key, t.props, null, e.mode, n), Es(n, t), n.return = e, n;
					case _: return t = xi(t, e.mode, n), t.return = e, t;
					case re:
						var r = t._init;
						return t = r(t._payload), f(e, t, n);
				}
				if (ue(t) || se(t)) return t = yi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ts(t), n);
				if (t.$$typeof === S) return f(e, ra(e, t), n);
				Ds(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case g: return n.key === i ? l(e, t, n, r) : null;
					case _: return n.key === i ? u(e, t, n, r) : null;
					case re: return i = n._init, n = i(n._payload), p(e, t, n, r);
				}
				if (ue(n) || se(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ts(n), r);
				if (n.$$typeof === S) return p(e, t, ra(e, n), r);
				Ds(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case g: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case _: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case re:
						var a = r._init;
						return r = a(r._payload), m(e, t, n, r, i);
				}
				if (ue(r) || se(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ts(r), i);
				if (r.$$typeof === S) return m(e, t, n, ra(t, r), i);
				Ds(t, r);
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
			if (h === s.length) return n(i, d), N && ji(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return N && ji(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), N && ji(i, h), l;
		}
		function y(a, s, c, l) {
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
			if (v.done) return n(a, h), N && ji(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return N && ji(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), N && ji(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === v && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case g:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === v) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === re && Os(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Es(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === v ? (c = yi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = vi(o.type, o.key, o.props, null, e.mode, c), Es(c, o), c.return = e, e = c);
						}
						return s(e);
					case _:
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
							c = xi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case re: return l = o._init, o = l(o._payload), b(e, r, o, c);
				}
				if (ue(o)) return h(e, r, o, c);
				if (se(o)) {
					if (l = se(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), y(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Ts(o), c);
				if (o.$$typeof === S) return b(e, r, ra(e, o), c);
				Ds(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = bi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				ws = 0;
				var i = b(e, t, n, r);
				return Cs = null, i;
			} catch (t) {
				if (t === Sa || t === wa) throw t;
				var a = mi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var As = ks(!0), js = ks(!1), Ms = me(null), Ns = null;
	function Ps(e) {
		var t = e.alternate;
		O(B, B.current & 1), O(Ms, e), Ns === null && (t === null || Wa.current !== null || t.memoizedState !== null) && (Ns = e);
	}
	function Fs(e) {
		if (e.tag === 22) {
			if (O(B, B.current), O(Ms, e), Ns === null) {
				var t = e.alternate;
				t !== null && t.memoizedState !== null && (Ns = e);
			}
		} else Is(e);
	}
	function Is() {
		O(B, B.current), O(Ms, Ms.current);
	}
	function Ls(e) {
		D(Ms), Ns === e && (Ns = null), D(B);
	}
	var B = me(0);
	function Rs(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || Hd(n))) return t;
			} else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
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
	function zs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : p({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Bs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = tu(), i = Fa(r);
			i.payload = t, n != null && (i.callback = n), t = Ia(e, i, r), t !== null && (ru(t, e, r), La(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = tu(), i = Fa(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ia(e, i, r), t !== null && (ru(t, e, r), La(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = tu(), r = Fa(n);
			r.tag = 2, t != null && (r.callback = t), t = Ia(e, r, n), t !== null && (ru(t, e, n), La(t, e, n));
		}
	};
	function Vs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Or(n, r) || !Or(i, a) : !0;
	}
	function Hs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Bs.enqueueReplaceState(t, t.state, null);
	}
	function Us(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = p({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	var Ws = typeof reportError == "function" ? reportError : function(e) {
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
	};
	function Gs(e) {
		Ws(e);
	}
	function Ks(e) {
		console.error(e);
	}
	function qs(e) {
		Ws(e);
	}
	function Js(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Ys(e, t, n) {
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
	function Xs(e, t, n) {
		return n = Fa(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Js(e, t);
		}, n;
	}
	function Zs(e) {
		return e = Fa(e), e.tag = 3, e;
	}
	function Qs(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Ys(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Ys(t, n, r), typeof i != "function" && (Gl === null ? Gl = /* @__PURE__ */ new Set([this]) : Gl.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function $s(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && $i(t, n, a, !0), n = Ms.current, n !== null) {
				switch (n.tag) {
					case 13: return Ns === null ? mu() : n.alternate === null && X === 0 && (X = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ta ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Mu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ta ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Mu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Mu(e, r, a), mu(), !1;
		}
		if (N) return t = Ms.current, t === null ? (r !== Ri && (t = Error(i(423), { cause: r }), Gi(ni(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = ni(r, n), a = Xs(e.stateNode, r, a), Ra(e, a), X !== 4 && (X = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Ri && (e = Error(i(422), { cause: r }), Gi(ni(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = ni(o, n), zl === null ? zl = [o] : zl.push(o), X !== 4 && (X = 2), t === null) return !0;
		r = ni(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Xs(n.stateNode, r, e), Ra(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (Gl === null || !Gl.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Zs(a), Qs(a, e, n, r), Ra(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var ec = Error(i(461)), V = !1;
	function tc(e, t, n, r) {
		t.child = e === null ? js(t, null, n, r) : As(t, e.child, n, r);
	}
	function nc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ta(t), r = io(e, t, n, o, a, i), s = co(), e !== null && !V ? (lo(e, t, i), Sc(e, t, i)) : (N && s && Ni(t), t.flags |= 1, tc(e, t, r, i), t.child);
	}
	function rc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !hi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, ic(e, t, a, r, i)) : (e = vi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Cc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Or : n, n(o, r) && e.ref === t.ref) return Sc(e, t, i);
		}
		return t.flags |= 1, e = gi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function ic(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Or(a, r) && e.ref === t.ref) {
				if (V = !1, t.pendingProps = r = a, Cc(e, i)) e.flags & 131072 && (V = !0);
				else return t.lanes = e.lanes, Sc(e, t, i);
			}
		}
		return cc(e, t, n, r, i);
	}
	function ac(e, t, n) {
		var r = t.pendingProps, i = r.children, a = e === null ? null : e.memoizedState;
		if (r.mode === "hidden") {
			if (t.flags & 128) {
				if (r = a === null ? n : a.baseLanes | n, e !== null) {
					for (i = t.child = e.child, a = 0; i !== null;) a = a | i.lanes | i.childLanes, i = i.sibling;
					t.childLanes = a & ~r;
				} else t.childLanes = 0, t.child = null;
				return oc(e, t, r, n);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && ba(t, a === null ? null : a.cachePool), a === null ? qa() : Ka(t, a), Fs(t);
			else return t.lanes = t.childLanes = 536870912, oc(e, t, a === null ? n : a.baseLanes | n, n);
		} else a === null ? (e !== null && ba(t, null), qa(), Is(t)) : (ba(t, a.cachePool), Ka(t, a), Is(t), t.memoizedState = null);
		return tc(e, t, i, n), t.child;
	}
	function oc(e, t, n, r) {
		var i = ya();
		return i = i === null ? null : {
			parent: P._currentValue,
			pool: i
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: i
		}, e !== null && ba(t, null), qa(), Fs(t), e !== null && $i(e, t, r, !0), null;
	}
	function sc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function cc(e, t, n, r, i) {
		return ta(t), n = io(e, t, n, r, void 0, i), r = co(), e !== null && !V ? (lo(e, t, i), Sc(e, t, i)) : (N && r && Ni(t), t.flags |= 1, tc(e, t, n, i), t.child);
	}
	function lc(e, t, n, r, i, a) {
		return ta(t), t.updateQueue = null, n = oo(t, r, n, i), ao(e), r = co(), e !== null && !V ? (lo(e, t, a), Sc(e, t, a)) : (N && r && Ni(t), t.flags |= 1, tc(e, t, n, a), t.child);
	}
	function uc(e, t, n, r, i) {
		if (ta(t), t.stateNode === null) {
			var a = fi, o = n.contextType;
			typeof o == "object" && o && (a = na(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Bs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Na(t), o = n.contextType, a.context = typeof o == "object" && o ? na(o) : fi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (zs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Bs.enqueueReplaceState(a, a.state, null), Va(t, r, a, i), Ba(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Us(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = fi, typeof u == "object" && u && (o = na(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Hs(t, a, r, o), Ma = !1;
			var f = t.memoizedState;
			a.state = f, Va(t, r, a, i), Ba(), l = t.memoizedState, s || f !== l || Ma ? (typeof d == "function" && (zs(t, n, d, r), l = t.memoizedState), (c = Ma || Vs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Pa(e, t), o = t.memoizedProps, u = Us(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = fi, typeof l == "object" && l && (c = na(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Hs(t, a, r, c), Ma = !1, f = t.memoizedState, a.state = f, Va(t, r, a, i), Ba();
			var p = t.memoizedState;
			o !== d || f !== p || Ma || e !== null && e.dependencies !== null && ea(e.dependencies) ? (typeof s == "function" && (zs(t, n, s, r), p = t.memoizedState), (u = Ma || Vs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ea(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, sc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = As(t, e.child, null, i), t.child = As(t, null, n, i)) : tc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Sc(e, t, i), e;
	}
	function dc(e, t, n, r) {
		return Ui(), t.flags |= 256, tc(e, t, n, r), t.child;
	}
	var fc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function pc(e) {
		return {
			baseLanes: e,
			cachePool: xa()
		};
	}
	function mc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Ll), e;
	}
	function hc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(B.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (N) {
				if (a ? Ps(t) : Is(t), N) {
					var c = M, l;
					if (l = c) {
						c: {
							for (l = c, c = Li; l.nodeType !== 8;) {
								if (!c) {
									c = null;
									break c;
								}
								if (l = Wd(l.nextSibling), l === null) {
									c = null;
									break c;
								}
							}
							c = l;
						}
						c === null ? l = !1 : (t.memoizedState = {
							dehydrated: c,
							treeContext: Oi === null ? null : {
								id: ki,
								overflow: Ai
							},
							retryLane: 536870912,
							hydrationErrors: null
						}, l = mi(18, null, null, 0), l.stateNode = c, l.return = t, t.child = l, Fi = t, M = null, l = !0);
					}
					l || zi(t);
				}
				if (c = t.memoizedState, c !== null && (c = c.dehydrated, c !== null)) return Hd(c) ? t.lanes = 32 : t.lanes = 536870912, null;
				Ls(t);
			}
			return c = r.children, r = r.fallback, a ? (Is(t), a = t.mode, c = _c({
				mode: "hidden",
				children: c
			}, a), r = yi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, a = t.child, a.memoizedState = pc(n), a.childLanes = mc(e, s, n), t.memoizedState = fc, r) : (Ps(t), gc(t, c));
		}
		if (l = e.memoizedState, l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (Ps(t), t.flags &= -257, t = vc(e, t, n)) : t.memoizedState === null ? (Is(t), a = r.fallback, c = t.mode, r = _c({
				mode: "visible",
				children: r.children
			}, c), a = yi(a, c, n, null), a.flags |= 2, r.return = t, a.return = t, r.sibling = a, t.child = r, As(t, e.child, null, n), r = t.child, r.memoizedState = pc(n), r.childLanes = mc(e, s, n), t.memoizedState = fc, t = a) : (Is(t), t.child = e.child, t.flags |= 128, t = null);
			else if (Ps(t), Hd(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Gi({
					value: r,
					source: null,
					stack: null
				}), t = vc(e, t, n);
			} else if (V || $i(e, t, n, !1), s = (n & e.childLanes) !== 0, V || s) {
				if (s = K, s !== null && (r = n & -n, r = r & 42 ? 1 : et(r), r = (r & (s.suspendedLanes | n)) === 0 ? r : 0, r !== 0 && r !== l.retryLane)) throw l.retryLane = r, li(e, r), ru(s, e, r), ec;
				c.data === "$?" || mu(), t = vc(e, t, n);
			} else c.data === "$?" ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, M = Wd(c.nextSibling), Fi = t, N = !0, Ii = null, Li = !1, e !== null && (Ei[Di++] = ki, Ei[Di++] = Ai, Ei[Di++] = Oi, ki = e.id, Ai = e.overflow, Oi = t), t = gc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (Is(t), a = r.fallback, c = t.mode, l = e.child, u = l.sibling, r = gi(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (a = yi(a, c, n, null), a.flags |= 2) : a = gi(u, a), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, c = e.child.memoizedState, c === null ? c = pc(n) : (l = c.cachePool, l === null ? l = xa() : (u = P._currentValue, l = l.parent === u ? l : {
			parent: u,
			pool: u
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: l
		}), a.memoizedState = c, a.childLanes = mc(e, s, n), t.memoizedState = fc, r) : (Ps(t), n = e.child, e = n.sibling, n = gi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function gc(e, t) {
		return t = _c({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function _c(e, t) {
		return e = mi(22, e, null, t), e.lanes = 0, e.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}, e;
	}
	function vc(e, t, n) {
		return As(t, e.child, null, n), e = gc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function yc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Zi(e.return, t, n);
	}
	function bc(e, t, n, r, i) {
		var a = e.memoizedState;
		a === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i
		} : (a.isBackwards = t, a.rendering = null, a.renderingStartTime = 0, a.last = r, a.tail = n, a.tailMode = i);
	}
	function xc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		if (tc(e, t, r.children, n), r = B.current, r & 2) r = r & 1 | 2, t.flags |= 128;
		else {
			if (e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
				if (e.tag === 13) e.memoizedState !== null && yc(e, n, t);
				else if (e.tag === 19) yc(e, n, t);
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
			r &= 1;
		}
		switch (O(B, r), i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && Rs(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), bc(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Rs(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				bc(t, !0, n, null, a);
				break;
			case "together":
				bc(t, !1, null, null, void 0);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Sc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Pl |= t.lanes, (n & t.childLanes) === 0) {
			if (e !== null) {
				if ($i(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = gi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = gi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Cc(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && ea(e)));
	}
	function wc(e, t, n) {
		switch (t.tag) {
			case 3:
				_e(t, t.stateNode.containerInfo), Yi(t, P, e.memoizedState.cache), Ui();
				break;
			case 27:
			case 5:
				ye(t);
				break;
			case 4:
				_e(t, t.stateNode.containerInfo);
				break;
			case 10:
				Yi(t, t.type, t.memoizedProps.value);
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (Ps(t), e = Sc(e, t, n), e === null ? null : e.sibling) : hc(e, t, n) : (Ps(t), t.flags |= 128, null);
				Ps(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= ($i(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return xc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), O(B, B.current), r) break;
				return null;
			case 22:
			case 23: return t.lanes = 0, ac(e, t, n);
			case 24: Yi(t, P, e.memoizedState.cache);
		}
		return Sc(e, t, n);
	}
	function Tc(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) V = !0;
			else {
				if (!Cc(e, n) && !(t.flags & 128)) return V = !1, wc(e, t, n);
				V = !!(e.flags & 131072);
			}
		} else V = !1, N && t.flags & 1048576 && Mi(t, Ti, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					e = t.pendingProps;
					var r = t.elementType, a = r._init;
					if (r = a(r._payload), t.type = r, typeof r == "function") hi(r) ? (e = Us(r, e), t.tag = 1, t = uc(null, t, r, e, n)) : (t.tag = 0, t = cc(null, t, r, e, n));
					else {
						if (r != null) {
							if (a = r.$$typeof, a === te) {
								t.tag = 11, t = nc(null, t, r, e, n);
								break a;
							}
							if (a === ne) {
								t.tag = 14, t = rc(null, t, r, e, n);
								break a;
							}
						}
						throw t = le(r) || r, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return cc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Us(r, t.pendingProps), uc(e, t, r, a, n);
			case 3:
				a: {
					if (_e(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Pa(e, t), Va(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Yi(t, P, r), r !== o.cache && Qi(t, [P], n, !0), Ba(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = dc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = ni(Error(i(424)), t), Gi(a), t = dc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (M = Wd(e.firstChild), Fi = t, N = !0, Ii = null, Li = !0, n = js(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Ui(), r === a) {
							t = Sc(e, t, n);
							break a;
						}
						tc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return sc(e, t), e === null ? (n = df(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : N || (n = t.type, e = t.pendingProps, r = Ed(he.current).createElement(n), r[at] = t, r[ot] = e, Sd(r, n, e), vt(r), t.stateNode = r) : t.memoizedState = df(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ye(t), e === null && N && (r = t.stateNode = qd(t.type, t.pendingProps, he.current), Fi = t, Li = !0, a = M, Ld(t.type) ? (Gd = a, M = Wd(r.firstChild)) : M = a), tc(e, t, t.pendingProps.children, n), sc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && N && ((a = r = M) && (r = Bd(r, t.type, t.pendingProps, Li), r === null ? a = !1 : (t.stateNode = r, Fi = t, M = Wd(r.firstChild), Li = !1, a = !0)), a || zi(t)), ye(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, kd(a, o) ? r = null : s !== null && kd(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = io(e, t, so, null, null, n), Ff._currentValue = a), sc(e, t), tc(e, t, r, n), t.child;
			case 6: return e === null && N && ((e = n = M) && (n = Vd(n, t.pendingProps, Li), n === null ? e = !1 : (t.stateNode = n, Fi = t, M = null, e = !0)), e || zi(t)), null;
			case 13: return hc(e, t, n);
			case 4: return _e(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = As(t, null, r, n) : tc(e, t, r, n), t.child;
			case 11: return nc(e, t, t.type, t.pendingProps, n);
			case 7: return tc(e, t, t.pendingProps, n), t.child;
			case 8: return tc(e, t, t.pendingProps.children, n), t.child;
			case 12: return tc(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Yi(t, t.type, r.value), tc(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, ta(t), a = na(a), r = r(a), t.flags |= 1, tc(e, t, r, n), t.child;
			case 14: return rc(e, t, t.type, t.pendingProps, n);
			case 15: return ic(e, t, t.type, t.pendingProps, n);
			case 19: return xc(e, t, n);
			case 31: return r = t.pendingProps, n = t.mode, r = {
				mode: r.mode,
				children: r.children
			}, e === null ? (n = _c(r, n), n.ref = t.ref, t.child = n, n.return = t, t = n) : (n = gi(e.child, r), n.ref = t.ref, t.child = n, n.return = t, t = n), t;
			case 22: return ac(e, t, n);
			case 24: return ta(t), r = na(P), e === null ? (a = ya(), a === null && (a = K, o = ca(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Na(t), Yi(t, P, a)) : ((e.lanes & n) !== 0 && (Pa(e, t), Va(t, null, null, n), Ba()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Yi(t, P, r), r !== a.cache && Qi(t, [P], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Yi(t, P, r))), tc(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Ec(e) {
		e.flags |= 4;
	}
	function Dc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Ef(t)) {
			if (t = Ms.current, t !== null && ((J & 4194048) === J ? Ns !== null : (J & 62914560) !== J && !(J & 536870912) || t !== Ns)) throw ka = Ta, Ca;
			e.flags |= 8192;
		}
	}
	function Oc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Je(), e.lanes |= t, Rl |= t);
	}
	function kc(e, t) {
		if (!N) switch (e.tailMode) {
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
	function H(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Ac(e, t, n) {
		var r = t.pendingProps;
		switch (Pi(t), t.tag) {
			case 31:
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return H(t), null;
			case 1: return H(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Xi(P), ve(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Hi(t) ? Ec(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Wi())), H(t), null;
			case 26: return n = t.memoizedState, e === null ? (Ec(t), n === null ? (H(t), t.flags &= -16777217) : (H(t), Dc(t, n))) : n ? n === e.memoizedState ? (H(t), t.flags &= -16777217) : (Ec(t), H(t), Dc(t, n)) : (e.memoizedProps !== r && Ec(t), H(t), t.flags &= -16777217), null;
			case 27:
				be(t), n = he.current;
				var a = t.type;
				if (e !== null && t.stateNode != null) e.memoizedProps !== r && Ec(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), null;
					}
					e = k.current, Hi(t) ? Bi(t, e) : (e = qd(a, r, n), t.stateNode = e, Ec(t));
				}
				return H(t), null;
			case 5:
				if (be(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Ec(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), null;
					}
					if (e = k.current, Hi(t)) Bi(t, e);
					else {
						switch (a = Ed(he.current), e) {
							case 1:
								e = a.createElementNS("http://www.w3.org/2000/svg", n);
								break;
							case 2:
								e = a.createElementNS("http://www.w3.org/1998/Math/MathML", n);
								break;
							default: switch (n) {
								case "svg":
									e = a.createElementNS("http://www.w3.org/2000/svg", n);
									break;
								case "math":
									e = a.createElementNS("http://www.w3.org/1998/Math/MathML", n);
									break;
								case "script":
									e = a.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild);
									break;
								case "select":
									e = typeof r.is == "string" ? a.createElement("select", { is: r.is }) : a.createElement("select"), r.multiple ? e.multiple = !0 : r.size && (e.size = r.size);
									break;
								default: e = typeof r.is == "string" ? a.createElement(n, { is: r.is }) : a.createElement(n);
							}
						}
						e[at] = t, e[ot] = r;
						a: for (a = t.child; a !== null;) {
							if (a.tag === 5 || a.tag === 6) e.appendChild(a.stateNode);
							else if (a.tag !== 4 && a.tag !== 27 && a.child !== null) {
								a.child.return = a, a = a.child;
								continue;
							}
							if (a === t) break a;
							for (; a.sibling === null;) {
								if (a.return === null || a.return === t) break a;
								a = a.return;
							}
							a.sibling.return = a.return, a = a.sibling;
						}
						t.stateNode = e;
						a: switch (Sd(e, n, r), n) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								e = !!r.autoFocus;
								break a;
							case "img":
								e = !0;
								break a;
							default: e = !1;
						}
						e && Ec(t);
					}
				}
				return H(t), t.flags &= -16777217, null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Ec(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = he.current, Hi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Fi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[at] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || yd(e.nodeValue, n)), e || zi(t);
					} else e = Ed(e).createTextNode(r), e[at] = t, t.stateNode = e;
				}
				return H(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Hi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[at] = t;
						} else Ui(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						H(t), a = !1;
					} else a = Wi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Ls(t), t) : (Ls(t), null);
				}
				if (Ls(t), t.flags & 128) return t.lanes = n, t;
				if (n = r !== null, e = e !== null && e.memoizedState !== null, n) {
					r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool);
					var o = null;
					r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048);
				}
				return n !== e && n && (t.child.flags |= 8192), Oc(t, t.updateQueue), H(t), null;
			case 4: return ve(), e === null && ld(t.stateNode.containerInfo), H(t), null;
			case 10: return Xi(t.type), H(t), null;
			case 19:
				if (D(B), a = t.memoizedState, a === null) return H(t), null;
				if (r = !!(t.flags & 128), o = a.rendering, o === null) {
					if (r) kc(a, !1);
					else {
						if (X !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Rs(e), o !== null) {
								for (t.flags |= 128, kc(a, !1), e = o.updateQueue, t.updateQueue = e, Oc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) _i(n, e), n = n.sibling;
								return O(B, B.current & 1 | 2), t.child;
							}
							e = e.sibling;
						}
						a.tail !== null && Ee() > Ul && (t.flags |= 128, r = !0, kc(a, !1), t.lanes = 4194304);
					}
				} else {
					if (!r) {
						if (e = Rs(o), e !== null) {
							if (t.flags |= 128, r = !0, e = e.updateQueue, t.updateQueue = e, Oc(t, e), kc(a, !0), a.tail === null && a.tailMode === "hidden" && !o.alternate && !N) return H(t), null;
						} else 2 * Ee() - a.renderingStartTime > Ul && n !== 536870912 && (t.flags |= 128, r = !0, kc(a, !1), t.lanes = 4194304);
					}
					a.isBackwards ? (o.sibling = t.child, t.child = o) : (e = a.last, e === null ? t.child = o : e.sibling = o, a.last = o);
				}
				return a.tail === null ? (H(t), null) : (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = Ee(), t.sibling = null, e = B.current, O(B, r ? e & 1 | 2 : e & 1), t);
			case 22:
			case 23: return Ls(t), Ja(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (H(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : H(t), n = t.updateQueue, n !== null && Oc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && D(va), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Xi(P), H(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function jc(e, t) {
		switch (Pi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Xi(P), ve(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return be(t), null;
			case 13:
				if (Ls(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Ui();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return D(B), null;
			case 4: return ve(), null;
			case 10: return Xi(t.type), null;
			case 22:
			case 23: return Ls(t), Ja(), e !== null && D(va), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Xi(P), null;
			case 25: return null;
			default: return null;
		}
	}
	function Mc(e, t) {
		switch (Pi(t), t.tag) {
			case 3:
				Xi(P), ve();
				break;
			case 26:
			case 27:
			case 5:
				be(t);
				break;
			case 4:
				ve();
				break;
			case 13:
				Ls(t);
				break;
			case 19:
				D(B);
				break;
			case 10:
				Xi(t.type);
				break;
			case 22:
			case 23:
				Ls(t), Ja(), e !== null && D(va);
				break;
			case 24: Xi(P);
		}
	}
	function Nc(e, t) {
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
	function Pc(e, t, n) {
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
	function Fc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Ua(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Ic(e, t, n) {
		n.props = Us(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Z(e, t, n);
		}
	}
	function Lc(e, t) {
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
	function Rc(e, t) {
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
	function zc(e) {
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
	function Bc(e, t, n) {
		try {
			var r = e.stateNode;
			Cd(r, e.type, n, t), r[ot] = t;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	function Vc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ld(e.type) || e.tag === 4;
	}
	function Hc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Vc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Ld(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Uc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = bd));
		else if (r !== 4 && (r === 27 && Ld(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Uc(e, t, n), e = e.sibling; e !== null;) Uc(e, t, n), e = e.sibling;
	}
	function Wc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Ld(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (Wc(e, t, n), e = e.sibling; e !== null;) Wc(e, t, n), e = e.sibling;
	}
	function Gc(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Sd(t, r, n), t[at] = e, t[ot] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var Kc = !1, U = !1, qc = !1, Jc = typeof WeakSet == "function" ? WeakSet : Set, Yc = null;
	function Xc(e, t) {
		if (e = e.containerInfo, wd = Uf, e = Mr(e), Nr(e)) {
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
		for (Td = {
			focusedElem: e,
			selectionRange: n
		}, Uf = !1, Yc = t; Yc !== null;) if (t = Yc, e = t.child, t.subtreeFlags & 1024 && e !== null) e.return = t, Yc = e;
		else for (; Yc !== null;) {
			switch (t = Yc, o = t.alternate, e = t.flags, t.tag) {
				case 0: break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Us(n.type, a, n.elementType === n.type);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Z(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) zd(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								zd(e);
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
				e.return = t.return, Yc = e;
				break;
			}
			Yc = t.return;
		}
	}
	function Zc(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				ul(e, n), r & 4 && Nc(5, n);
				break;
			case 1:
				if (ul(e, n), r & 4) {
					if (e = n.stateNode, t === null) try {
						e.componentDidMount();
					} catch (e) {
						Z(n, n.return, e);
					}
					else {
						var i = Us(n.type, t.memoizedProps);
						t = t.memoizedState;
						try {
							e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
						} catch (e) {
							Z(n, n.return, e);
						}
					}
				}
				r & 64 && Fc(n), r & 512 && Lc(n, n.return);
				break;
			case 3:
				if (ul(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Ua(e, t);
					} catch (e) {
						Z(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Gc(n);
			case 26:
			case 5:
				ul(e, n), t === null && r & 4 && zc(n), r & 512 && Lc(n, n.return);
				break;
			case 12:
				ul(e, n);
				break;
			case 13:
				ul(e, n), r & 4 && nl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Fu.bind(null, n), Ud(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || Kc, !r) {
					t = t !== null && t.memoizedState !== null || U, i = Kc;
					var a = U;
					Kc = r, (U = t) && !a ? fl(e, n, !!(n.subtreeFlags & 8772)) : ul(e, n), Kc = i, U = a;
				}
				break;
			case 30: break;
			default: ul(e, n);
		}
	}
	function Qc(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, Qc(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && pt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var W = null, $c = !1;
	function el(e, t, n) {
		for (n = n.child; n !== null;) tl(e, t, n), n = n.sibling;
	}
	function tl(e, t, n) {
		if (Fe && typeof Fe.onCommitFiberUnmount == "function") try {
			Fe.onCommitFiberUnmount(Pe, n);
		} catch {}
		switch (n.tag) {
			case 26:
				U || Rc(n, t), el(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				U || Rc(n, t);
				var r = W, i = $c;
				Ld(n.type) && (W = n.stateNode, $c = !1), el(e, t, n), Jd(n.stateNode), W = r, $c = i;
				break;
			case 5: U || Rc(n, t);
			case 6:
				if (r = W, i = $c, W = null, el(e, t, n), W = r, $c = i, W !== null) {
					if ($c) try {
						(W.nodeType === 9 ? W.body : W.nodeName === "HTML" ? W.ownerDocument.body : W).removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
					else try {
						W.removeChild(n.stateNode);
					} catch (e) {
						Z(n, t, e);
					}
				}
				break;
			case 18:
				W !== null && ($c ? (e = W, Rd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), hp(e)) : Rd(W, n.stateNode));
				break;
			case 4:
				r = W, i = $c, W = n.stateNode.containerInfo, $c = !0, el(e, t, n), W = r, $c = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				U || Pc(2, n, t), U || Pc(4, n, t), el(e, t, n);
				break;
			case 1:
				U || (Rc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Ic(n, t, r)), el(e, t, n);
				break;
			case 21:
				el(e, t, n);
				break;
			case 22:
				U = (r = U) || n.memoizedState !== null, el(e, t, n), U = r;
				break;
			default: el(e, t, n);
		}
	}
	function nl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			hp(e);
		} catch (e) {
			Z(t, t.return, e);
		}
	}
	function rl(e) {
		switch (e.tag) {
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new Jc()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Jc()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function il(e, t) {
		var n = rl(e);
		t.forEach(function(t) {
			var r = Iu.bind(null, e, t);
			n.has(t) || (n.add(t), t.then(r, r));
		});
	}
	function al(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Ld(c.type)) {
							W = c.stateNode, $c = !1;
							break a;
						}
						break;
					case 5:
						W = c.stateNode, $c = !1;
						break a;
					case 3:
					case 4:
						W = c.stateNode.containerInfo, $c = !0;
						break a;
				}
				c = c.return;
			}
			if (W === null) throw Error(i(160));
			tl(o, s, a), W = null, $c = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13878) for (t = t.child; t !== null;) sl(t, e), t = t.sibling;
	}
	var ol = null;
	function sl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				al(t, e), cl(e), r & 4 && (Pc(3, e, e.return), Nc(3, e), Pc(5, e, e.return));
				break;
			case 1:
				al(t, e), cl(e), r & 512 && (U || n === null || Rc(n, n.return)), r & 64 && Kc && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = ol;
				if (al(t, e), cl(e), r & 512 && (U || n === null || Rc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) {
						if (r === null) {
							if (e.stateNode === null) {
								a: {
									r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
									b: switch (r) {
										case "title":
											o = a.getElementsByTagName("title")[0], (!o || o[ft] || o[at] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Sd(o, r, n), o[at] = e, vt(o), r = o;
											break a;
										case "link":
											var s = Cf("link", "href", a).get(r + (n.href || ""));
											if (s) {
												for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Sd(o, r, n), a.head.appendChild(o);
											break;
										case "meta":
											if (s = Cf("meta", "content", a).get(r + (n.content || ""))) {
												for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
													s.splice(c, 1);
													break b;
												}
											}
											o = a.createElement(r), Sd(o, r, n), a.head.appendChild(o);
											break;
										default: throw Error(i(468, r));
									}
									o[at] = e, vt(o), r = o;
								}
								e.stateNode = r;
							} else wf(a, e.type, e.stateNode);
						} else e.stateNode = vf(a, r, e.memoizedProps);
					} else o === r ? r === null && e.stateNode !== null && Bc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? wf(a, e.type, e.stateNode) : vf(a, r, e.memoizedProps));
				}
				break;
			case 27:
				al(t, e), cl(e), r & 512 && (U || n === null || Rc(n, n.return)), n !== null && r & 4 && Bc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (al(t, e), cl(e), r & 512 && (U || n === null || Rc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Zt(a, "");
					} catch (t) {
						Z(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Bc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (qc = !0);
				break;
			case 6:
				if (al(t, e), cl(e), r & 4) {
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
				if (Sf = null, a = ol, ol = Zd(t.containerInfo), al(t, e), ol = a, cl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					hp(t.containerInfo);
				} catch (t) {
					Z(e, e.return, t);
				}
				qc && (qc = !1, ll(e));
				break;
			case 4:
				r = ol, ol = Zd(e.stateNode.containerInfo), al(t, e), cl(e), ol = r;
				break;
			case 12:
				al(t, e), cl(e);
				break;
			case 13:
				al(t, e), cl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (Hl = Ee()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, il(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = Kc, d = U;
				if (Kc = u || a, U = d || l, al(t, e), U = d, Kc = u, cl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || Kc || U || dl(e)), n = null, t = e;;) {
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
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, il(e, n))));
				break;
			case 19:
				al(t, e), cl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, il(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: al(t, e), cl(e);
		}
	}
	function cl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Vc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						Wc(e, Hc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Zt(o, ""), n.flags &= -33), Wc(e, Hc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Uc(e, Hc(e), s);
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
	function ll(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			ll(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function ul(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) Zc(e, t.alternate, t), t = t.sibling;
	}
	function dl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Pc(4, t, t.return), dl(t);
					break;
				case 1:
					Rc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Ic(t, t.return, n), dl(t);
					break;
				case 27: Jd(t.stateNode);
				case 26:
				case 5:
					Rc(t, t.return), dl(t);
					break;
				case 22:
					t.memoizedState === null && dl(t);
					break;
				case 30:
					dl(t);
					break;
				default: dl(t);
			}
			e = e.sibling;
		}
	}
	function fl(e, t, n) {
		for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					fl(i, a, n), Nc(4, a);
					break;
				case 1:
					if (fl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Z(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ha(c[i], s);
						} catch (e) {
							Z(r, r.return, e);
						}
					}
					n && o & 64 && Fc(a), Lc(a, a.return);
					break;
				case 27: Gc(a);
				case 26:
				case 5:
					fl(i, a, n), n && r === null && o & 4 && zc(a), Lc(a, a.return);
					break;
				case 12:
					fl(i, a, n);
					break;
				case 13:
					fl(i, a, n), n && o & 4 && nl(i, a);
					break;
				case 22:
					a.memoizedState === null && fl(i, a, n), Lc(a, a.return);
					break;
				case 30: break;
				default: fl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function pl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && la(n));
	}
	function ml(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && la(e));
	}
	function hl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) gl(e, t, n, r), t = t.sibling;
	}
	function gl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				hl(e, t, n, r), i & 2048 && Nc(9, t);
				break;
			case 1:
				hl(e, t, n, r);
				break;
			case 3:
				hl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && la(e)));
				break;
			case 12:
				if (i & 2048) {
					hl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Z(t, t.return, e);
					}
				} else hl(e, t, n, r);
				break;
			case 13:
				hl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? hl(e, t, n, r) : (a._visibility |= 2, _l(e, t, n, r, !!(t.subtreeFlags & 10256))) : a._visibility & 2 ? hl(e, t, n, r) : vl(e, t), i & 2048 && pl(o, t);
				break;
			case 24:
				hl(e, t, n, r), i & 2048 && ml(t.alternate, t);
				break;
			default: hl(e, t, n, r);
		}
	}
	function _l(e, t, n, r, i) {
		for (i &&= !!(t.subtreeFlags & 10256), t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					_l(a, o, s, c, i), Nc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, _l(a, o, s, c, i)) : u._visibility & 2 ? _l(a, o, s, c, i) : vl(a, o), i && l & 2048 && pl(o.alternate, o);
					break;
				case 24:
					_l(a, o, s, c, i), i && l & 2048 && ml(o.alternate, o);
					break;
				default: _l(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function vl(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					vl(n, r), i & 2048 && pl(r.alternate, r);
					break;
				case 24:
					vl(n, r), i & 2048 && ml(r.alternate, r);
					break;
				default: vl(n, r);
			}
			t = t.sibling;
		}
	}
	var yl = 8192;
	function bl(e) {
		if (e.subtreeFlags & yl) for (e = e.child; e !== null;) xl(e), e = e.sibling;
	}
	function xl(e) {
		switch (e.tag) {
			case 26:
				bl(e), e.flags & yl && e.memoizedState !== null && kf(ol, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				bl(e);
				break;
			case 3:
			case 4:
				var t = ol;
				ol = Zd(e.stateNode.containerInfo), bl(e), ol = t;
				break;
			case 22:
				e.memoizedState === null && (t = e.alternate, t !== null && t.memoizedState !== null ? (t = yl, yl = 16777216, bl(e), yl = t) : bl(e));
				break;
			default: bl(e);
		}
	}
	function Sl(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Cl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				Yc = r, El(r, e);
			}
			Sl(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) wl(e), e = e.sibling;
	}
	function wl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Cl(e), e.flags & 2048 && Pc(9, e, e.return);
				break;
			case 3:
				Cl(e);
				break;
			case 12:
				Cl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Tl(e)) : Cl(e);
				break;
			default: Cl(e);
		}
	}
	function Tl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				Yc = r, El(r, e);
			}
			Sl(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Pc(8, t, t.return), Tl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Tl(t));
					break;
				default: Tl(t);
			}
			e = e.sibling;
		}
	}
	function El(e, t) {
		for (; Yc !== null;) {
			var n = Yc;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Pc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: la(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, Yc = r;
			else a: for (n = e; Yc !== null;) {
				r = Yc;
				var i = r.sibling, a = r.return;
				if (Qc(r), r === n) {
					Yc = null;
					break a;
				}
				if (i !== null) {
					i.return = a, Yc = i;
					break a;
				}
				Yc = a;
			}
		}
	}
	var Dl = { getCacheForType: function(e) {
		var t = na(P), n = t.data.get(e);
		return n === void 0 && (n = e(), t.data.set(e, n)), n;
	} }, Ol = typeof WeakMap == "function" ? WeakMap : Map, G = 0, K = null, q = null, J = 0, Y = 0, kl = null, Al = !1, jl = !1, Ml = !1, Nl = 0, X = 0, Pl = 0, Fl = 0, Il = 0, Ll = 0, Rl = 0, zl = null, Bl = null, Vl = !1, Hl = 0, Ul = Infinity, Wl = null, Gl = null, Kl = 0, ql = null, Jl = null, Yl = 0, Xl = 0, Zl = null, Ql = null, $l = 0, eu = null;
	function tu() {
		if (G & 2 && J !== 0) return J & -J;
		if (T.T !== null) {
			var e = fa;
			return e === 0 ? Qu() : e;
		}
		return nt();
	}
	function nu() {
		Ll === 0 && (Ll = !(J & 536870912) || N ? qe() : 536870912);
		var e = Ms.current;
		return e !== null && (e.flags |= 32), Ll;
	}
	function ru(e, t, n) {
		(e === K && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) && (uu(e, 0), su(e, J, Ll, !1)), Xe(e, n), (!(G & 2) || e !== K) && (e === K && (!(G & 2) && (Fl |= n), X === 4 && su(e, J, Ll, !1)), Wu(e));
	}
	function iu(e, t, n) {
		if (G & 6) throw Error(i(327));
		var r = !n && !(t & 124) && (t & e.expiredLanes) === 0 || Ge(e, t), a = r ? _u(e, t) : hu(e, t, !0), o = r;
		do {
			if (a === 0) {
				jl && !r && su(e, t, 0, !1);
				break;
			}
			if (n = e.current.alternate, o && !ou(n)) {
				a = hu(e, t, !1), o = !1;
				continue;
			}
			if (a === 2) {
				if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
				else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
				if (s !== 0) {
					t = s;
					a: {
						var c = e;
						a = zl;
						var l = c.current.memoizedState.isDehydrated;
						if (l && (uu(c, s).flags |= 256), s = hu(c, s, !1), s !== 2) {
							if (Ml && !l) {
								c.errorRecoveryDisabledLanes |= o, Fl |= o, a = 4;
								break a;
							}
							o = Bl, Bl = a, o !== null && (Bl === null ? Bl = o : Bl.push.apply(Bl, o));
						}
						a = s;
					}
					if (o = !1, a !== 2) continue;
				}
			}
			if (a === 1) {
				uu(e, 0), su(e, t, 0, !0);
				break;
			}
			a: {
				switch (r = e, o = a, o) {
					case 0:
					case 1: throw Error(i(345));
					case 4: if ((t & 4194048) !== t) break;
					case 6:
						su(r, t, Ll, !Al);
						break a;
					case 2:
						Bl = null;
						break;
					case 3:
					case 5: break;
					default: throw Error(i(329));
				}
				if ((t & 62914560) === t && (a = Hl + 300 - Ee(), 10 < a)) {
					if (su(r, t, Ll, !Al), We(r, 0, !0) !== 0) break a;
					r.timeoutHandle = Md(au.bind(null, r, n, Bl, Wl, Vl, t, Ll, Fl, Rl, Al, o, 2, -0, 0), a);
					break a;
				}
				au(r, n, Bl, Wl, Vl, t, Ll, Fl, Rl, Al, o, 0, -0, 0);
			}
			break;
		} while (1);
		Wu(e);
	}
	function au(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, (d & 8192 || (d & 16785408) == 16785408) && (Df = {
			stylesheets: null,
			count: 0,
			unsuspend: Of
		}, xl(t), d = Af(), d !== null)) {
			e.cancelPendingCommit = d(wu.bind(null, e, t, a, n, r, i, o, s, c, u, 1, f, p)), su(e, a, o, !l);
			return;
		}
		wu(e, t, a, n, r, i, o, s, c);
	}
	function ou(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Dr(a(), i)) return !1;
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
	function su(e, t, n, r) {
		t &= ~Il, t &= ~Fl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - Le(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && Qe(e, n, t);
	}
	function cu() {
		return G & 6 ? !0 : (Gu(0, !1), !1);
	}
	function lu() {
		if (q !== null) {
			if (Y === 0) var e = q.return;
			else e = q, Ji = qi = null, uo(e), Cs = null, ws = 0, e = q;
			for (; e !== null;) Mc(e.alternate, e), e = e.return;
			q = null;
		}
	}
	function uu(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, Nd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), lu(), K = e, q = n = gi(e.current, null), J = t, Y = 0, kl = null, Al = !1, jl = Ge(e, t), Ml = !1, Rl = Ll = Il = Fl = Pl = X = 0, Bl = zl = null, Vl = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Le(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Nl = t, oi(), n;
	}
	function du(e, t) {
		F = null, T.H = ys, t === Sa || t === wa ? (t = Aa(), Y = 3) : t === Ca ? (t = Aa(), Y = 4) : Y = t === ec ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, kl = t, q === null && (X = 1, Js(e, ni(t, e.current)));
	}
	function fu() {
		var e = T.H;
		return T.H = ys, e === null ? ys : e;
	}
	function pu() {
		var e = T.A;
		return T.A = Dl, e;
	}
	function mu() {
		X = 4, Al || (J & 4194048) !== J && Ms.current !== null || (jl = !0), !(Pl & 134217727) && !(Fl & 134217727) || K === null || su(K, J, Ll, !1);
	}
	function hu(e, t, n) {
		var r = G;
		G |= 2;
		var i = fu(), a = pu();
		(K !== e || J !== t) && (Wl = null, uu(e, t)), t = !1;
		var o = X;
		a: do
			try {
				if (Y !== 0 && q !== null) {
					var s = q, c = kl;
					switch (Y) {
						case 8:
							lu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Ms.current === null && (t = !0);
							var l = Y;
							if (Y = 0, kl = null, xu(e, s, c, l), n && jl) {
								o = 0;
								break a;
							}
							break;
						default: l = Y, Y = 0, kl = null, xu(e, s, c, l);
					}
				}
				gu(), o = X;
				break;
			} catch (t) {
				du(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Ji = qi = null, G = r, T.H = i, T.A = a, q === null && (K = null, J = 0, oi()), o;
	}
	function gu() {
		for (; q !== null;) yu(q);
	}
	function _u(e, t) {
		var n = G;
		G |= 2;
		var r = fu(), a = pu();
		K !== e || J !== t ? (Wl = null, Ul = Ee() + 500, uu(e, t)) : jl = Ge(e, t);
		a: do
			try {
				if (Y !== 0 && q !== null) {
					t = q;
					var o = kl;
					b: switch (Y) {
						case 1:
							Y = 0, kl = null, xu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (Ea(o)) {
								Y = 0, kl = null, bu(t);
								break;
							}
							t = function() {
								Y !== 2 && Y !== 9 || K !== e || (Y = 7), Wu(e);
							}, o.then(t, t);
							break a;
						case 3:
							Y = 7;
							break a;
						case 4:
							Y = 5;
							break a;
						case 7:
							Ea(o) ? (Y = 0, kl = null, bu(t)) : (Y = 0, kl = null, xu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (q.tag) {
								case 26: s = q.memoizedState;
								case 5:
								case 27:
									var c = q;
									if (!s || Ef(s)) {
										Y = 0, kl = null;
										var l = c.sibling;
										if (l !== null) q = l;
										else {
											var u = c.return;
											u === null ? q = null : (q = u, Su(u));
										}
										break b;
									}
							}
							Y = 0, kl = null, xu(e, t, o, 5);
							break;
						case 6:
							Y = 0, kl = null, xu(e, t, o, 6);
							break;
						case 8:
							lu(), X = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				vu();
				break;
			} catch (t) {
				du(e, t);
			}
		while (1);
		return Ji = qi = null, T.H = r, T.A = a, G = n, q === null ? (K = null, J = 0, oi(), X) : 0;
	}
	function vu() {
		for (; q !== null && !we();) yu(q);
	}
	function yu(e) {
		var t = Tc(e.alternate, e, Nl);
		e.memoizedProps = e.pendingProps, t === null ? Su(e) : q = t;
	}
	function bu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = lc(n, t, t.pendingProps, t.type, void 0, J);
				break;
			case 11:
				t = lc(n, t, t.pendingProps, t.type.render, t.ref, J);
				break;
			case 5: uo(t);
			default: Mc(n, t), t = q = _i(t, Nl), t = Tc(n, t, Nl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Su(e) : q = t;
	}
	function xu(e, t, n, r) {
		Ji = qi = null, uo(t), Cs = null, ws = 0;
		var i = t.return;
		try {
			if ($s(e, i, t, n, J)) {
				X = 1, Js(e, ni(n, e.current)), q = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw q = i, t;
			X = 1, Js(e, ni(n, e.current)), q = null;
			return;
		}
		t.flags & 32768 ? (N || r === 1 ? e = !0 : jl || J & 536870912 ? e = !1 : (Al = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Ms.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Cu(t, e)) : Su(t);
	}
	function Su(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Cu(t, Al);
				return;
			}
			e = t.return;
			var n = Ac(t.alternate, t, Nl);
			if (n !== null) {
				q = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				q = t;
				return;
			}
			q = t = e;
		} while (t !== null);
		X === 0 && (X = 5);
	}
	function Cu(e, t) {
		do {
			var n = jc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, q = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				q = e;
				return;
			}
			q = e = n;
		} while (e !== null);
		X = 6, q = null;
	}
	function wu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			ku();
		while (Kl !== 0);
		if (G & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= ai, Ze(e, n, o, s, c, l), e === K && (q = K = null, J = 0), Jl = t, ql = e, Yl = n, Xl = o, Zl = a, Ql = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Lu(ke, function() {
				return Au(!0), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = T.T, T.T = null, a = E.p, E.p = 2, s = G, G |= 4;
				try {
					Xc(e, t, n);
				} finally {
					G = s, E.p = a, T.T = r;
				}
			}
			Kl = 1, Tu(), Eu(), Du();
		}
	}
	function Tu() {
		if (Kl === 1) {
			Kl = 0;
			var e = ql, t = Jl, n = !!(t.flags & 13878);
			if (t.subtreeFlags & 13878 || n) {
				n = T.T, T.T = null;
				var r = E.p;
				E.p = 2;
				var i = G;
				G |= 4;
				try {
					sl(t, e);
					var a = Td, o = Mr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && jr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Nr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Ar(s, h), v = Ar(s, g);
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
					Uf = !!wd, Td = wd = null;
				} finally {
					G = i, E.p = r, T.T = n;
				}
			}
			e.current = t, Kl = 2;
		}
	}
	function Eu() {
		if (Kl === 2) {
			Kl = 0;
			var e = ql, t = Jl, n = !!(t.flags & 8772);
			if (t.subtreeFlags & 8772 || n) {
				n = T.T, T.T = null;
				var r = E.p;
				E.p = 2;
				var i = G;
				G |= 4;
				try {
					Zc(e, t.alternate, t);
				} finally {
					G = i, E.p = r, T.T = n;
				}
			}
			Kl = 3;
		}
	}
	function Du() {
		if (Kl === 4 || Kl === 3) {
			Kl = 0, Te();
			var e = ql, t = Jl, n = Yl, r = Ql;
			t.subtreeFlags & 10256 || t.flags & 10256 ? Kl = 5 : (Kl = 0, Jl = ql = null, Ou(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (Gl = null), tt(n), t = t.stateNode, Fe && typeof Fe.onCommitFiberRoot == "function") try {
				Fe.onCommitFiberRoot(Pe, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = T.T, i = E.p, E.p = 2, T.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					T.T = t, E.p = i;
				}
			}
			Yl & 3 && ku(), Wu(e), i = e.pendingLanes, n & 4194090 && i & 42 ? e === eu ? $l++ : ($l = 0, eu = e) : $l = 0, Gu(0, !1);
		}
	}
	function Ou(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, la(t)));
	}
	function ku(e) {
		return Tu(), Eu(), Du(), Au(e);
	}
	function Au() {
		if (Kl !== 5) return !1;
		var e = ql, t = Xl;
		Xl = 0;
		var n = tt(Yl), r = T.T, a = E.p;
		try {
			E.p = 32 > n ? 32 : n, T.T = null, n = Zl, Zl = null;
			var o = ql, s = Yl;
			if (Kl = 0, Jl = ql = null, Yl = 0, G & 6) throw Error(i(331));
			var c = G;
			if (G |= 4, wl(o.current), gl(o, o.current, s, n), G = c, Gu(0, !1), Fe && typeof Fe.onPostCommitFiberRoot == "function") try {
				Fe.onPostCommitFiberRoot(Pe, o);
			} catch {}
			return !0;
		} finally {
			E.p = a, T.T = r, Ou(e, t);
		}
	}
	function ju(e, t, n) {
		t = ni(n, t), t = Xs(e.stateNode, t, 2), e = Ia(e, t, 2), e !== null && (Xe(e, 2), Wu(e));
	}
	function Z(e, t, n) {
		if (e.tag === 3) ju(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				ju(t, e, n);
				break;
			}
			if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (Gl === null || !Gl.has(r))) {
					e = ni(n, e), n = Zs(2), r = Ia(t, n, 2), r !== null && (Qs(n, r, t, e), Xe(r, 2), Wu(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Mu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ol();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Ml = !0, i.add(n), e = Nu.bind(null, e, t, n), t.then(e, e));
	}
	function Nu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, K === e && (J & n) === n && (X === 4 || X === 3 && (J & 62914560) === J && 300 > Ee() - Hl ? !(G & 2) && uu(e, 0) : Il |= n, Rl === J && (Rl = 0)), Wu(e);
	}
	function Pu(e, t) {
		t === 0 && (t = Je()), e = li(e, t), e !== null && (Xe(e, t), Wu(e));
	}
	function Fu(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Pu(e, n);
	}
	function Iu(e, t) {
		var n = 0;
		switch (e.tag) {
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
		r !== null && r.delete(t), Pu(e, n);
	}
	function Lu(e, t) {
		return Se(e, t);
	}
	var Ru = null, zu = null, Bu = !1, Vu = !1, Hu = !1, Uu = 0;
	function Wu(e) {
		e !== zu && e.next === null && (zu === null ? Ru = zu = e : zu = zu.next = e), Vu = !0, Bu || (Bu = !0, Zu());
	}
	function Gu(e, t) {
		if (!Hu && Vu) {
			Hu = !0;
			do
				for (var n = !1, r = Ru; r !== null;) {
					if (!t) {
						if (e !== 0) {
							var i = r.pendingLanes;
							if (i === 0) var a = 0;
							else {
								var o = r.suspendedLanes, s = r.pingedLanes;
								a = (1 << 31 - Le(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Xu(r, a));
						} else a = J, a = We(r, r === K ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ge(r, a) || (n = !0, Xu(r, a));
					}
					r = r.next;
				}
			while (n);
			Hu = !1;
		}
	}
	function Ku() {
		qu();
	}
	function qu() {
		Vu = Bu = !1;
		var e = 0;
		Uu !== 0 && (jd() && (e = Uu), Uu = 0);
		for (var t = Ee(), n = null, r = Ru; r !== null;) {
			var i = r.next, a = Ju(r, t);
			a === 0 ? (r.next = null, n === null ? Ru = i : n.next = i, i === null && (zu = n)) : (n = r, (e !== 0 || a & 3) && (Vu = !0)), r = i;
		}
		Gu(e, !1);
	}
	function Ju(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Le(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ke(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = K, n = J, n = We(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Ce(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ge(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && Ce(r), tt(n)) {
				case 2:
				case 8:
					n = Oe;
					break;
				case 32:
					n = ke;
					break;
				case 268435456:
					n = je;
					break;
				default: n = ke;
			}
			return r = Yu.bind(null, e), n = Se(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && Ce(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Yu(e, t) {
		if (Kl !== 0 && Kl !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (ku(!0) && e.callbackNode !== n) return null;
		var r = J;
		return r = We(e, e === K ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (iu(e, r, t), Ju(e, Ee()), e.callbackNode != null && e.callbackNode === n ? Yu.bind(null, e) : null);
	}
	function Xu(e, t) {
		if (ku()) return null;
		iu(e, t, !0);
	}
	function Zu() {
		Fd(function() {
			G & 6 ? Se(De, Ku) : qu();
		});
	}
	function Qu() {
		return Uu === 0 && (Uu = qe()), Uu;
	}
	function $u(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : an("" + e);
	}
	function ed(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function td(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = $u((i[ot] || null).action), o = r.submitter;
			o && (t = (t = o[ot] || null) ? $u(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new En("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Uu !== 0) {
								var e = o ? ed(i, o) : new FormData(i);
								as(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? ed(i, o) : new FormData(i), as(n, {
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
	for (var nd = 0; nd < $r.length; nd++) {
		var rd = $r[nd];
		ei(rd.toLowerCase(), "on" + (rd[0].toUpperCase() + rd.slice(1)));
	}
	ei(Gr, "onAnimationEnd"), ei(Kr, "onAnimationIteration"), ei(qr, "onAnimationStart"), ei("dblclick", "onDoubleClick"), ei("focusin", "onFocus"), ei("focusout", "onBlur"), ei(Jr, "onTransitionRun"), ei(Yr, "onTransitionStart"), ei(Xr, "onTransitionCancel"), ei(Zr, "onTransitionEnd"), St("onMouseEnter", ["mouseout", "mouseover"]), St("onMouseLeave", ["mouseout", "mouseover"]), St("onPointerEnter", ["pointerout", "pointerover"]), St("onPointerLeave", ["pointerout", "pointerover"]), xt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), xt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), xt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), xt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), xt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var id = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), ad = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(id));
	function od(e, t) {
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
						Ws(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Ws(e);
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
		n.has(r) || (ud(t, e, 2, !1), n.add(r));
	}
	function sd(e, t, n) {
		var r = 0;
		t && (r |= 4), ud(n, e, r, t);
	}
	var cd = "_reactListening" + Math.random().toString(36).slice(2);
	function ld(e) {
		if (!e[cd]) {
			e[cd] = !0, yt.forEach(function(t) {
				t !== "selectionchange" && (ad.has(t) || sd(t, !1, e), sd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[cd] || (t[cd] = !0, sd("selectionchange", !1, t));
		}
	}
	function ud(e, t, n, r) {
		switch (Xf(t)) {
			case 2:
				var i = Wf;
				break;
			case 8:
				i = Gf;
				break;
			default: i = Kf;
		}
		n = i.bind(null, t, n, e), i = void 0, !hn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function dd(e, t, n, r, i) {
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
		fn(function() {
			var r = a, i = sn(n), s = [];
			a: {
				var c = Qr.get(e);
				if (c !== void 0) {
					var l = En, u = e;
					switch (e) {
						case "keypress": if (xn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Wn;
							break;
						case "focusin":
							u = "focus", l = Fn;
							break;
						case "focusout":
							u = "blur", l = Fn;
							break;
						case "beforeblur":
						case "afterblur":
							l = Fn;
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
							l = Nn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Pn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Kn;
							break;
						case Gr:
						case Kr:
						case qr:
							l = In;
							break;
						case Zr:
							l = qn;
							break;
						case "scroll":
						case "scrollend":
							l = On;
							break;
						case "wheel":
							l = Jn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Ln;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Gn;
							break;
						case "toggle":
						case "beforetoggle": l = Yn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = pn(m, p), g != null && d.push(fd(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== on && (u = n.relatedTarget || n.fromElement) && (mt(u) || u[st])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? mt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Nn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Gn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : gt(l), h = u == null ? c : gt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, mt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = l, p = u, m = 0, h = d; h; h = md(h)) m++;
							for (h = 0, g = p; g; g = md(g)) h++;
							for (; 0 < m - h;) d = md(d), m--;
							for (; 0 < h - m;) p = md(p), h--;
							for (; m--;) {
								if (d === p || p !== null && d === p.alternate) break b;
								d = md(d), p = md(p);
							}
							d = null;
						}
						else d = null;
						l !== null && hd(s, c, l, d, !1), u !== null && f !== null && hd(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? gt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = hr;
					else if (lr(c)) {
						if (gr) _ = Tr;
						else {
							_ = Cr;
							var v = Sr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && tn(r.elementType) && (_ = hr) : _ = wr;
					if (_ &&= _(e, r)) {
						ur(s, _, n, i);
						break a;
					}
					v && v(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && qt(c, "number", c.value);
				}
				switch (v = r ? gt(r) : window, e) {
					case "focusin":
						(lr(v) || v.contentEditable === "true") && (Fr = v, Ir = r, Lr = null);
						break;
					case "focusout":
						Lr = Ir = Fr = null;
						break;
					case "mousedown":
						Rr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Rr = !1, zr(s, n, i);
						break;
					case "selectionchange": if (Pr) break;
					case "keydown":
					case "keyup": zr(s, n, i);
				}
				var y;
				if (Zn) b: {
					switch (e) {
						case "compositionstart":
							var b = "onCompositionStart";
							break b;
						case "compositionend":
							b = "onCompositionEnd";
							break b;
						case "compositionupdate":
							b = "onCompositionUpdate";
							break b;
					}
					b = void 0;
				}
				else ar ? rr(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (er && n.locale !== "ko" && (ar || b !== "onCompositionStart" ? b === "onCompositionEnd" && ar && (y = bn()) : (_n = i, vn = "value" in _n ? _n.value : _n.textContent, ar = !0)), v = pd(r, b), 0 < v.length && (b = new Rn(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = ir(n), y !== null && (b.data = y)))), (y = $n ? or(e, n) : sr(e, n)) && (b = pd(r, "onBeforeInput"), 0 < b.length && (v = new Rn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: v,
					listeners: b
				}), v.data = y)), td(s, e, r, n, i);
			}
			od(s, t);
		});
	}
	function fd(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function pd(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = pn(e, n), i != null && r.unshift(fd(e, i, a)), i = pn(e, t), i != null && r.push(fd(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function md(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function hd(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = pn(n, a), l != null && o.unshift(fd(n, l, c))) : i || (l = pn(n, a), l != null && o.push(fd(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var gd = /\r\n?/g, _d = /\u0000|\uFFFD/g;
	function vd(e) {
		return (typeof e == "string" ? e : "" + e).replace(gd, "\n").replace(_d, "");
	}
	function yd(e, t) {
		return t = vd(t), vd(e) === t;
	}
	function bd() {}
	function $(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Zt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Zt(e, "" + r);
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
				en(e, r, o);
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
				r = an("" + r), e.setAttribute(n, r);
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
				r = an("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = bd);
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
				n = an("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = nn.get(n) || n, Dt(e, n, r));
		}
	}
	function xd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				en(e, r, o);
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
				typeof r == "string" ? Zt(e, r) : (typeof r == "number" || typeof r == "bigint") && Zt(e, "" + r);
				break;
			case "onScroll":
				r != null && Q("scroll", e);
				break;
			case "onScrollEnd":
				r != null && Q("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = bd);
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
	function Sd(e, t, n) {
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
				Kt(e, o, c, l, u, s, a, !1), Bt(e);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Jt(e, !!r, n, !0) : Jt(e, !!r, t, !1);
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
				Xt(e, r, a, o), Bt(e);
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
				for (r = 0; r < id.length; r++) Q(id[r], e);
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
			default: if (tn(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && xd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null));
	}
	function Cd(e, t, n, r) {
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
				Gt(e, s, c, l, u, d, o, a);
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
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Jt(e, !!n, n ? [] : "", !1) : Jt(e, !!n, t, !0)) : Jt(e, !!n, p, !1);
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
				Yt(e, p, m);
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
			default: if (tn(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && xd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || xd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m);
	}
	var wd = null, Td = null;
	function Ed(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Dd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Od(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function kd(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Ad = null;
	function jd() {
		var e = window.event;
		return e && e.type === "popstate" ? e !== Ad && (Ad = e, !0) : (Ad = null, !1);
	}
	var Md = typeof setTimeout == "function" ? setTimeout : void 0, Nd = typeof clearTimeout == "function" ? clearTimeout : void 0, Pd = typeof Promise == "function" ? Promise : void 0, Fd = typeof queueMicrotask == "function" ? queueMicrotask : Pd === void 0 ? Md : function(e) {
		return Pd.resolve(null).then(e).catch(Id);
	};
	function Id(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Ld(e) {
		return e === "head";
	}
	function Rd(e, t) {
		var n = t, r = 0, i = 0;
		do {
			var a = n.nextSibling;
			if (e.removeChild(n), a && a.nodeType === 8) {
				if (n = a.data, n === "/$") {
					if (0 < r && 8 > r) {
						n = r;
						var o = e.ownerDocument;
						if (n & 1 && Jd(o.documentElement), n & 2 && Jd(o.body), n & 4) for (n = o.head, Jd(n), o = n.firstChild; o;) {
							var s = o.nextSibling, c = o.nodeName;
							o[ft] || c === "SCRIPT" || c === "STYLE" || c === "LINK" && o.rel.toLowerCase() === "stylesheet" || n.removeChild(o), o = s;
						}
					}
					if (i === 0) {
						e.removeChild(a), hp(t);
						return;
					}
					i--;
				} else n === "$" || n === "$?" || n === "$!" ? i++ : r = n.charCodeAt(0) - 48;
			} else r = 0;
			n = a;
		} while (n);
		hp(t);
	}
	function zd(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					zd(n), pt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function Bd(e, t, n, r) {
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
			if (e = Wd(e.nextSibling), e === null) break;
		}
		return null;
	}
	function Vd(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = Wd(e.nextSibling), e === null)) return null;
		return e;
	}
	function Hd(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState === "complete";
	}
	function Ud(e, t) {
		var n = e.ownerDocument;
		if (e.data !== "$?" || n.readyState === "complete") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function Wd(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "F!" || t === "F") break;
				if (t === "/$") return null;
			}
		}
		return e;
	}
	var Gd = null;
	function Kd(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?") {
					if (t === 0) return e;
					t--;
				} else n === "/$" && t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function qd(e, t, n) {
		switch (t = Ed(n), e) {
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
	function Jd(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		pt(e);
	}
	var Yd = /* @__PURE__ */ new Map(), Xd = /* @__PURE__ */ new Set();
	function Zd(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var Qd = E.d;
	E.d = {
		f: $d,
		r: ef,
		D: rf,
		C: af,
		L: of,
		m: sf,
		X: lf,
		S: cf,
		M: uf
	};
	function $d() {
		var e = Qd.f(), t = cu();
		return e || t;
	}
	function ef(e) {
		var t = ht(e);
		t !== null && t.tag === 5 && t.type === "form" ? ss(t) : Qd.r(e);
	}
	var tf = typeof document > "u" ? null : document;
	function nf(e, t, n) {
		var r = tf;
		if (r && typeof t == "string" && t) {
			var i = Wt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), Xd.has(i) || (Xd.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Sd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function rf(e) {
		Qd.D(e), nf("dns-prefetch", e, null);
	}
	function af(e, t) {
		Qd.C(e, t), nf("preconnect", e, t);
	}
	function of(e, t, n) {
		Qd.L(e, t, n);
		var r = tf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Wt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Wt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Wt(n.imageSizes) + "\"]")) : i += "[href=\"" + Wt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = ff(e);
					break;
				case "script": a = gf(e);
			}
			Yd.has(a) || (e = p({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), Yd.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(pf(a)) || t === "script" && r.querySelector(_f(a)) || (t = r.createElement("link"), Sd(t, "link", e), vt(t), r.head.appendChild(t)));
		}
	}
	function sf(e, t) {
		Qd.m(e, t);
		var n = tf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Wt(r) + "\"][href=\"" + Wt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = gf(e);
			}
			if (!Yd.has(a) && (e = p({
				rel: "modulepreload",
				href: e
			}, t), Yd.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(_f(a))) return;
				}
				r = n.createElement("link"), Sd(r, "link", e), vt(r), n.head.appendChild(r);
			}
		}
	}
	function cf(e, t, n) {
		Qd.S(e, t, n);
		var r = tf;
		if (r && e) {
			var i = _t(r).hoistableStyles, a = ff(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(pf(a))) s.loading = 5;
				else {
					e = p({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = Yd.get(a)) && bf(e, n);
					var c = o = r.createElement("link");
					vt(c), Sd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, yf(o, t, r);
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
	function lf(e, t) {
		Qd.X(e, t);
		var n = tf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = gf(e), a = r.get(i);
			a || (a = n.querySelector(_f(i)), a || (e = p({
				src: e,
				async: !0
			}, t), (t = Yd.get(i)) && xf(e, t), a = n.createElement("script"), vt(a), Sd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function uf(e, t) {
		Qd.M(e, t);
		var n = tf;
		if (n && e) {
			var r = _t(n).hoistableScripts, i = gf(e), a = r.get(i);
			a || (a = n.querySelector(_f(i)), a || (e = p({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = Yd.get(i)) && xf(e, t), a = n.createElement("script"), vt(a), Sd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function df(e, t, n, r) {
		var a = (a = he.current) ? Zd(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = ff(n.href), n = _t(a).hoistableStyles, r = n.get(t), r || (r = {
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
					e = ff(n.href);
					var o = _t(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(pf(e))) && !o._p && (s.instance = o, s.state.loading = 5), Yd.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, Yd.set(e, n), o || hf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = gf(n), n = _t(a).hoistableScripts, r = n.get(t), r || (r = {
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
	function ff(e) {
		return "href=\"" + Wt(e) + "\"";
	}
	function pf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function mf(e) {
		return p({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function hf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Sd(t, "link", n), vt(t), e.head.appendChild(t));
	}
	function gf(e) {
		return "[src=\"" + Wt(e) + "\"]";
	}
	function _f(e) {
		return "script[async]" + e;
	}
	function vf(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Wt(n.href) + "\"]");
				if (r) return t.instance = r, vt(r), r;
				var a = p({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), vt(r), Sd(r, "style", a), yf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = ff(n.href);
				var o = e.querySelector(pf(a));
				if (o) return t.state.loading |= 4, t.instance = o, vt(o), o;
				r = mf(n), (a = Yd.get(a)) && bf(r, a), o = (e.ownerDocument || e).createElement("link"), vt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Sd(o, "link", r), t.state.loading |= 4, yf(o, n.precedence, e), t.instance = o;
			case "script": return o = gf(n.src), (a = e.querySelector(_f(o))) ? (t.instance = a, vt(a), a) : (r = n, (a = Yd.get(o)) && (r = p({}, n), xf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), vt(a), Sd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, yf(r, n.precedence, e));
		return t.instance;
	}
	function yf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function bf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function xf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Sf = null;
	function Cf(e, t, n) {
		if (Sf === null) {
			var r = /* @__PURE__ */ new Map(), i = Sf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Sf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
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
	function wf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Tf(e, t, n) {
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
	function Ef(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	var Df = null;
	function Of() {}
	function kf(e, t, n) {
		if (Df === null) throw Error(i(475));
		var r = Df;
		if (t.type === "stylesheet" && (typeof n.media != "string" || !1 !== matchMedia(n.media).matches) && !(t.state.loading & 4)) {
			if (t.instance === null) {
				var a = ff(n.href), o = e.querySelector(pf(a));
				if (o) {
					e = o._p, typeof e == "object" && e && typeof e.then == "function" && (r.count++, r = jf.bind(r), e.then(r, r)), t.state.loading |= 4, t.instance = o, vt(o);
					return;
				}
				o = e.ownerDocument || e, n = mf(n), (a = Yd.get(a)) && bf(n, a), o = o.createElement("link"), vt(o);
				var s = o;
				s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Sd(o, "link", n), t.instance = o;
			}
			r.stylesheets === null && (r.stylesheets = /* @__PURE__ */ new Map()), r.stylesheets.set(t, e), (e = t.state.preload) && !(t.state.loading & 3) && (r.count++, t = jf.bind(r), e.addEventListener("load", t), e.addEventListener("error", t));
		}
	}
	function Af() {
		if (Df === null) throw Error(i(475));
		var e = Df;
		return e.stylesheets && e.count === 0 && Nf(e, e.stylesheets), 0 < e.count ? function(t) {
			var n = setTimeout(function() {
				if (e.stylesheets && Nf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4);
			return e.unsuspend = t, function() {
				e.unsuspend = null, clearTimeout(n);
			};
		} : null;
	}
	function jf() {
		if (this.count--, this.count === 0) {
			if (this.stylesheets) Nf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Mf = null;
	function Nf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Mf = /* @__PURE__ */ new Map(), t.forEach(Pf, e), Mf = null, jf.call(e));
	}
	function Pf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Mf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Mf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Ff = {
		$$typeof: S,
		Provider: null,
		Consumer: null,
		_currentValue: de,
		_currentValue2: de,
		_threadCount: 0
	};
	function If(e, t, n, r, i, a, o, s) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ye(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ye(0), this.hiddenUpdates = Ye(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = s, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function Lf(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new If(e, t, n, o, s, c, l, d), t = 1, !0 === a && (t |= 24), a = mi(3, null, null, t), e.current = a, a.stateNode = e, t = ca(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Na(a), e;
	}
	function Rf(e) {
		return e ? (e = fi, e) : fi;
	}
	function zf(e, t, n, r, i, a) {
		i = Rf(i), r.context === null ? r.context = i : r.pendingContext = i, r = Fa(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ia(e, r, t), n !== null && (ru(n, e, t), La(n, e, t));
	}
	function Bf(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function Vf(e, t) {
		Bf(e, t), (e = e.alternate) && Bf(e, t);
	}
	function Hf(e) {
		if (e.tag === 13) {
			var t = li(e, 67108864);
			t !== null && ru(t, e, 67108864), Vf(e, 67108864);
		}
	}
	var Uf = !0;
	function Wf(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 2, Kf(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function Gf(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 8, Kf(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function Kf(e, t, n, r) {
		if (Uf) {
			var i = qf(r);
			if (i === null) dd(e, t, r, Jf, n), ap(e, r);
			else if (sp(i, e, t, n, r)) r.stopPropagation();
			else if (ap(e, r), t & 4 && -1 < ip.indexOf(e)) {
				for (; i !== null;) {
					var a = ht(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ue(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Le(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Wu(a), !(G & 6) && (Ul = Ee() + 500, Gu(0, !1));
								}
							}
							break;
						case 13: s = li(a, 2), s !== null && ru(s, a, 2), cu(), Vf(a, 2);
					}
					if (a = qf(r), a === null && dd(e, t, r, Jf, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else dd(e, t, r, null, n);
		}
	}
	function qf(e) {
		return e = sn(e), Yf(e);
	}
	var Jf = null;
	function Yf(e) {
		if (Jf = null, e = mt(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return Jf = e, null;
	}
	function Xf(e) {
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
			case "message": switch (j()) {
				case De: return 2;
				case Oe: return 8;
				case ke:
				case Ae: return 32;
				case je: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var Zf = !1, Qf = null, $f = null, ep = null, tp = /* @__PURE__ */ new Map(), np = /* @__PURE__ */ new Map(), rp = [], ip = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function ap(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				Qf = null;
				break;
			case "dragenter":
			case "dragleave":
				$f = null;
				break;
			case "mouseover":
			case "mouseout":
				ep = null;
				break;
			case "pointerover":
			case "pointerout":
				tp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": np.delete(t.pointerId);
		}
	}
	function op(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = ht(t), t !== null && Hf(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function sp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return Qf = op(Qf, e, t, n, r, i), !0;
			case "dragenter": return $f = op($f, e, t, n, r, i), !0;
			case "mouseover": return ep = op(ep, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return tp.set(a, op(tp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, np.set(a, op(np.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function cp(e) {
		var t = mt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, rt(e.priority, function() {
							if (n.tag === 13) {
								var e = tu();
								e = et(e);
								var t = li(n, e);
								t !== null && ru(t, n, e), Vf(n, e);
							}
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
	function lp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = qf(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				on = r, n.target.dispatchEvent(r), on = null;
			} else return t = ht(n), t !== null && Hf(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function up(e, t, n) {
		lp(e) && n.delete(t);
	}
	function dp() {
		Zf = !1, Qf !== null && lp(Qf) && (Qf = null), $f !== null && lp($f) && ($f = null), ep !== null && lp(ep) && (ep = null), tp.forEach(up), np.forEach(up);
	}
	function fp(e, n) {
		e.blockedOn === n && (e.blockedOn = null, Zf || (Zf = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, dp)));
	}
	var pp = null;
	function mp(e) {
		pp !== e && (pp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			pp === e && (pp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (Yf(r || n) === null) continue;
					break;
				}
				var a = ht(n);
				a !== null && (e.splice(t, 3), t -= 3, as(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function hp(e) {
		function t(t) {
			return fp(t, e);
		}
		Qf !== null && fp(Qf, e), $f !== null && fp($f, e), ep !== null && fp(ep, e), tp.forEach(t), np.forEach(t);
		for (var n = 0; n < rp.length; n++) {
			var r = rp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < rp.length && (n = rp[0], n.blockedOn === null);) cp(n), n.blockedOn === null && rp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[ot] || null;
			if (typeof a == "function") o || mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[ot] || null) s = o.formAction;
					else if (Yf(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), mp(n);
			}
		}
	}
	function gp(e) {
		this._internalRoot = e;
	}
	_p.prototype.render = gp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		zf(n, tu(), e, t, null, null);
	}, _p.prototype.unmount = gp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			zf(e.current, 2, null, e, null, null), cu(), t[st] = null;
		}
	};
	function _p(e) {
		this._internalRoot = e;
	}
	_p.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = nt();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < rp.length && t !== 0 && t < rp[n].priority; n++);
			rp.splice(n, 0, e), n === 0 && cp(e);
		}
	};
	var vp = n.version;
	if (vp !== "19.1.1") throw Error(i(527, vp, "19.1.1"));
	E.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = l(t), e = e === null ? null : d(e), e = e === null ? null : e.stateNode, e;
	};
	var yp = {
		bundleType: 0,
		version: "19.1.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: T,
		reconcilerVersion: "19.1.1"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var bp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!bp.isDisabled && bp.supportsFiber) try {
			Pe = bp.inject(yp), Fe = bp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Gs, s = Ks, c = qs, l = null;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError), t.unstable_transitionCallbacks !== void 0 && (l = t.unstable_transitionCallbacks)), t = Lf(e, 1, !1, null, null, n, r, o, s, c, l, null), e[st] = t.current, ld(e), new gp(t);
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
})))(), ee = "", x = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), S = (e = 0) => new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD"
}).format(e / 100), te = (e) => e ? (/* @__PURE__ */ new Date(`${e}T00:00:00`)).toLocaleDateString() : "—", C = (e = "") => String(e).replaceAll("_", " ");
async function w(e, { method: t = "GET", body: n, idempotent: r = !0 } = {}) {
	let i = { Accept: "application/json" };
	n !== void 0 && (i["Content-Type"] = "application/json"), t !== "GET" && ee && (i["X-CSRF-Token"] = ee), t !== "GET" && r && (i["Idempotency-Key"] = crypto.randomUUID());
	let a = await fetch(e, {
		method: t,
		headers: i,
		credentials: "same-origin",
		...n === void 0 ? {} : { body: JSON.stringify(n) }
	}), o = await a.json().catch(() => ({}));
	if (!a.ok) {
		let e = Error(o.error || "The request could not be completed.");
		throw e.status = a.status, e.requestId = o.request_id, e;
	}
	return o.csrf_token && (ee = o.csrf_token), o;
}
function ne(e, t = []) {
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
var re = [
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
		"Reports",
		"⌁"
	],
	[
		"administration",
		"Administration",
		"⚙"
	]
];
function ie() {
	let [e, t] = (0, _.useState)(null), [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)(!0);
	return (0, _.useEffect)(() => {
		w("/api/auth/me").then(t).catch(async (e) => {
			if (e.status !== 401) throw e;
			r((await w("/setup/status")).needs_setup);
		}).finally(() => a(!1));
	}, []), i ? /* @__PURE__ */ (0, b.jsx)(xe, {
		title: "Opening Folio",
		detail: "Checking your secure session…"
	}) : e ? /* @__PURE__ */ (0, b.jsx)(oe, {
		auth: e,
		setAuth: t
	}) : /* @__PURE__ */ (0, b.jsx)(ae, {
		needsSetup: n,
		onAuthenticated: (e) => t(e)
	});
}
function ae({ needsSetup: e, onAuthenticated: t }) {
	let [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)("");
	async function o(n) {
		n.preventDefault();
		let i = new FormData(n.currentTarget);
		r(!0), a("");
		try {
			t(await w(e ? "/api/auth/register" : "/api/auth/login", {
				method: "POST",
				idempotent: !1,
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
				/* @__PURE__ */ (0, b.jsx)(O, {}),
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
						e && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Organization",
							name: "organization_name",
							autoComplete: "organization"
						}), /* @__PURE__ */ (0, b.jsx)(j, {
							label: "Your name",
							name: "name",
							autoComplete: "name"
						})] }),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Email",
							name: "email",
							type: "email",
							autoComplete: "email"
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
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
function oe({ auth: e, setAuth: t }) {
	let [n, r] = (0, _.useState)("overview"), [i, a] = (0, _.useState)(null), o = re.find(([e]) => e === n), s = (t) => e.permissions.includes(t);
	async function c() {
		await w("/api/auth/logout", {
			method: "POST",
			idempotent: !1
		}), ee = "", t(null);
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "app-shell",
		children: [/* @__PURE__ */ (0, b.jsxs)("aside", {
			className: "sidebar",
			children: [
				/* @__PURE__ */ (0, b.jsx)(O, {}),
				/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "workspace-card",
					children: [/* @__PURE__ */ (0, b.jsx)("span", {
						className: "workspace-avatar",
						children: e.organization.name.slice(0, 1).toUpperCase()
					}), /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.organization.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: "USD · Accrual" })] })]
				}),
				/* @__PURE__ */ (0, b.jsx)("nav", {
					"aria-label": "Accounting modules",
					children: re.map(([e, t, i]) => /* @__PURE__ */ (0, b.jsxs)("button", {
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
						/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.user.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: C(e.role) })] }),
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
						children: C(e.role)
					})]
				}),
				i && /* @__PURE__ */ (0, b.jsx)(we, {
					notice: i,
					onClose: () => a(null)
				}),
				/* @__PURE__ */ (0, b.jsx)(se, {
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
function se({ active: e, ...t }) {
	let n = {
		overview: le,
		journals: ue,
		revenue: T,
		receivables: E,
		"bank-close": de,
		integrations: ce,
		investments: fe,
		"fixed-assets": pe,
		reports: me,
		administration: D
	}[e];
	return /* @__PURE__ */ (0, b.jsx)(n, { ...t });
}
function ce({ can: e, notify: t }) {
	let n = ne(() => w("/api/integrations/overview"), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let a = n.data;
	async function o(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await w("/api/integrations/connections", {
				method: "POST",
				body: {
					provider: r.get("provider"),
					display_name: r.get("display_name"),
					environment: r.get("environment"),
					external_account_id: r.get("external_account_id") || null,
					credential_secret_ref: r.get("credential_secret_ref"),
					webhook_secret_ref: r.get("webhook_secret_ref") || null,
					scopes: [],
					settings: {}
				}
			}), i(!1), await n.refresh(), t({
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
	async function s(e, r) {
		try {
			await w("/api/integrations/connections/status", {
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
	async function c(e) {
		try {
			await w("/api/integrations/exceptions/status", {
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
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Connected systems",
				detail: "Observable, tenant-scoped data connections without browser-visible secrets",
				action: e("admin") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => i(!0),
					children: "Configure connector"
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Connections",
						value: a.connections.length,
						detail: "Configured providers"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Active",
						value: a.metrics.active_connections,
						detail: "Eligible to synchronize"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Provider errors",
						value: a.metrics.error_connections,
						detail: "Connections needing attention",
						warning: a.metrics.error_connections > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Exceptions",
						value: a.metrics.open_exceptions,
						detail: "Open connector failures",
						warning: a.metrics.open_exceptions > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsx)(A, {
					title: "Connections",
					subtitle: "Status, environment and latest successful synchronization",
					children: /* @__PURE__ */ (0, b.jsx)(ge, {
						columns: [
							"Provider",
							"Connection",
							"Environment",
							"Last sync",
							"Status",
							"Action"
						],
						rows: a.connections.map((t) => [
							C(t.provider),
							t.display_name,
							C(t.environment),
							t.last_synced_at ? new Date(t.last_synced_at).toLocaleString() : "Never",
							/* @__PURE__ */ (0, b.jsx)(_e, { value: t.status }),
							e("admin") ? t.status === "configured" || t.status === "paused" || t.status === "error" ? /* @__PURE__ */ (0, b.jsx)("button", {
								className: "small-button",
								onClick: () => s(t, "active"),
								children: "Activate"
							}) : t.status === "active" ? /* @__PURE__ */ (0, b.jsx)("button", {
								className: "small-button",
								onClick: () => s(t, "paused"),
								children: "Pause"
							}) : "—" : "—"
						])
					})
				}), /* @__PURE__ */ (0, b.jsx)(A, {
					title: "Initial connector catalog",
					subtitle: "Approved production-integration targets",
					children: /* @__PURE__ */ (0, b.jsx)("div", {
						className: "attention-list",
						children: a.catalog.map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "attention",
							children: [
								/* @__PURE__ */ (0, b.jsx)("span", {
									className: "workspace-avatar small",
									children: e.name.slice(0, 1)
								}),
								/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									C(e.domain),
									" · ",
									e.capabilities.length,
									" capabilities"
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(_e, { value: "available" })
							]
						}, e.provider))
					})
				})]
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Synchronization history",
				subtitle: "Cursors, pages and idempotent source-record outcomes",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
					columns: [
						"Started",
						"Provider connection",
						"Trigger",
						"Added",
						"Modified",
						"Removed",
						"Status"
					],
					rows: a.runs.map((e) => [
						(/* @__PURE__ */ new Date(`${e.started_at}Z`)).toLocaleString(),
						a.connections.find((t) => t.id === e.connection_id)?.display_name,
						C(e.trigger),
						e.added,
						e.modified,
						e.removed,
						/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Integration exception queue",
				subtitle: "Provider failures remain visible until an authorized operator records a disposition",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
					columns: [
						"Created",
						"Connection",
						"Code",
						"Message",
						"Status",
						"Action"
					],
					rows: a.dead_letters.map((t) => [
						(/* @__PURE__ */ new Date(`${t.created_at}Z`)).toLocaleString(),
						a.connections.find((e) => e.id === t.connection_id)?.display_name,
						t.error_code,
						t.error_message,
						/* @__PURE__ */ (0, b.jsx)(_e, { value: t.status }),
						t.status === "open" && e("operate") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => c(t),
							children: "Resolve"
						}) : "—"
					])
				})
			}),
			r && /* @__PURE__ */ (0, b.jsx)(Te, {
				title: "Configure connector",
				subtitle: "Enter secret-manager reference names only. Tokens and client secrets never belong in this form.",
				close: () => i(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: o,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Provider",
								name: "provider",
								as: "select",
								options: a.catalog.map((e) => [e.provider, e.name])
							}), /* @__PURE__ */ (0, b.jsx)(j, {
								label: "Environment",
								name: "environment",
								as: "select",
								options: [["sandbox", "Sandbox"], ["production", "Production"]]
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Connection name",
							name: "display_name"
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "External account ID",
							name: "external_account_id",
							required: !1,
							hint: "Required for production; use the provider's tenant, account or company identifier."
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Credential secret reference",
								name: "credential_secret_ref",
								placeholder: "STRIPE_OAUTH_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							}), /* @__PURE__ */ (0, b.jsx)(j, {
								label: "Webhook secret reference",
								name: "webhook_secret_ref",
								required: !1,
								placeholder: "STRIPE_WEBHOOK_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(Ee, {
							close: () => i(!1),
							label: "Save configuration"
						})
					]
				})
			})
		]
	});
}
function le() {
	let e = ne(() => Promise.all([w("/api/dashboard"), w("/api/reconciliation-exceptions")]), []);
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
				/* @__PURE__ */ (0, b.jsx)(k, {
					label: "Cash",
					value: S(t.cash_cents),
					detail: "Posted cash balance"
				}),
				/* @__PURE__ */ (0, b.jsx)(k, {
					label: "Revenue",
					value: S(t.revenue_cents),
					detail: "Posted revenue"
				}),
				/* @__PURE__ */ (0, b.jsx)(k, {
					label: "Net income",
					value: S(t.net_income_cents),
					detail: "Current ledger"
				}),
				/* @__PURE__ */ (0, b.jsx)(k, {
					label: "Drafts",
					value: t.drafts,
					detail: "Awaiting approval",
					warning: t.drafts > 0
				})
			]
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Monthly performance",
				subtitle: "Revenue and expense activity by posting month",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
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
			}), /* @__PURE__ */ (0, b.jsx)(A, {
				title: "Close attention",
				subtitle: "Open reconciliation items that need an owner",
				children: r.length ? /* @__PURE__ */ (0, b.jsx)("div", {
					className: "attention-list",
					children: r.slice(0, 6).map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "attention",
						children: [
							/* @__PURE__ */ (0, b.jsx)("span", { className: "status-dot warning" }),
							/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: C(e.kind) }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
								e.reference,
								" · ",
								S(e.amount_cents)
							] })] }),
							/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
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
function ue({ can: e, notify: t }) {
	let n = ne(() => Promise.all([w("/api/journals"), w("/api/accounts")]), []), [r, i] = (0, _.useState)(!1);
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
			await w("/api/journals", {
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
			await w(`/api/journals/${e}/post`, { method: "POST" }), await n.refresh(), t({
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
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Journal register",
				detail: `${a.length} entries with controlled approval and posting`,
				action: e("draft") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => i(!0),
					children: "New journal"
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(A, { children: /* @__PURE__ */ (0, b.jsx)(ge, {
				columns: [
					"Date",
					"Memo",
					"Source",
					"Amount",
					"Status",
					"Action"
				],
				rows: a.map((t) => [
					te(t.entry_date),
					t.memo,
					C(t.source),
					S(t.total_cents),
					/* @__PURE__ */ (0, b.jsx)(_e, { value: t.status }),
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
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Entry date",
									name: "date",
									type: "date",
									defaultValue: x
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Debit account",
									name: "debit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Credit account",
									name: "credit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Memo",
							name: "memo",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Line description",
							name: "description",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(Ee, {
							close: () => i(!1),
							label: "Save draft"
						})
					]
				})
			})
		]
	});
}
function T({ can: e, notify: t }) {
	let n = ne(() => w("/api/saas/overview"), []);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let r = n.data;
	async function i() {
		try {
			let e = await w("/api/revenue/recognize", {
				method: "POST",
				body: { as_of: x }
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
			/* @__PURE__ */ (0, b.jsx)(he, {
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
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Contracts",
						value: r.contracts.length,
						detail: "Customer arrangements"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Schedules",
						value: r.schedules.length,
						detail: "Recognition periods"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Invoices",
						value: r.invoices.length,
						detail: "Billing records"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "RPO",
						value: S(r.rpo_cents || 0),
						detail: "Remaining obligations"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Contracts",
				subtitle: "Signed arrangements and allocated transaction price",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
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
						te(e.start_date),
						te(e.end_date),
						S(e.transaction_price_cents)
					])
				})
			})
		]
	});
}
function E({ can: e, notify: t }) {
	let n = ne(() => Promise.all([w("/api/receivables"), w("/api/saas/overview")]), []), [r, i] = (0, _.useState)(null);
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
			await w(s, {
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
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Receivables operations",
				detail: `Aging as of ${te(a.as_of)}`,
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
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Open AR",
						value: S(a.aging.total_cents),
						detail: `${s.length} open invoices`
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Overdue",
						value: S(a.aging.overdue_cents),
						detail: "Past due balance",
						warning: a.aging.overdue_cents > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Disputed",
						value: S(a.aging.disputed_cents),
						detail: "Active disputes"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "GL difference",
						value: S(a.reconciliation.ar_difference_cents),
						detail: a.reconciliation.balanced ? "Subledger agrees" : "Requires resolution",
						warning: !a.reconciliation.balanced
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Invoice aging",
				subtitle: "Outstanding customer invoices and application status",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
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
						te(e.due_date),
						S(e.amount_cents),
						S(e.balance_cents),
						/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
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
					children: [r === "invoice" ? /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Contract",
						name: "contract_id",
						as: "select",
						options: o.contracts.map((e) => [e.id, `${e.contract_number} · ${e.customer_name}`])
					}), /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "form-grid",
						children: [
							/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Invoice number",
								name: "number",
								defaultValue: `INV-${Date.now().toString().slice(-6)}`
							}),
							/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Amount",
								name: "amount",
								type: "number",
								min: "0.01",
								step: "0.01"
							}),
							/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Invoice date",
								name: "date",
								type: "date",
								defaultValue: x
							}),
							/* @__PURE__ */ (0, b.jsx)(j, {
								label: "Due date",
								name: "due_date",
								type: "date",
								defaultValue: x
							})
						]
					})] }) : /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Customer",
							name: "customer_id",
							as: "select",
							options: o.customers.map((e) => [e.id, e.name])
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Apply to invoice (optional)",
							name: "invoice_id",
							as: "select",
							required: !1,
							options: [["", "Leave unapplied"], ...s.map((e) => [e.id, `${e.invoice_number} · ${S(e.balance_cents)}`])]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Payment number",
									name: "number",
									defaultValue: `PAY-${Date.now().toString().slice(-6)}`
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Received date",
									name: "date",
									type: "date",
									defaultValue: x
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
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
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Bank reference",
							name: "reference",
							required: !1
						})
					] }), /* @__PURE__ */ (0, b.jsx)(Ee, {
						close: () => i(null),
						label: "Post and save"
					})]
				})
			})
		]
	});
}
function de({ can: e, notify: t }) {
	let n = ne(() => Promise.all([
		w("/api/bank-statements"),
		w("/api/reconciliation-exceptions"),
		w("/api/accounts")
	]), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: n.error,
		retry: n.refresh
	});
	let [a, o, s] = n.data;
	async function c(e, r) {
		try {
			await w(`/api/reconciliation-exceptions/${e.id}`, {
				method: "POST",
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
	async function l(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await w("/api/bank-statements/import", {
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
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Bank reconciliation & close",
				detail: "Cash matching, assigned exceptions and evidence",
				action: e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => i(!0),
					children: "Import statement"
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsx)(A, {
					title: "Bank statements",
					subtitle: "Imported statements and match status",
					children: /* @__PURE__ */ (0, b.jsx)(ge, {
						columns: [
							"Period",
							"Closing",
							"Transactions",
							"Unmatched",
							"Status"
						],
						rows: a.map((e) => [
							`${te(e.start_date)} – ${te(e.end_date)}`,
							S(e.closing_cents),
							e.transaction_count,
							e.unmatched_count,
							/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
						])
					})
				}), /* @__PURE__ */ (0, b.jsx)(A, {
					title: "Exception queue",
					subtitle: "Resolve material differences before close",
					children: o.length ? /* @__PURE__ */ (0, b.jsx)("div", {
						className: "attention-list",
						children: o.map((t) => /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "attention exception",
							children: [
								/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: C(t.kind) }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									t.reference,
									" · ",
									S(t.amount_cents)
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(_e, { value: t.status }),
								e("operate") && t.status === "open" && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => c(t, "acknowledged"),
									children: "Acknowledge"
								}),
								e("close") && t.status !== "resolved" && /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => c(t, "resolved"),
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
					onSubmit: l,
					children: [
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Cash account",
							name: "cash_account_id",
							as: "select",
							options: s.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Start date",
									name: "start_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "End date",
									name: "end_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Opening balance",
									name: "opening",
									type: "number",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(j, {
									label: "Closing balance",
									name: "closing",
									type: "number",
									step: "0.01"
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(j, {
							label: "Statement CSV",
							name: "csv",
							as: "textarea",
							hint: "Required columns: date, description and amount. Include external_id when available. Never paste bank credentials."
						}),
						/* @__PURE__ */ (0, b.jsx)(Ee, {
							close: () => i(!1),
							label: "Validate and import"
						})
					]
				})
			})
		]
	});
}
function fe() {
	let e = ne(() => w("/api/investments/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Investment subledger",
				detail: "Positions, measurement models and ledger reconciliation"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Instruments",
						value: t.instruments.length,
						detail: "Active and disposed"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Carrying value",
						value: S(t.totals?.carrying_value_cents || 0),
						detail: "Subledger basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Fair value",
						value: S(t.totals?.fair_value_cents || 0),
						detail: "Latest measurements"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "GL difference",
						value: S(t.reconciliation?.difference_cents || 0),
						detail: "Control reconciliation",
						warning: !!t.reconciliation?.difference_cents
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Positions",
				subtitle: "Accounting model, classification and current carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
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
						C(e.security_type),
						C(e.accounting_model),
						/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
					])
				})
			})
		]
	});
}
function pe() {
	let e = ne(() => w("/api/fixed-assets/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(be, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(Se, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(he, {
				title: "Fixed-asset register",
				detail: "PP&E, depreciation, CIP, impairment, disposals and ARO"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Assets",
						value: t.assets.length,
						detail: "Register records"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Gross PP&E",
						value: S(t.totals?.gross_carrying_cents || t.totals?.cost_cents || 0),
						detail: "Capitalized basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "Net book value",
						value: S(t.totals?.net_book_value_cents || 0),
						detail: "After depreciation"
					}),
					/* @__PURE__ */ (0, b.jsx)(k, {
						label: "CIP",
						value: S(t.totals?.cip_cents || 0),
						detail: "Construction in progress"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Asset register",
				subtitle: "Class, custody, lifecycle status and carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(ge, {
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
						te(e.placed_in_service_date),
						S(e.net_book_value_cents),
						/* @__PURE__ */ (0, b.jsx)(_e, { value: e.status })
					])
				})
			})
		]
	});
}
function me() {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [/* @__PURE__ */ (0, b.jsx)(he, {
			title: "Financial statements",
			detail: "Date-bounded, posted-ledger reports in reviewable and portable formats"
		}), /* @__PURE__ */ (0, b.jsx)("div", {
			className: "report-grid",
			children: [
				"trial_balance",
				"income_statement",
				"balance_sheet",
				"cash_flow",
				"comprehensive_income",
				"changes_in_equity"
			].map((e) => /* @__PURE__ */ (0, b.jsxs)("article", {
				className: "report-card",
				children: [
					/* @__PURE__ */ (0, b.jsx)("span", {
						"aria-hidden": "true",
						children: "⌁"
					}),
					/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: C(e) }), /* @__PURE__ */ (0, b.jsx)("p", { children: "Generated from posted journals with current report mappings." })] }),
					/* @__PURE__ */ (0, b.jsxs)("div", {
						className: "button-row",
						children: [/* @__PURE__ */ (0, b.jsx)("a", {
							className: "secondary",
							href: `/api/reports/${e}.pdf`,
							children: "PDF"
						}), /* @__PURE__ */ (0, b.jsx)("a", {
							className: "secondary",
							href: `/api/reports/${e}.csv`,
							children: "CSV"
						})]
					})
				]
			}, e))
		})]
	});
}
function D({ auth: e, setAuth: t, notify: n }) {
	async function r(e) {
		try {
			let r = await w("/api/auth/switch-org", {
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
		children: [/* @__PURE__ */ (0, b.jsx)(he, {
			title: "Workspace administration",
			detail: "Identity, organization access and controlled configuration"
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(A, {
				title: "Signed-in identity",
				children: /* @__PURE__ */ (0, b.jsx)(ve, { items: [
					["Name", e.user.name],
					["Email", e.user.email],
					["Role", C(e.role)],
					["Permissions", e.permissions.map(C).join(", ")]
				] })
			}), /* @__PURE__ */ (0, b.jsx)(A, {
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
							/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: t.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: C(t.role) })] }),
							t.org_id === e.organization.id ? /* @__PURE__ */ (0, b.jsx)(_e, { value: "current" }) : /* @__PURE__ */ (0, b.jsx)("button", {
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
function O() {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "brand",
		children: [/* @__PURE__ */ (0, b.jsx)("span", {
			className: "brand-mark",
			children: "F"
		}), /* @__PURE__ */ (0, b.jsx)("span", { children: "Folio" })]
	});
}
function k({ label: e, value: t, detail: n, warning: r }) {
	return /* @__PURE__ */ (0, b.jsxs)("article", {
		className: `kpi-card${r ? " warning" : ""}`,
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", { children: e }),
			/* @__PURE__ */ (0, b.jsx)("strong", { children: t }),
			/* @__PURE__ */ (0, b.jsx)("small", { children: n })
		]
	});
}
function A({ title: e, subtitle: t, children: n }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "panel",
		children: [e && /* @__PURE__ */ (0, b.jsx)("header", { children: /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), t && /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }) }), /* @__PURE__ */ (0, b.jsx)("div", {
			className: "panel-body",
			children: n
		})]
	});
}
function he({ title: e, detail: t, action: n }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "module-bar",
		children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }), n && /* @__PURE__ */ (0, b.jsx)("div", { children: n })]
	});
}
function ge({ columns: e, rows: t }) {
	return t.length ? /* @__PURE__ */ (0, b.jsx)("div", {
		className: "table-wrap",
		children: /* @__PURE__ */ (0, b.jsxs)("table", { children: [/* @__PURE__ */ (0, b.jsx)("thead", { children: /* @__PURE__ */ (0, b.jsx)("tr", { children: e.map((e) => /* @__PURE__ */ (0, b.jsx)("th", { children: e }, e)) }) }), /* @__PURE__ */ (0, b.jsx)("tbody", { children: t.map((e, t) => /* @__PURE__ */ (0, b.jsx)("tr", { children: e.map((e, t) => /* @__PURE__ */ (0, b.jsx)("td", { children: e ?? "—" }, t)) }, t)) })] })
	}) : /* @__PURE__ */ (0, b.jsx)(ye, {
		title: "Nothing here yet",
		detail: "New records will appear here."
	});
}
function _e({ value: e }) {
	let t = String(e || "unknown").toLowerCase();
	return /* @__PURE__ */ (0, b.jsx)("span", {
		className: `status status-${t.replaceAll(" ", "-")}`,
		children: C(e)
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
	let i = (0, _.useRef)(null);
	return (0, _.useEffect)(() => {
		i.current?.focus();
		let e = (e) => e.key === "Escape" && n();
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n]), /* @__PURE__ */ (0, b.jsx)("div", {
		className: "dialog-backdrop",
		onMouseDown: (e) => e.target === e.currentTarget && n(),
		children: /* @__PURE__ */ (0, b.jsxs)("section", {
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
function Ee({ close: e, label: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "dialog-actions",
		children: [/* @__PURE__ */ (0, b.jsx)("button", {
			type: "button",
			className: "secondary",
			onClick: e,
			children: "Cancel"
		}), /* @__PURE__ */ (0, b.jsx)("button", {
			className: "primary",
			children: t
		})]
	});
}
function j({ label: e, hint: t, as: n = "input", options: r = [], required: i = !0, ...a }) {
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
var De = document.querySelector("#root");
De && (0, v.createRoot)(De).render(/* @__PURE__ */ (0, b.jsx)(ie, {}));
//#endregion
