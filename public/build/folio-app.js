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
	function C(e, n, r, i, a, o) {
		return r = o.ref, {
			$$typeof: t,
			type: e,
			key: n,
			ref: r === void 0 ? null : r,
			props: o
		};
	}
	function w(e, t) {
		return C(e.type, t, void 0, void 0, void 0, e.props);
	}
	function te(e) {
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
	function T() {}
	function ae(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(T, T) : (e.status = "pending", e.then(function(t) {
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
	function oe(e, r, i, a, o) {
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
				case d: return c = e._init, oe(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ie(e, 0) : a, ee(o) ? (i = "", c != null && (i = c.replace(re, "$&/") + "/"), oe(o, r, i, "", function(e) {
			return e;
		})) : o != null && (te(o) && (o = w(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(re, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (ee(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ie(a, u), c += oe(a, r, i, s, o);
		else if (u = p(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ie(a, u++), c += oe(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return oe(ae(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function se(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return oe(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ce(e) {
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
	var le = typeof reportError == "function" ? reportError : function(e) {
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
	function E() {}
	e.Children = {
		map: se,
		forEach: function(e, t, n) {
			se(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return se(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return se(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!te(e)) throw Error("React.Children.only expected to receive a single React element child.");
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
		return C(e.type, i, void 0, void 0, a, r);
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
		return C(e, a, void 0, void 0, null, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = te, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ce
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
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(E, le);
		} catch (e) {
			le(e);
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
				t !== null && ae(ee, t.startTime - e);
			}
		}
	}
	var x = !1, S = -1, C = 5, w = -1;
	function te() {
		return g ? !0 : !(e.unstable_now() - w < C);
	}
	function ne() {
		if (g = !1, x) {
			var t = e.unstable_now();
			w = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(S), S = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && te());) {
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
								u !== null && ae(ee, u.startTime - t), i = !1;
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
		var ie = new MessageChannel(), T = ie.port2;
		ie.port1.onmessage = ne, re = function() {
			T.postMessage(null);
		};
	} else re = function() {
		_(ne, 0);
	};
	function ae(t, n) {
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(S), S = -1) : h = !0, ae(ee, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, x || (x = !0, re()))), r;
	}, e.unstable_shouldYield = te, e.unstable_wrapCallback = function(e) {
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
	var p = Object.assign, h = Symbol.for("react.element"), g = Symbol.for("react.transitional.element"), _ = Symbol.for("react.portal"), v = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), b = Symbol.for("react.profiler"), ee = Symbol.for("react.provider"), x = Symbol.for("react.consumer"), S = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), te = Symbol.for("react.suspense_list"), ne = Symbol.for("react.memo"), re = Symbol.for("react.lazy"), ie = Symbol.for("react.activity"), T = Symbol.for("react.memo_cache_sentinel"), ae = Symbol.iterator;
	function oe(e) {
		return typeof e != "object" || !e ? null : (e = ae && e[ae] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var se = Symbol.for("react.client.reference");
	function ce(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === se ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case v: return "Fragment";
			case b: return "Profiler";
			case y: return "StrictMode";
			case w: return "Suspense";
			case te: return "SuspenseList";
			case ie: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case _: return "Portal";
			case S: return (e.displayName || "Context") + ".Provider";
			case x: return (e._context.displayName || "Context") + ".Consumer";
			case C:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case ne: return t = e.displayName || null, t === null ? ce(e.type) || "Memo" : t;
			case re:
				t = e._payload, e = e._init;
				try {
					return ce(e(t));
				} catch {}
		}
		return null;
	}
	var le = Array.isArray, E = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, D = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ue = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, de = [], fe = -1;
	function pe(e) {
		return { current: e };
	}
	function O(e) {
		0 > fe || (e.current = de[fe], de[fe] = null, fe--);
	}
	function k(e, t) {
		fe++, de[fe] = e.current, e.current = t;
	}
	var me = pe(null), A = pe(null), he = pe(null), ge = pe(null);
	function _e(e, t) {
		switch (k(he, t), k(A, e), k(me, null), t.nodeType) {
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
		O(me), k(me, e);
	}
	function j() {
		O(me), O(A), O(he);
	}
	function M(e) {
		e.memoizedState !== null && k(ge, e);
		var t = me.current, n = Od(t, e.type);
		t !== n && (k(A, e), k(me, n));
	}
	function ve(e) {
		A.current === e && (O(me), O(A)), ge.current === e && (O(ge), Ff._currentValue = ue);
	}
	var ye = Object.prototype.hasOwnProperty, N = t.unstable_scheduleCallback, be = t.unstable_cancelCallback, xe = t.unstable_shouldYield, Se = t.unstable_requestPaint, Ce = t.unstable_now, we = t.unstable_getCurrentPriorityLevel, Te = t.unstable_ImmediatePriority, Ee = t.unstable_UserBlockingPriority, De = t.unstable_NormalPriority, Oe = t.unstable_LowPriority, P = t.unstable_IdlePriority, ke = t.log, Ae = t.unstable_setDisableYieldValue, je = null, Me = null;
	function Ne(e) {
		if (typeof ke == "function" && Ae(e), Me && typeof Me.setStrictMode == "function") try {
			Me.setStrictMode(je, e);
		} catch {}
	}
	var Pe = Math.clz32 ? Math.clz32 : Le, Fe = Math.log, Ie = Math.LN2;
	function Le(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Fe(e) / Ie | 0) | 0;
	}
	var Re = 256, ze = 4194304;
	function Be(e) {
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
	function Ve(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Be(n))) : i = Be(o) : i = Be(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Be(n))) : i = Be(o)) : i = Be(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function He(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Ue(e, t) {
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
	function We() {
		var e = Re;
		return Re <<= 1, !(Re & 4194048) && (Re = 256), e;
	}
	function Ge() {
		var e = ze;
		return ze <<= 1, !(ze & 62914560) && (ze = 4194304), e;
	}
	function Ke(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function qe(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function Je(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Pe(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && Ye(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function Ye(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Pe(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 4194090;
	}
	function Xe(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Pe(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function Ze(e) {
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
	function Qe(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function $e() {
		var e = D.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : Xf(e.type)) : e;
	}
	function et(e, t) {
		var n = D.p;
		try {
			return D.p = e, t();
		} finally {
			D.p = n;
		}
	}
	var tt = Math.random().toString(36).slice(2), nt = "__reactFiber$" + tt, rt = "__reactProps$" + tt, it = "__reactContainer$" + tt, at = "__reactEvents$" + tt, ot = "__reactListeners$" + tt, st = "__reactHandles$" + tt, ct = "__reactResources$" + tt, lt = "__reactMarker$" + tt;
	function ut(e) {
		delete e[nt], delete e[rt], delete e[at], delete e[ot], delete e[st];
	}
	function dt(e) {
		var t = e[nt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[it] || n[nt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Kd(e); e !== null;) {
					if (n = e[nt]) return n;
					e = Kd(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function ft(e) {
		if (e = e[nt] || e[it]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function pt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function mt(e) {
		var t = e[ct];
		return t ||= e[ct] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function ht(e) {
		e[lt] = !0;
	}
	var gt = /* @__PURE__ */ new Set(), _t = {};
	function vt(e, t) {
		yt(e, t), yt(e + "Capture", t);
	}
	function yt(e, t) {
		for (_t[e] = t, e = 0; e < t.length; e++) gt.add(t[e]);
	}
	var bt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), xt = {}, St = {};
	function Ct(e) {
		return ye.call(St, e) ? !0 : ye.call(xt, e) ? !1 : bt.test(e) ? St[e] = !0 : (xt[e] = !0, !1);
	}
	function wt(e, t, n) {
		if (Ct(t)) {
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
	function Tt(e, t, n) {
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
	function Et(e, t, n, r) {
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
	var Dt, Ot;
	function kt(e) {
		if (Dt === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Dt = t && t[1] || "", Ot = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Dt + e + Ot;
	}
	var At = !1;
	function jt(e, t) {
		if (!e || At) return "";
		At = !0;
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
			At = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? kt(n) : "";
	}
	function Mt(e) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return kt(e.type);
			case 16: return kt("Lazy");
			case 13: return kt("Suspense");
			case 19: return kt("SuspenseList");
			case 0:
			case 15: return jt(e.type, !1);
			case 11: return jt(e.type.render, !1);
			case 1: return jt(e.type, !0);
			case 31: return kt("Activity");
			default: return "";
		}
	}
	function Nt(e) {
		try {
			var t = "";
			do
				t += Mt(e), e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	function Pt(e) {
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
	function Ft(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function It(e) {
		var t = Ft(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
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
	function Lt(e) {
		e._valueTracker ||= It(e);
	}
	function Rt(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Ft(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n && (t.setValue(e), !0);
	}
	function zt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Bt = /[\n"\\]/g;
	function Vt(e) {
		return e.replace(Bt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Ht(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Pt(t)) : e.value !== "" + Pt(t) && (e.value = "" + Pt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Wt(e, o, Pt(n)) : Wt(e, o, Pt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Pt(s) : e.removeAttribute("name");
	}
	function Ut(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) return;
			n = n == null ? "" : "" + Pt(n), t = t == null ? n : "" + Pt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o);
	}
	function Wt(e, t, n) {
		t === "number" && zt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Gt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Pt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Kt(e, t, n) {
		if (t != null && (t = "" + Pt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Pt(n);
	}
	function qt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (le(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Pt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r);
	}
	function Jt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Yt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function Xt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Yt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Zt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && Xt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && Xt(e, o, t[o]);
	}
	function Qt(e) {
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
	var $t = /* @__PURE__ */ new Map([
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
	]), en = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function tn(e) {
		return en.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	var nn = null;
	function rn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var an = null, on = null;
	function sn(e) {
		var t = ft(e);
		if (t && (e = t.stateNode)) {
			var n = e[rt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Ht(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Vt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[rt] || null;
								if (!a) throw Error(i(90));
								Ht(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Rt(r);
					}
					break a;
				case "textarea":
					Kt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Gt(e, !!n.multiple, t, !1);
			}
		}
	}
	var cn = !1;
	function ln(e, t, n) {
		if (cn) return e(t, n);
		cn = !0;
		try {
			return e(t);
		} finally {
			if (cn = !1, (an !== null || on !== null) && (cu(), an && (t = an, e = on, on = an = null, sn(t), e))) for (t = 0; t < e.length; t++) sn(e[t]);
		}
	}
	function un(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[rt] || null;
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
	var dn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), fn = !1;
	if (dn) try {
		var pn = {};
		Object.defineProperty(pn, "passive", { get: function() {
			fn = !0;
		} }), window.addEventListener("test", pn, pn), window.removeEventListener("test", pn, pn);
	} catch {
		fn = !1;
	}
	var mn = null, hn = null, gn = null;
	function _n() {
		if (gn) return gn;
		var e, t = hn, n = t.length, r, i = "value" in mn ? mn.value : mn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return gn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function vn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function yn() {
		return !0;
	}
	function bn() {
		return !1;
	}
	function xn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? yn : bn, this.isPropagationStopped = bn, this;
		}
		return p(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = yn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = yn);
			},
			persist: function() {},
			isPersistent: yn
		}), t;
	}
	var Sn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Cn = xn(Sn), wn = p({}, Sn, {
		view: 0,
		detail: 0
	}), Tn = xn(wn), En, Dn, On, kn = p({}, wn, {
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
		getModifierState: Bn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== On && (On && e.type === "mousemove" ? (En = e.screenX - On.screenX, Dn = e.screenY - On.screenY) : Dn = En = 0, On = e), En);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Dn;
		}
	}), An = xn(kn), jn = xn(p({}, kn, { dataTransfer: 0 })), Mn = xn(p({}, wn, { relatedTarget: 0 })), Nn = xn(p({}, Sn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Pn = xn(p({}, Sn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Fn = xn(p({}, Sn, { data: 0 })), In = {
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
	}, Ln = {
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
	}, Rn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function zn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Rn[e]) ? !!t[e] : !1;
	}
	function Bn() {
		return zn;
	}
	var Vn = xn(p({}, wn, {
		key: function(e) {
			if (e.key) {
				var t = In[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = vn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ln[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Bn,
		charCode: function(e) {
			return e.type === "keypress" ? vn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? vn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Hn = xn(p({}, kn, {
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
	})), Un = xn(p({}, wn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Bn
	})), Wn = xn(p({}, Sn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Gn = xn(p({}, kn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Kn = xn(p({}, Sn, {
		newState: 0,
		oldState: 0
	})), qn = [
		9,
		13,
		27,
		32
	], Jn = dn && "CompositionEvent" in window, Yn = null;
	dn && "documentMode" in document && (Yn = document.documentMode);
	var Xn = dn && "TextEvent" in window && !Yn, Zn = dn && (!Jn || Yn && 8 < Yn && 11 >= Yn), Qn = " ", $n = !1;
	function er(e, t) {
		switch (e) {
			case "keyup": return qn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function tr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var nr = !1;
	function rr(e, t) {
		switch (e) {
			case "compositionend": return tr(t);
			case "keypress": return t.which === 32 ? ($n = !0, Qn) : null;
			case "textInput": return e = t.data, e === Qn && $n ? null : e;
			default: return null;
		}
	}
	function ir(e, t) {
		if (nr) return e === "compositionend" || !Jn && er(e, t) ? (e = _n(), gn = hn = mn = null, nr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Zn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var ar = {
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
	function or(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!ar[e.type] : t === "textarea";
	}
	function sr(e, t, n, r) {
		an ? on ? on.push(r) : on = [r] : an = r, t = pd(t, "onChange"), 0 < t.length && (n = new Cn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var cr = null, lr = null;
	function ur(e) {
		od(e, 0);
	}
	function dr(e) {
		if (Rt(pt(e))) return e;
	}
	function fr(e, t) {
		if (e === "change") return t;
	}
	var pr = !1;
	if (dn) {
		var mr;
		if (dn) {
			var hr = "oninput" in document;
			if (!hr) {
				var gr = document.createElement("div");
				gr.setAttribute("oninput", "return;"), hr = typeof gr.oninput == "function";
			}
			mr = hr;
		} else mr = !1;
		pr = mr && (!document.documentMode || 9 < document.documentMode);
	}
	function _r() {
		cr && (cr.detachEvent("onpropertychange", vr), lr = cr = null);
	}
	function vr(e) {
		if (e.propertyName === "value" && dr(lr)) {
			var t = [];
			sr(t, lr, e, rn(e)), ln(ur, t);
		}
	}
	function yr(e, t, n) {
		e === "focusin" ? (_r(), cr = t, lr = n, cr.attachEvent("onpropertychange", vr)) : e === "focusout" && _r();
	}
	function br(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return dr(lr);
	}
	function xr(e, t) {
		if (e === "click") return dr(t);
	}
	function Sr(e, t) {
		if (e === "input" || e === "change") return dr(t);
	}
	function Cr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var wr = typeof Object.is == "function" ? Object.is : Cr;
	function Tr(e, t) {
		if (wr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!ye.call(t, i) || !wr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Er(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Dr(e, t) {
		var n = Er(e);
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
			n = Er(n);
		}
	}
	function Or(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Or(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function kr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = zt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = zt(e.document);
		}
		return t;
	}
	function Ar(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var jr = dn && "documentMode" in document && 11 >= document.documentMode, Mr = null, Nr = null, Pr = null, Fr = !1;
	function Ir(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Fr || Mr == null || Mr !== zt(r) || (r = Mr, "selectionStart" in r && Ar(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Pr && Tr(Pr, r) || (Pr = r, r = pd(Nr, "onSelect"), 0 < r.length && (t = new Cn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Mr)));
	}
	function Lr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Rr = {
		animationend: Lr("Animation", "AnimationEnd"),
		animationiteration: Lr("Animation", "AnimationIteration"),
		animationstart: Lr("Animation", "AnimationStart"),
		transitionrun: Lr("Transition", "TransitionRun"),
		transitionstart: Lr("Transition", "TransitionStart"),
		transitioncancel: Lr("Transition", "TransitionCancel"),
		transitionend: Lr("Transition", "TransitionEnd")
	}, zr = {}, Br = {};
	dn && (Br = document.createElement("div").style, "AnimationEvent" in window || (delete Rr.animationend.animation, delete Rr.animationiteration.animation, delete Rr.animationstart.animation), "TransitionEvent" in window || delete Rr.transitionend.transition);
	function Vr(e) {
		if (zr[e]) return zr[e];
		if (!Rr[e]) return e;
		var t = Rr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Br) return zr[e] = t[n];
		return e;
	}
	var Hr = Vr("animationend"), Ur = Vr("animationiteration"), Wr = Vr("animationstart"), Gr = Vr("transitionrun"), Kr = Vr("transitionstart"), qr = Vr("transitioncancel"), Jr = Vr("transitionend"), Yr = /* @__PURE__ */ new Map(), Xr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	Xr.push("scrollEnd");
	function Zr(e, t) {
		Yr.set(e, t), vt(t, [e]);
	}
	var Qr = /* @__PURE__ */ new WeakMap();
	function $r(e, t) {
		if (typeof e == "object" && e) {
			var n = Qr.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Nt(t)
			}, Qr.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Nt(t)
		};
	}
	var ei = [], ti = 0, ni = 0;
	function ri() {
		for (var e = ti, t = ni = ti = 0; t < e;) {
			var n = ei[t];
			ei[t++] = null;
			var r = ei[t];
			ei[t++] = null;
			var i = ei[t];
			ei[t++] = null;
			var a = ei[t];
			if (ei[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && si(n, i, a);
		}
	}
	function ii(e, t, n, r) {
		ei[ti++] = e, ei[ti++] = t, ei[ti++] = n, ei[ti++] = r, ni |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ai(e, t, n, r) {
		return ii(e, t, n, r), ci(e);
	}
	function oi(e, t) {
		return ii(e, null, null, t), ci(e);
	}
	function si(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Pe(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ci(e) {
		if (50 < $l) throw $l = 0, eu = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var li = {};
	function ui(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function di(e, t, n, r) {
		return new ui(e, t, n, r);
	}
	function fi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function pi(e, t) {
		var n = e.alternate;
		return n === null ? (n = di(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function mi(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function hi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") fi(e) && (s = 1);
		else if (typeof e == "string") s = Tf(e, n, me.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ie: return e = di(31, n, t, a), e.elementType = ie, e.lanes = o, e;
			case v: return gi(n.children, a, o, t);
			case y:
				s = 8, a |= 24;
				break;
			case b: return e = di(12, n, t, a | 2), e.elementType = b, e.lanes = o, e;
			case w: return e = di(13, n, t, a), e.elementType = w, e.lanes = o, e;
			case te: return e = di(19, n, t, a), e.elementType = te, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case ee:
					case S:
						s = 10;
						break a;
					case x:
						s = 9;
						break a;
					case C:
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
		return t = di(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function gi(e, t, n, r) {
		return e = di(7, e, r, t), e.lanes = n, e;
	}
	function _i(e, t, n) {
		return e = di(6, e, null, t), e.lanes = n, e;
	}
	function vi(e, t, n) {
		return t = di(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var yi = [], bi = 0, xi = null, Si = 0, Ci = [], wi = 0, Ti = null, Ei = 1, Di = "";
	function Oi(e, t) {
		yi[bi++] = Si, yi[bi++] = xi, xi = e, Si = t;
	}
	function ki(e, t, n) {
		Ci[wi++] = Ei, Ci[wi++] = Di, Ci[wi++] = Ti, Ti = e;
		var r = Ei;
		e = Di;
		var i = 32 - Pe(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Pe(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ei = 1 << 32 - Pe(t) + i | n << i | r, Di = a + e;
		} else Ei = 1 << a | n << i | r, Di = e;
	}
	function Ai(e) {
		e.return !== null && (Oi(e, 1), ki(e, 1, 0));
	}
	function ji(e) {
		for (; e === xi;) xi = yi[--bi], yi[bi] = null, Si = yi[--bi], yi[bi] = null;
		for (; e === Ti;) Ti = Ci[--wi], Ci[wi] = null, Di = Ci[--wi], Ci[wi] = null, Ei = Ci[--wi], Ci[wi] = null;
	}
	var Mi = null, F = null, I = !1, Ni = null, Pi = !1, Fi = Error(i(519));
	function Ii(e) {
		throw Hi($r(Error(i(418, "")), e)), Fi;
	}
	function Li(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[nt] = e, t[rt] = r, n) {
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
				Q("invalid", t), Ut(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0), Lt(t);
				break;
			case "select":
				Q("invalid", t);
				break;
			case "textarea": Q("invalid", t), qt(t, r.value, r.defaultValue, r.children), Lt(t);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || yd(t.textContent, n) ? (r.popover != null && (Q("beforetoggle", t), Q("toggle", t)), r.onScroll != null && Q("scroll", t), r.onScrollEnd != null && Q("scrollend", t), r.onClick != null && (t.onclick = bd), t = !0) : t = !1, t || Ii(e);
	}
	function Ri(e) {
		for (Mi = e.return; Mi;) switch (Mi.tag) {
			case 5:
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
		if (!I) return Ri(e), I = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = n === "form" || n === "button" || kd(e.type, e.memoizedProps)), n = !n), n && F && Ii(e), Ri(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			a: {
				for (e = e.nextSibling, t = 0; e;) {
					if (e.nodeType === 8) {
						if (n = e.data, n === "/$") {
							if (t === 0) {
								F = Wd(e.nextSibling);
								break a;
							}
							t--;
						} else n !== "$" && n !== "$!" && n !== "$?" || t++;
					}
					e = e.nextSibling;
				}
				F = null;
			}
		} else t === 27 ? (t = F, Ld(e.type) ? (e = Gd, Gd = null, F = e) : F = t) : F = Mi ? Wd(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Bi() {
		F = Mi = null, I = !1;
	}
	function Vi() {
		var e = Ni;
		return e !== null && (Bl === null ? Bl = e : Bl.push.apply(Bl, e), Ni = null), e;
	}
	function Hi(e) {
		Ni === null ? Ni = [e] : Ni.push(e);
	}
	var Ui = pe(null), Wi = null, Gi = null;
	function Ki(e, t, n) {
		k(Ui, t._currentValue), t._currentValue = n;
	}
	function qi(e) {
		e._currentValue = Ui.current, O(Ui);
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
					wr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === ge.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Ff] : e.push(Ff));
			}
			a = a.return;
		}
		e !== null && Yi(t, e, n, r), t.flags |= 262144;
	}
	function Zi(e) {
		for (e = e.firstContext; e !== null;) {
			if (!wr(e.context._currentValue, e.memoizedValue)) return !0;
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
			la = 0, ua = Qu(), da = {
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
	var ha = E.S;
	E.S = function(e, t) {
		typeof t == "object" && t && typeof t.then == "function" && fa(e, t), ha !== null && ha(e, t);
	};
	var ga = pe(null);
	function _a() {
		var e = ga.current;
		return e === null ? K.pooledCache : e;
	}
	function va(e, t) {
		t === null ? k(ga, ga.current) : k(ga, t.pool);
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
	function Ta() {}
	function Ea(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(Ta, Ta), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, ka(e), e;
			default:
				if (typeof t.status == "string") t.then(Ta, Ta);
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
					case "rejected": throw e = t.reason, ka(e), e;
				}
				throw Da = t, ba;
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
	var Aa = !1;
	function ja(e) {
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
	function Ma(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Na(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Pa(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, G & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ci(e), si(e, null, n), t;
		}
		return ii(e, r, t, n), ci(e);
	}
	function Fa(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Xe(e, n);
		}
	}
	function Ia(e, t) {
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
	var La = !1;
	function Ra() {
		if (La) {
			var e = da;
			if (e !== null) throw e;
		}
	}
	function za(e, t, n, r) {
		La = !1;
		var i = e.updateQueue;
		Aa = !1;
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
					f !== 0 && f === ua && (La = !0), u !== null && (u = u.next = {
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
							case 2: Aa = !0;
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
	function Ba(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Va(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ba(n[e], t);
	}
	var Ha = pe(null), Ua = pe(0);
	function Wa(e, t) {
		e = Nl, k(Ua, e), k(Ha, t), Nl = e | t.baseLanes;
	}
	function Ga() {
		k(Ua, Nl), k(Ha, Ha.current);
	}
	function Ka() {
		Nl = Ua.current, O(Ha), O(Ua);
	}
	var qa = 0, L = null, R = null, z = null, Ja = !1, Ya = !1, Xa = !1, Za = 0, Qa = 0, $a = null, eo = 0;
	function B() {
		throw Error(i(321));
	}
	function to(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!wr(e[n], t[n])) return !1;
		return !0;
	}
	function no(e, t, n, r, i, a) {
		return qa = a, L = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, E.H = e === null || e.memoizedState === null ? vs : ys, Xa = !1, a = n(r, i), Xa = !1, Ya && (a = io(t, n, r, i)), ro(e), a;
	}
	function ro(e) {
		E.H = _s;
		var t = R !== null && R.next !== null;
		if (qa = 0, z = R = L = null, Ja = !1, Qa = 0, $a = null, t) throw Error(i(300));
		e === null || ec || (e = e.dependencies, e !== null && Zi(e) && (ec = !0));
	}
	function io(e, t, n, r) {
		L = e;
		var a = 0;
		do {
			if (Ya && ($a = null), Qa = 0, Ya = !1, 25 <= a) throw Error(i(301));
			if (a += 1, z = R = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			E.H = bs, o = t(n, r);
		} while (Ya);
		return o;
	}
	function ao() {
		var e = E.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? fo(t) : t, e = e.useState()[0], (R === null ? null : R.memoizedState) !== e && (L.flags |= 1024), t;
	}
	function oo() {
		var e = Za !== 0;
		return Za = 0, e;
	}
	function so(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function co(e) {
		if (Ja) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			Ja = !1;
		}
		qa = 0, z = R = L = null, Ya = !1, Qa = Za = 0, $a = null;
	}
	function lo() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return z === null ? L.memoizedState = z = e : z = z.next = e, z;
	}
	function V() {
		if (R === null) {
			var e = L.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = R.next;
		var t = z === null ? L.memoizedState : z.next;
		if (t !== null) z = t, R = e;
		else {
			if (e === null) throw L.alternate === null ? Error(i(467)) : Error(i(310));
			R = e, e = {
				memoizedState: R.memoizedState,
				baseState: R.baseState,
				baseQueue: R.baseQueue,
				queue: R.queue,
				next: null
			}, z === null ? L.memoizedState = z = e : z = z.next = e;
		}
		return z;
	}
	function uo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function fo(e) {
		var t = Qa;
		return Qa += 1, $a === null && ($a = []), e = Ea($a, e, t), t = L, (z === null ? t.memoizedState : z.next) === null && (t = t.alternate, E.H = t === null || t.memoizedState === null ? vs : ys), e;
	}
	function po(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return fo(e);
			if (e.$$typeof === S) return $i(e);
		}
		throw Error(i(438, String(e)));
	}
	function mo(e) {
		var t = null, n = L.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = L.alternate;
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
		}, n === null && (n = uo(), L.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = T;
		return t.index++, n;
	}
	function ho(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function go(e) {
		return _o(V(), R, e);
	}
	function _o(e, t, n) {
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
				if (f === u.lane ? (qa & f) === f : (J & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ua && (d = !0);
					else if ((qa & p) === p) {
						u = u.next, p === ua && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, L.lanes |= p, Pl |= p;
					f = u.action, Xa && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, L.lanes |= f, Pl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !wr(o, e.memoizedState) && (ec = !0, d && (n = da, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function vo(e) {
		var t = V(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			wr(o, t.memoizedState) || (ec = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function yo(e, t, n) {
		var r = L, a = V(), o = I;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !wr((R || a).memoizedState, n);
		if (s && (a.memoizedState = n, ec = !0), a = a.queue, Uo(2048, 8, So.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || z !== null && z.memoizedState.tag & 1) {
			if (r.flags |= 2048, zo(9, Bo(), xo.bind(null, r, a, n, t), null), K === null) throw Error(i(349));
			o || qa & 124 || bo(r, t, n);
		}
		return n;
	}
	function bo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = L.updateQueue, t === null ? (t = uo(), L.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function xo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Co(t) && wo(e);
	}
	function So(e, t, n) {
		return n(function() {
			Co(t) && wo(e);
		});
	}
	function Co(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !wr(e, n);
		} catch {
			return !0;
		}
	}
	function wo(e) {
		var t = oi(e, 2);
		t !== null && ru(t, e, 2);
	}
	function To(e) {
		var t = lo();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), Xa) {
				Ne(!0);
				try {
					n();
				} finally {
					Ne(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ho,
			lastRenderedState: e
		}, t;
	}
	function Eo(e, t, n, r) {
		return e.baseState = n, _o(e, R, typeof r == "function" ? r : ho);
	}
	function Do(e, t, n, r, a) {
		if (ms(e)) throw Error(i(485));
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
			E.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Oo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Oo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = E.T, o = {};
			E.T = o;
			try {
				var s = n(i, r), c = E.S;
				c !== null && c(o, s), ko(e, t, s);
			} catch (n) {
				jo(e, t, n);
			} finally {
				E.T = a;
			}
		} else try {
			a = n(i, r), ko(e, t, a);
		} catch (n) {
			jo(e, t, n);
		}
	}
	function ko(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Ao(e, t, n);
		}, function(n) {
			return jo(e, t, n);
		}) : Ao(e, t, n);
	}
	function Ao(e, t, n) {
		t.status = "fulfilled", t.value = n, Mo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Oo(e, n)));
	}
	function jo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Mo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Mo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function No(e, t) {
		return t;
	}
	function Po(e, t) {
		if (I) {
			var n = K.formState;
			if (n !== null) {
				a: {
					var r = L;
					if (I) {
						if (F) {
							b: {
								for (var i = F, a = Pi; i.nodeType !== 8;) {
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
								F = Wd(i.nextSibling), r = i.data === "F!";
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
		return n = lo(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: No,
			lastRenderedState: t
		}, n.queue = r, n = ds.bind(null, L, r), r.dispatch = n, r = To(!1), a = ps.bind(null, L, !1, r.queue), r = lo(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Do.bind(null, L, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Fo(e) {
		return Io(V(), R, e);
	}
	function Io(e, t, n) {
		if (t = _o(e, t, No)[0], e = go(ho)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = fo(t);
		} catch (e) {
			throw e === ba ? Sa : e;
		}
		else r = t;
		t = V();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (L.flags |= 2048, zo(9, Bo(), Lo.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function Lo(e, t) {
		e.action = t;
	}
	function Ro(e) {
		var t = V(), n = R;
		if (n !== null) return Io(t, n, e);
		V(), t = t.memoizedState, n = V();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function zo(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = L.updateQueue, t === null && (t = uo(), L.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function Bo() {
		return {
			destroy: void 0,
			resource: void 0
		};
	}
	function Vo() {
		return V().memoizedState;
	}
	function Ho(e, t, n, r) {
		var i = lo();
		r = r === void 0 ? null : r, L.flags |= e, i.memoizedState = zo(1 | t, Bo(), n, r);
	}
	function Uo(e, t, n, r) {
		var i = V();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		R !== null && r !== null && to(r, R.memoizedState.deps) ? i.memoizedState = zo(t, a, n, r) : (L.flags |= e, i.memoizedState = zo(1 | t, a, n, r));
	}
	function Wo(e, t) {
		Ho(8390656, 8, e, t);
	}
	function Go(e, t) {
		Uo(2048, 8, e, t);
	}
	function Ko(e, t) {
		return Uo(4, 2, e, t);
	}
	function qo(e, t) {
		return Uo(4, 4, e, t);
	}
	function Jo(e, t) {
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
	function Yo(e, t, n) {
		n = n == null ? null : n.concat([e]), Uo(4, 4, Jo.bind(null, t, e), n);
	}
	function Xo() {}
	function Zo(e, t) {
		var n = V();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && to(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Qo(e, t) {
		var n = V();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && to(t, r[1])) return r[0];
		if (r = e(), Xa) {
			Ne(!0);
			try {
				e();
			} finally {
				Ne(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function $o(e, t, n) {
		return n === void 0 || qa & 1073741824 ? e.memoizedState = t : (e.memoizedState = n, e = nu(), L.lanes |= e, Pl |= e, n);
	}
	function es(e, t, n, r) {
		return wr(n, t) ? n : Ha.current === null ? qa & 42 ? (e = nu(), L.lanes |= e, Pl |= e, t) : (ec = !0, e.memoizedState = n) : (e = $o(e, n, r), wr(e, t) || (ec = !0), e);
	}
	function ts(e, t, n, r, i) {
		var a = D.p;
		D.p = a !== 0 && 8 > a ? a : 8;
		var o = E.T, s = {};
		E.T = s, ps(e, !1, t, n);
		try {
			var c = i(), l = E.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? fs(e, t, ma(c, r), tu(e)) : fs(e, t, r, tu(e));
		} catch (n) {
			fs(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, tu());
		} finally {
			D.p = a, E.T = o;
		}
	}
	function ns() {}
	function rs(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = is(e).queue;
		ts(e, a, t, ue, n === null ? ns : function() {
			return as(e), n(r);
		});
	}
	function is(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: ue,
			baseState: ue,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: ho,
				lastRenderedState: ue
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
				lastRenderedReducer: ho,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function as(e) {
		var t = is(e).next.queue;
		fs(e, t, {}, tu());
	}
	function os() {
		return $i(Ff);
	}
	function ss() {
		return V().memoizedState;
	}
	function cs() {
		return V().memoizedState;
	}
	function ls(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = tu();
					e = Na(n);
					var r = Pa(t, e, n);
					r !== null && (ru(r, t, n), Fa(r, t, n)), t = { cache: oa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function us(e, t, n) {
		var r = tu();
		n = {
			lane: r,
			revertLane: 0,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ms(e) ? hs(t, n) : (n = ai(e, t, n, r), n !== null && (ru(n, e, r), gs(n, t, r)));
	}
	function ds(e, t, n) {
		fs(e, t, n, tu());
	}
	function fs(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (ms(e)) hs(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, wr(s, o)) return ii(e, t, i, 0), K === null && ri(), !1;
			} catch {}
			if (n = ai(e, t, i, r), n !== null) return ru(n, e, r), gs(n, t, r), !0;
		}
		return !1;
	}
	function ps(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: Qu(),
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, ms(e)) {
			if (t) throw Error(i(479));
		} else t = ai(e, n, r, 2), t !== null && ru(t, e, 2);
	}
	function ms(e) {
		var t = e.alternate;
		return e === L || t !== null && t === L;
	}
	function hs(e, t) {
		Ya = Ja = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function gs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, Xe(e, n);
		}
	}
	var _s = {
		readContext: $i,
		use: po,
		useCallback: B,
		useContext: B,
		useEffect: B,
		useImperativeHandle: B,
		useLayoutEffect: B,
		useInsertionEffect: B,
		useMemo: B,
		useReducer: B,
		useRef: B,
		useState: B,
		useDebugValue: B,
		useDeferredValue: B,
		useTransition: B,
		useSyncExternalStore: B,
		useId: B,
		useHostTransitionStatus: B,
		useFormState: B,
		useActionState: B,
		useOptimistic: B,
		useMemoCache: B,
		useCacheRefresh: B
	}, vs = {
		readContext: $i,
		use: po,
		useCallback: function(e, t) {
			return lo().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: $i,
		useEffect: Wo,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), Ho(4194308, 4, Jo.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return Ho(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			Ho(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = lo();
			t = t === void 0 ? null : t;
			var r = e();
			if (Xa) {
				Ne(!0);
				try {
					e();
				} finally {
					Ne(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = lo();
			if (n !== void 0) {
				var i = n(t);
				if (Xa) {
					Ne(!0);
					try {
						n(t);
					} finally {
						Ne(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = us.bind(null, L, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = lo();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = To(e);
			var t = e.queue, n = ds.bind(null, L, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Xo,
		useDeferredValue: function(e, t) {
			return $o(lo(), e, t);
		},
		useTransition: function() {
			var e = To(!1);
			return e = ts.bind(null, L, e.queue, !0, !1), lo().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = L, a = lo();
			if (I) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), K === null) throw Error(i(349));
				J & 124 || bo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, Wo(So.bind(null, r, o, e), [e]), r.flags |= 2048, zo(9, Bo(), xo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = lo(), t = K.identifierPrefix;
			if (I) {
				var n = Di, r = Ei;
				n = (r & ~(1 << 32 - Pe(r) - 1)).toString(32) + n, t = "«" + t + "R" + n, n = Za++, 0 < n && (t += "H" + n.toString(32)), t += "»";
			} else n = eo++, t = "«" + t + "r" + n.toString(32) + "»";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: os,
		useFormState: Po,
		useActionState: Po,
		useOptimistic: function(e) {
			var t = lo();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = ps.bind(null, L, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: mo,
		useCacheRefresh: function() {
			return lo().memoizedState = ls.bind(null, L);
		}
	}, ys = {
		readContext: $i,
		use: po,
		useCallback: Zo,
		useContext: $i,
		useEffect: Go,
		useImperativeHandle: Yo,
		useInsertionEffect: Ko,
		useLayoutEffect: qo,
		useMemo: Qo,
		useReducer: go,
		useRef: Vo,
		useState: function() {
			return go(ho);
		},
		useDebugValue: Xo,
		useDeferredValue: function(e, t) {
			return es(V(), R.memoizedState, e, t);
		},
		useTransition: function() {
			var e = go(ho)[0], t = V().memoizedState;
			return [typeof e == "boolean" ? e : fo(e), t];
		},
		useSyncExternalStore: yo,
		useId: ss,
		useHostTransitionStatus: os,
		useFormState: Fo,
		useActionState: Fo,
		useOptimistic: function(e, t) {
			return Eo(V(), R, e, t);
		},
		useMemoCache: mo,
		useCacheRefresh: cs
	}, bs = {
		readContext: $i,
		use: po,
		useCallback: Zo,
		useContext: $i,
		useEffect: Go,
		useImperativeHandle: Yo,
		useInsertionEffect: Ko,
		useLayoutEffect: qo,
		useMemo: Qo,
		useReducer: vo,
		useRef: Vo,
		useState: function() {
			return vo(ho);
		},
		useDebugValue: Xo,
		useDeferredValue: function(e, t) {
			var n = V();
			return R === null ? $o(n, e, t) : es(n, R.memoizedState, e, t);
		},
		useTransition: function() {
			var e = vo(ho)[0], t = V().memoizedState;
			return [typeof e == "boolean" ? e : fo(e), t];
		},
		useSyncExternalStore: yo,
		useId: ss,
		useHostTransitionStatus: os,
		useFormState: Ro,
		useActionState: Ro,
		useOptimistic: function(e, t) {
			var n = V();
			return R === null ? (n.baseState = e, [e, n.queue.dispatch]) : Eo(n, R, e, t);
		},
		useMemoCache: mo,
		useCacheRefresh: cs
	}, xs = null, Ss = 0;
	function Cs(e) {
		var t = Ss;
		return Ss += 1, xs === null && (xs = []), Ea(xs, e, t);
	}
	function ws(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Ts(e, t) {
		throw t.$$typeof === h ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Es(e) {
		var t = e._init;
		return t(e._payload);
	}
	function Ds(e) {
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
			return e = pi(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = _i(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === v ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === re && Es(i) === t.type) ? (t = a(t, n.props), ws(t, n), t.return = e, t) : (t = hi(n.type, n.key, n.props, null, e.mode, r), ws(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = vi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = gi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = _i("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case g: return n = hi(t.type, t.key, t.props, null, e.mode, n), ws(n, t), n.return = e, n;
					case _: return t = vi(t, e.mode, n), t.return = e, t;
					case re:
						var r = t._init;
						return t = r(t._payload), f(e, t, n);
				}
				if (le(t) || oe(t)) return t = gi(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Cs(t), n);
				if (t.$$typeof === S) return f(e, ea(e, t), n);
				Ts(e, t);
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
				if (le(n) || oe(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Cs(n), r);
				if (n.$$typeof === S) return p(e, t, ea(e, n), r);
				Ts(e, n);
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
				if (le(r) || oe(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Cs(r), i);
				if (r.$$typeof === S) return m(e, t, n, ea(t, r), i);
				Ts(t, r);
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
			if (h === s.length) return n(i, d), I && Oi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return I && Oi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), I && Oi(i, h), l;
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
			if (v.done) return n(a, h), I && Oi(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return I && Oi(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), I && Oi(a, g), u;
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
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === re && Es(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), ws(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								}
								t(e, r), r = r.sibling;
							}
							o.type === v ? (c = gi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = hi(o.type, o.key, o.props, null, e.mode, c), ws(c, o), c.return = e, e = c);
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
							c = vi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case re: return l = o._init, o = l(o._payload), b(e, r, o, c);
				}
				if (le(o)) return h(e, r, o, c);
				if (oe(o)) {
					if (l = oe(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), y(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Cs(o), c);
				if (o.$$typeof === S) return b(e, r, ea(e, o), c);
				Ts(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = _i(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Ss = 0;
				var i = b(e, t, n, r);
				return xs = null, i;
			} catch (t) {
				if (t === ba || t === Sa) throw t;
				var a = di(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Os = Ds(!0), ks = Ds(!1), As = pe(null), js = null;
	function Ms(e) {
		var t = e.alternate;
		k(Is, Is.current & 1), k(As, e), js === null && (t === null || Ha.current !== null || t.memoizedState !== null) && (js = e);
	}
	function Ns(e) {
		if (e.tag === 22) {
			if (k(Is, Is.current), k(As, e), js === null) {
				var t = e.alternate;
				t !== null && t.memoizedState !== null && (js = e);
			}
		} else Ps(e);
	}
	function Ps() {
		k(Is, Is.current), k(As, As.current);
	}
	function Fs(e) {
		O(As), js === e && (js = null), O(Is);
	}
	var Is = pe(0);
	function Ls(e) {
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
	function Rs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : p({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var zs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = tu(), i = Na(r);
			i.payload = t, n != null && (i.callback = n), t = Pa(e, i, r), t !== null && (ru(t, e, r), Fa(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = tu(), i = Na(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Pa(e, i, r), t !== null && (ru(t, e, r), Fa(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = tu(), r = Na(n);
			r.tag = 2, t != null && (r.callback = t), t = Pa(e, r, n), t !== null && (ru(t, e, n), Fa(t, e, n));
		}
	};
	function Bs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Tr(n, r) || !Tr(i, a) : !0;
	}
	function Vs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && zs.enqueueReplaceState(t, t.state, null);
	}
	function Hs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = p({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	var Us = typeof reportError == "function" ? reportError : function(e) {
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
	function Ws(e) {
		Us(e);
	}
	function Gs(e) {
		console.error(e);
	}
	function Ks(e) {
		Us(e);
	}
	function qs(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Js(e, t, n) {
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
	function Ys(e, t, n) {
		return n = Na(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			qs(e, t);
		}, n;
	}
	function Xs(e) {
		return e = Na(e), e.tag = 3, e;
	}
	function Zs(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				Js(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			Js(t, n, r), typeof i != "function" && (Gl === null ? Gl = /* @__PURE__ */ new Set([this]) : Gl.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Qs(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Xi(t, n, a, !0), n = As.current, n !== null) {
				switch (n.tag) {
					case 13: return js === null ? mu() : n.alternate === null && X === 0 && (X = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = /* @__PURE__ */ new Set([r]) : t.add(r), Mu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === Ca ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: /* @__PURE__ */ new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = /* @__PURE__ */ new Set([r]) : n.add(r)), Mu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Mu(e, r, a), mu(), !1;
		}
		if (I) return t = As.current, t === null ? (r !== Fi && (t = Error(i(423), { cause: r }), Hi($r(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = $r(r, n), a = Ys(e.stateNode, r, a), Ia(e, a), X !== 4 && (X = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Fi && (e = Error(i(422), { cause: r }), Hi($r(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = $r(o, n), zl === null ? zl = [o] : zl.push(o), X !== 4 && (X = 2), t === null) return !0;
		r = $r(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Ys(n.stateNode, r, e), Ia(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (Gl === null || !Gl.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Xs(a), Zs(a, e, n, r), Ia(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var $s = Error(i(461)), ec = !1;
	function tc(e, t, n, r) {
		t.child = e === null ? ks(t, null, n, r) : Os(t, e.child, n, r);
	}
	function nc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Qi(t), r = no(e, t, n, o, a, i), s = oo(), e !== null && !ec ? (so(e, t, i), Sc(e, t, i)) : (I && s && Ai(t), t.flags |= 1, tc(e, t, r, i), t.child);
	}
	function rc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !fi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, ic(e, t, a, r, i)) : (e = hi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Cc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Tr : n, n(o, r) && e.ref === t.ref) return Sc(e, t, i);
		}
		return t.flags |= 1, e = pi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function ic(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Tr(a, r) && e.ref === t.ref) {
				if (ec = !1, t.pendingProps = r = a, Cc(e, i)) e.flags & 131072 && (ec = !0);
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
			}, e !== null && va(t, a === null ? null : a.cachePool), a === null ? Ga() : Wa(t, a), Ns(t);
			else return t.lanes = t.childLanes = 536870912, oc(e, t, a === null ? n : a.baseLanes | n, n);
		} else a === null ? (e !== null && va(t, null), Ga(), Ps(t)) : (va(t, a.cachePool), Wa(t, a), Ps(t), t.memoizedState = null);
		return tc(e, t, i, n), t.child;
	}
	function oc(e, t, n, r) {
		var i = _a();
		return i = i === null ? null : {
			parent: aa._currentValue,
			pool: i
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: i
		}, e !== null && va(t, null), Ga(), Ns(t), e !== null && Xi(e, t, r, !0), null;
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
		return Qi(t), n = no(e, t, n, r, void 0, i), r = oo(), e !== null && !ec ? (so(e, t, i), Sc(e, t, i)) : (I && r && Ai(t), t.flags |= 1, tc(e, t, n, i), t.child);
	}
	function lc(e, t, n, r, i, a) {
		return Qi(t), t.updateQueue = null, n = io(t, r, n, i), ro(e), r = oo(), e !== null && !ec ? (so(e, t, a), Sc(e, t, a)) : (I && r && Ai(t), t.flags |= 1, tc(e, t, n, a), t.child);
	}
	function uc(e, t, n, r, i) {
		if (Qi(t), t.stateNode === null) {
			var a = li, o = n.contextType;
			typeof o == "object" && o && (a = $i(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = zs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, ja(t), o = n.contextType, a.context = typeof o == "object" && o ? $i(o) : li, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Rs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && zs.enqueueReplaceState(a, a.state, null), za(t, r, a, i), Ra(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Hs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = li, typeof u == "object" && u && (o = $i(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Vs(t, a, r, o), Aa = !1;
			var f = t.memoizedState;
			a.state = f, za(t, r, a, i), Ra(), l = t.memoizedState, s || f !== l || Aa ? (typeof d == "function" && (Rs(t, n, d, r), l = t.memoizedState), (c = Aa || Bs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ma(e, t), o = t.memoizedProps, u = Hs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = li, typeof l == "object" && l && (c = $i(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Vs(t, a, r, c), Aa = !1, f = t.memoizedState, a.state = f, za(t, r, a, i), Ra();
			var p = t.memoizedState;
			o !== d || f !== p || Aa || e !== null && e.dependencies !== null && Zi(e.dependencies) ? (typeof s == "function" && (Rs(t, n, s, r), p = t.memoizedState), (u = Aa || Bs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && Zi(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, sc(e, t), r = !!(t.flags & 128), a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Os(t, e.child, null, i), t.child = Os(t, null, n, i)) : tc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Sc(e, t, i), e;
	}
	function dc(e, t, n, r) {
		return Bi(), t.flags |= 256, tc(e, t, n, r), t.child;
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
			cachePool: ya()
		};
	}
	function mc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Ll), e;
	}
	function hc(e, t, n) {
		var r = t.pendingProps, a = !1, o = !!(t.flags & 128), s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : !!(Is.current & 2)), s && (a = !0, t.flags &= -129), s = !!(t.flags & 32), t.flags &= -33, e === null) {
			if (I) {
				if (a ? Ms(t) : Ps(t), I) {
					var c = F, l;
					if (l = c) {
						c: {
							for (l = c, c = Pi; l.nodeType !== 8;) {
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
							treeContext: Ti === null ? null : {
								id: Ei,
								overflow: Di
							},
							retryLane: 536870912,
							hydrationErrors: null
						}, l = di(18, null, null, 0), l.stateNode = c, l.return = t, t.child = l, Mi = t, F = null, l = !0);
					}
					l || Ii(t);
				}
				if (c = t.memoizedState, c !== null && (c = c.dehydrated, c !== null)) return Hd(c) ? t.lanes = 32 : t.lanes = 536870912, null;
				Fs(t);
			}
			return c = r.children, r = r.fallback, a ? (Ps(t), a = t.mode, c = _c({
				mode: "hidden",
				children: c
			}, a), r = gi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, a = t.child, a.memoizedState = pc(n), a.childLanes = mc(e, s, n), t.memoizedState = fc, r) : (Ms(t), gc(t, c));
		}
		if (l = e.memoizedState, l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (Ms(t), t.flags &= -257, t = vc(e, t, n)) : t.memoizedState === null ? (Ps(t), a = r.fallback, c = t.mode, r = _c({
				mode: "visible",
				children: r.children
			}, c), a = gi(a, c, n, null), a.flags |= 2, r.return = t, a.return = t, r.sibling = a, t.child = r, Os(t, e.child, null, n), r = t.child, r.memoizedState = pc(n), r.childLanes = mc(e, s, n), t.memoizedState = fc, t = a) : (Ps(t), t.child = e.child, t.flags |= 128, t = null);
			else if (Ms(t), Hd(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Hi({
					value: r,
					source: null,
					stack: null
				}), t = vc(e, t, n);
			} else if (ec || Xi(e, t, n, !1), s = (n & e.childLanes) !== 0, ec || s) {
				if (s = K, s !== null && (r = n & -n, r = r & 42 ? 1 : Ze(r), r = (r & (s.suspendedLanes | n)) === 0 ? r : 0, r !== 0 && r !== l.retryLane)) throw l.retryLane = r, oi(e, r), ru(s, e, r), $s;
				c.data === "$?" || mu(), t = vc(e, t, n);
			} else c.data === "$?" ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, F = Wd(c.nextSibling), Mi = t, I = !0, Ni = null, Pi = !1, e !== null && (Ci[wi++] = Ei, Ci[wi++] = Di, Ci[wi++] = Ti, Ei = e.id, Di = e.overflow, Ti = t), t = gc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (Ps(t), a = r.fallback, c = t.mode, l = e.child, u = l.sibling, r = pi(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (a = gi(a, c, n, null), a.flags |= 2) : a = pi(u, a), a.return = t, r.return = t, r.sibling = a, t.child = r, r = a, a = t.child, c = e.child.memoizedState, c === null ? c = pc(n) : (l = c.cachePool, l === null ? l = ya() : (u = aa._currentValue, l = l.parent === u ? l : {
			parent: u,
			pool: u
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: l
		}), a.memoizedState = c, a.childLanes = mc(e, s, n), t.memoizedState = fc, r) : (Ms(t), n = e.child, e = n.sibling, n = pi(n, {
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
		return e = di(22, e, null, t), e.lanes = 0, e.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}, e;
	}
	function vc(e, t, n) {
		return Os(t, e.child, null, n), e = gc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function yc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), Ji(e.return, t, n);
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
		if (tc(e, t, r.children, n), r = Is.current, r & 2) r = r & 1 | 2, t.flags |= 128;
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
		switch (k(Is, r), i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && Ls(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), bc(t, !1, i, n, a);
				break;
			case "backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && Ls(e) === null) {
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
				if (Xi(e, t, n, !1), (n & t.childLanes) === 0) return null;
			} else return null;
		}
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = pi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = pi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Cc(e, t) {
		return (e.lanes & t) !== 0 || (e = e.dependencies, !!(e !== null && Zi(e)));
	}
	function wc(e, t, n) {
		switch (t.tag) {
			case 3:
				_e(t, t.stateNode.containerInfo), Ki(t, aa, e.memoizedState.cache), Bi();
				break;
			case 27:
			case 5:
				M(t);
				break;
			case 4:
				_e(t, t.stateNode.containerInfo);
				break;
			case 10:
				Ki(t, t.type, t.memoizedProps.value);
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (Ms(t), e = Sc(e, t, n), e === null ? null : e.sibling) : hc(e, t, n) : (Ms(t), t.flags |= 128, null);
				Ms(t);
				break;
			case 19:
				var i = !!(e.flags & 128);
				if (r = (n & t.childLanes) !== 0, r ||= (Xi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return xc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), k(Is, Is.current), r) break;
				return null;
			case 22:
			case 23: return t.lanes = 0, ac(e, t, n);
			case 24: Ki(t, aa, e.memoizedState.cache);
		}
		return Sc(e, t, n);
	}
	function Tc(e, t, n) {
		if (e !== null) {
			if (e.memoizedProps !== t.pendingProps) ec = !0;
			else {
				if (!Cc(e, n) && !(t.flags & 128)) return ec = !1, wc(e, t, n);
				ec = !!(e.flags & 131072);
			}
		} else ec = !1, I && t.flags & 1048576 && ki(t, Si, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					e = t.pendingProps;
					var r = t.elementType, a = r._init;
					if (r = a(r._payload), t.type = r, typeof r == "function") fi(r) ? (e = Hs(r, e), t.tag = 1, t = uc(null, t, r, e, n)) : (t.tag = 0, t = cc(null, t, r, e, n));
					else {
						if (r != null) {
							if (a = r.$$typeof, a === C) {
								t.tag = 11, t = nc(null, t, r, e, n);
								break a;
							}
							if (a === ne) {
								t.tag = 14, t = rc(null, t, r, e, n);
								break a;
							}
						}
						throw t = ce(r) || r, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return cc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Hs(r, t.pendingProps), uc(e, t, r, a, n);
			case 3:
				a: {
					if (_e(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ma(e, t), za(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Ki(t, aa, r), r !== o.cache && Yi(t, [aa], n, !0), Ra(), r = s.element, o.isDehydrated) {
						if (o = {
							element: r,
							isDehydrated: !1,
							cache: s.cache
						}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
							t = dc(e, t, r, n);
							break a;
						}
						if (r !== a) {
							a = $r(Error(i(424)), t), Hi(a), t = dc(e, t, r, n);
							break a;
						}
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (F = Wd(e.firstChild), Mi = t, I = !0, Ni = null, Pi = !0, n = ks(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					} else {
						if (Bi(), r === a) {
							t = Sc(e, t, n);
							break a;
						}
						tc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return sc(e, t), e === null ? (n = df(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : I || (n = t.type, e = t.pendingProps, r = Ed(he.current).createElement(n), r[nt] = t, r[rt] = e, Sd(r, n, e), ht(r), t.stateNode = r) : t.memoizedState = df(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return M(t), e === null && I && (r = t.stateNode = qd(t.type, t.pendingProps, he.current), Mi = t, Pi = !0, a = F, Ld(t.type) ? (Gd = a, F = Wd(r.firstChild)) : F = a), tc(e, t, t.pendingProps.children, n), sc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && I && ((a = r = F) && (r = Bd(r, t.type, t.pendingProps, Pi), r === null ? a = !1 : (t.stateNode = r, Mi = t, F = Wd(r.firstChild), Pi = !1, a = !0)), a || Ii(t)), M(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, kd(a, o) ? r = null : s !== null && kd(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = no(e, t, ao, null, null, n), Ff._currentValue = a), sc(e, t), tc(e, t, r, n), t.child;
			case 6: return e === null && I && ((e = n = F) && (n = Vd(n, t.pendingProps, Pi), n === null ? e = !1 : (t.stateNode = n, Mi = t, F = null, e = !0)), e || Ii(t)), null;
			case 13: return hc(e, t, n);
			case 4: return _e(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Os(t, null, r, n) : tc(e, t, r, n), t.child;
			case 11: return nc(e, t, t.type, t.pendingProps, n);
			case 7: return tc(e, t, t.pendingProps, n), t.child;
			case 8: return tc(e, t, t.pendingProps.children, n), t.child;
			case 12: return tc(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Ki(t, t.type, r.value), tc(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Qi(t), a = $i(a), r = r(a), t.flags |= 1, tc(e, t, r, n), t.child;
			case 14: return rc(e, t, t.type, t.pendingProps, n);
			case 15: return ic(e, t, t.type, t.pendingProps, n);
			case 19: return xc(e, t, n);
			case 31: return r = t.pendingProps, n = t.mode, r = {
				mode: r.mode,
				children: r.children
			}, e === null ? (n = _c(r, n), n.ref = t.ref, t.child = n, n.return = t, t = n) : (n = pi(e.child, r), n.ref = t.ref, t.child = n, n.return = t, t = n), t;
			case 22: return ac(e, t, n);
			case 24: return Qi(t), r = $i(aa), e === null ? (a = _a(), a === null && (a = K, o = oa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, ja(t), Ki(t, aa, a)) : ((e.lanes & n) !== 0 && (Ma(e, t), za(t, null, null, n), Ra()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Ki(t, aa, r), r !== a.cache && Yi(t, [aa], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Ki(t, aa, r))), tc(e, t, t.pendingProps.children, n), t.child;
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
			if (t = As.current, t !== null && ((J & 4194048) === J ? js !== null : (J & 62914560) !== J && !(J & 536870912) || t !== js)) throw Da = Ca, xa;
			e.flags |= 8192;
		}
	}
	function Oc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Ge(), e.lanes |= t, Rl |= t);
	}
	function kc(e, t) {
		if (!I) switch (e.tailMode) {
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
		switch (ji(t), t.tag) {
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
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), qi(aa), j(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (zi(t) ? Ec(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Vi())), H(t), null;
			case 26: return n = t.memoizedState, e === null ? (Ec(t), n === null ? (H(t), t.flags &= -16777217) : (H(t), Dc(t, n))) : n ? n === e.memoizedState ? (H(t), t.flags &= -16777217) : (Ec(t), H(t), Dc(t, n)) : (e.memoizedProps !== r && Ec(t), H(t), t.flags &= -16777217), null;
			case 27:
				ve(t), n = he.current;
				var a = t.type;
				if (e !== null && t.stateNode != null) e.memoizedProps !== r && Ec(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), null;
					}
					e = me.current, zi(t) ? Li(t, e) : (e = qd(a, r, n), t.stateNode = e, Ec(t));
				}
				return H(t), null;
			case 5:
				if (ve(t), n = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Ec(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return H(t), null;
					}
					if (e = me.current, zi(t)) Li(t, e);
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
						e[nt] = t, e[rt] = r;
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
					if (e = he.current, zi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Mi, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[nt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || yd(e.nodeValue, n)), e || Ii(t);
					} else e = Ed(e).createTextNode(r), e[nt] = t, t.stateNode = e;
				}
				return H(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = zi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[nt] = t;
						} else Bi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						H(t), a = !1;
					} else a = Vi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (Fs(t), t) : (Fs(t), null);
				}
				if (Fs(t), t.flags & 128) return t.lanes = n, t;
				if (n = r !== null, e = e !== null && e.memoizedState !== null, n) {
					r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool);
					var o = null;
					r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048);
				}
				return n !== e && n && (t.child.flags |= 8192), Oc(t, t.updateQueue), H(t), null;
			case 4: return j(), e === null && ld(t.stateNode.containerInfo), H(t), null;
			case 10: return qi(t.type), H(t), null;
			case 19:
				if (O(Is), a = t.memoizedState, a === null) return H(t), null;
				if (r = !!(t.flags & 128), o = a.rendering, o === null) {
					if (r) kc(a, !1);
					else {
						if (X !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
							if (o = Ls(e), o !== null) {
								for (t.flags |= 128, kc(a, !1), e = o.updateQueue, t.updateQueue = e, Oc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) mi(n, e), n = n.sibling;
								return k(Is, Is.current & 1 | 2), t.child;
							}
							e = e.sibling;
						}
						a.tail !== null && Ce() > Ul && (t.flags |= 128, r = !0, kc(a, !1), t.lanes = 4194304);
					}
				} else {
					if (!r) {
						if (e = Ls(o), e !== null) {
							if (t.flags |= 128, r = !0, e = e.updateQueue, t.updateQueue = e, Oc(t, e), kc(a, !0), a.tail === null && a.tailMode === "hidden" && !o.alternate && !I) return H(t), null;
						} else 2 * Ce() - a.renderingStartTime > Ul && n !== 536870912 && (t.flags |= 128, r = !0, kc(a, !1), t.lanes = 4194304);
					}
					a.isBackwards ? (o.sibling = t.child, t.child = o) : (e = a.last, e === null ? t.child = o : e.sibling = o, a.last = o);
				}
				return a.tail === null ? (H(t), null) : (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = Ce(), t.sibling = null, e = Is.current, k(Is, r ? e & 1 | 2 : e & 1), t);
			case 22:
			case 23: return Fs(t), Ka(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (H(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : H(t), n = t.updateQueue, n !== null && Oc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && O(ga), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), qi(aa), H(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function jc(e, t) {
		switch (ji(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return qi(aa), j(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ve(t), null;
			case 13:
				if (Fs(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Bi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return O(Is), null;
			case 4: return j(), null;
			case 10: return qi(t.type), null;
			case 22:
			case 23: return Fs(t), Ka(), e !== null && O(ga), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return qi(aa), null;
			case 25: return null;
			default: return null;
		}
	}
	function Mc(e, t) {
		switch (ji(t), t.tag) {
			case 3:
				qi(aa), j();
				break;
			case 26:
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				j();
				break;
			case 13:
				Fs(t);
				break;
			case 19:
				O(Is);
				break;
			case 10:
				qi(t.type);
				break;
			case 22:
			case 23:
				Fs(t), Ka(), e !== null && O(ga);
				break;
			case 24: qi(aa);
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
				Va(t, n);
			} catch (t) {
				Z(e, e.return, t);
			}
		}
	}
	function Ic(e, t, n) {
		n.props = Hs(e.type, e.memoizedProps), n.state = e.memoizedState;
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
			Cd(r, e.type, n, t), r[rt] = t;
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
			Sd(t, r, n), t[nt] = e, t[rt] = n;
		} catch (t) {
			Z(e, e.return, t);
		}
	}
	var Kc = !1, U = !1, qc = !1, Jc = typeof WeakSet == "function" ? WeakSet : Set, Yc = null;
	function Xc(e, t) {
		if (e = e.containerInfo, wd = Uf, e = kr(e), Ar(e)) {
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
							var h = Hs(n.type, a, n.elementType === n.type);
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
						var i = Hs(n.type, t.memoizedProps);
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
						Va(e, t);
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
		t !== null && (e.alternate = null, Qc(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && ut(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var W = null, $c = !1;
	function el(e, t, n) {
		for (n = n.child; n !== null;) tl(e, t, n), n = n.sibling;
	}
	function tl(e, t, n) {
		if (Me && typeof Me.onCommitFiberUnmount == "function") try {
			Me.onCommitFiberUnmount(je, n);
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
											o = a.getElementsByTagName("title")[0], (!o || o[lt] || o[nt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Sd(o, r, n), o[nt] = e, ht(o), r = o;
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
									o[nt] = e, ht(o), r = o;
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
						Jt(a, "");
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
				al(t, e), cl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (Hl = Ce()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, il(e, r)));
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
						n.flags & 32 && (Jt(o, ""), n.flags &= -33), Wc(e, Hc(e), o);
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
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ba(c[i], s);
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
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && sa(n));
	}
	function ml(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e));
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
				hl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && sa(e)));
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
				case 24: sa(n.memoizedState.cache);
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
		var t = $i(aa), n = t.data.get(e);
		return n === void 0 && (n = e(), t.data.set(e, n)), n;
	} }, Ol = typeof WeakMap == "function" ? WeakMap : Map, G = 0, K = null, q = null, J = 0, Y = 0, kl = null, Al = !1, jl = !1, Ml = !1, Nl = 0, X = 0, Pl = 0, Fl = 0, Il = 0, Ll = 0, Rl = 0, zl = null, Bl = null, Vl = !1, Hl = 0, Ul = Infinity, Wl = null, Gl = null, Kl = 0, ql = null, Jl = null, Yl = 0, Xl = 0, Zl = null, Ql = null, $l = 0, eu = null;
	function tu() {
		if (G & 2 && J !== 0) return J & -J;
		if (E.T !== null) {
			var e = ua;
			return e === 0 ? Qu() : e;
		}
		return $e();
	}
	function nu() {
		Ll === 0 && (Ll = !(J & 536870912) || I ? We() : 536870912);
		var e = As.current;
		return e !== null && (e.flags |= 32), Ll;
	}
	function ru(e, t, n) {
		(e === K && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) && (uu(e, 0), su(e, J, Ll, !1)), qe(e, n), (!(G & 2) || e !== K) && (e === K && (!(G & 2) && (Fl |= n), X === 4 && su(e, J, Ll, !1)), Wu(e));
	}
	function iu(e, t, n) {
		if (G & 6) throw Error(i(327));
		var r = !n && !(t & 124) && (t & e.expiredLanes) === 0 || He(e, t), a = r ? _u(e, t) : hu(e, t, !0), o = r;
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
				if ((t & 62914560) === t && (a = Hl + 300 - Ce(), 10 < a)) {
					if (su(r, t, Ll, !Al), Ve(r, 0, !0) !== 0) break a;
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
					if (!wr(a(), i)) return !1;
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
			var a = 31 - Pe(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && Ye(e, n, t);
	}
	function cu() {
		return G & 6 ? !0 : (Gu(0, !1), !1);
	}
	function lu() {
		if (q !== null) {
			if (Y === 0) var e = q.return;
			else e = q, Gi = Wi = null, co(e), xs = null, Ss = 0, e = q;
			for (; e !== null;) Mc(e.alternate, e), e = e.return;
			q = null;
		}
	}
	function uu(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, Nd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), lu(), K = e, q = n = pi(e.current, null), J = t, Y = 0, kl = null, Al = !1, jl = He(e, t), Ml = !1, Rl = Ll = Il = Fl = Pl = X = 0, Bl = zl = null, Vl = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Pe(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Nl = t, ri(), n;
	}
	function du(e, t) {
		L = null, E.H = _s, t === ba || t === Sa ? (t = Oa(), Y = 3) : t === xa ? (t = Oa(), Y = 4) : Y = t === $s ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, kl = t, q === null && (X = 1, qs(e, $r(t, e.current)));
	}
	function fu() {
		var e = E.H;
		return E.H = _s, e === null ? _s : e;
	}
	function pu() {
		var e = E.A;
		return E.A = Dl, e;
	}
	function mu() {
		X = 4, Al || (J & 4194048) !== J && As.current !== null || (jl = !0), !(Pl & 134217727) && !(Fl & 134217727) || K === null || su(K, J, Ll, !1);
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
							As.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, Gi = Wi = null, G = r, E.H = i, E.A = a, q === null && (K = null, J = 0, ri()), o;
	}
	function gu() {
		for (; q !== null;) yu(q);
	}
	function _u(e, t) {
		var n = G;
		G |= 2;
		var r = fu(), a = pu();
		K !== e || J !== t ? (Wl = null, Ul = Ce() + 500, uu(e, t)) : jl = He(e, t);
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
							if (wa(o)) {
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
							wa(o) ? (Y = 0, kl = null, bu(t)) : (Y = 0, kl = null, xu(e, t, o, 7));
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
		return Gi = Wi = null, E.H = r, E.A = a, G = n, q === null ? (K = null, J = 0, ri(), X) : 0;
	}
	function vu() {
		for (; q !== null && !xe();) yu(q);
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
			case 5: co(t);
			default: Mc(n, t), t = q = mi(t, Nl), t = Tc(n, t, Nl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Su(e) : q = t;
	}
	function xu(e, t, n, r) {
		Gi = Wi = null, co(t), xs = null, Ss = 0;
		var i = t.return;
		try {
			if (Qs(e, i, t, n, J)) {
				X = 1, qs(e, $r(n, e.current)), q = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw q = i, t;
			X = 1, qs(e, $r(n, e.current)), q = null;
			return;
		}
		t.flags & 32768 ? (I || r === 1 ? e = !0 : jl || J & 536870912 ? e = !1 : (Al = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = As.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Cu(t, e)) : Su(t);
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
			if (o = t.lanes | t.childLanes, o |= ni, Je(e, n, o, s, c, l), e === K && (q = K = null, J = 0), Jl = t, ql = e, Yl = n, Xl = o, Zl = a, Ql = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Lu(De, function() {
				return Au(!0), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = !!(t.flags & 13878), t.subtreeFlags & 13878 || r) {
				r = E.T, E.T = null, a = D.p, D.p = 2, s = G, G |= 4;
				try {
					Xc(e, t, n);
				} finally {
					G = s, D.p = a, E.T = r;
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
				n = E.T, E.T = null;
				var r = D.p;
				D.p = 2;
				var i = G;
				G |= 4;
				try {
					sl(t, e);
					var a = Td, o = kr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Or(s.ownerDocument.documentElement, s)) {
						if (c !== null && Ar(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Dr(s, h), v = Dr(s, g);
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
					G = i, D.p = r, E.T = n;
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
				n = E.T, E.T = null;
				var r = D.p;
				D.p = 2;
				var i = G;
				G |= 4;
				try {
					Zc(e, t.alternate, t);
				} finally {
					G = i, D.p = r, E.T = n;
				}
			}
			Kl = 3;
		}
	}
	function Du() {
		if (Kl === 4 || Kl === 3) {
			Kl = 0, Se();
			var e = ql, t = Jl, n = Yl, r = Ql;
			t.subtreeFlags & 10256 || t.flags & 10256 ? Kl = 5 : (Kl = 0, Jl = ql = null, Ou(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (Gl = null), Qe(n), t = t.stateNode, Me && typeof Me.onCommitFiberRoot == "function") try {
				Me.onCommitFiberRoot(je, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = E.T, i = D.p, D.p = 2, E.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					E.T = t, D.p = i;
				}
			}
			Yl & 3 && ku(), Wu(e), i = e.pendingLanes, n & 4194090 && i & 42 ? e === eu ? $l++ : ($l = 0, eu = e) : $l = 0, Gu(0, !1);
		}
	}
	function Ou(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, sa(t)));
	}
	function ku(e) {
		return Tu(), Eu(), Du(), Au(e);
	}
	function Au() {
		if (Kl !== 5) return !1;
		var e = ql, t = Xl;
		Xl = 0;
		var n = Qe(Yl), r = E.T, a = D.p;
		try {
			D.p = 32 > n ? 32 : n, E.T = null, n = Zl, Zl = null;
			var o = ql, s = Yl;
			if (Kl = 0, Jl = ql = null, Yl = 0, G & 6) throw Error(i(331));
			var c = G;
			if (G |= 4, wl(o.current), gl(o, o.current, s, n), G = c, Gu(0, !1), Me && typeof Me.onPostCommitFiberRoot == "function") try {
				Me.onPostCommitFiberRoot(je, o);
			} catch {}
			return !0;
		} finally {
			D.p = a, E.T = r, Ou(e, t);
		}
	}
	function ju(e, t, n) {
		t = $r(n, t), t = Ys(e.stateNode, t, 2), e = Pa(e, t, 2), e !== null && (qe(e, 2), Wu(e));
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
					e = $r(n, e), n = Xs(2), r = Pa(t, n, 2), r !== null && (Zs(n, r, t, e), qe(r, 2), Wu(r));
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
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, K === e && (J & n) === n && (X === 4 || X === 3 && (J & 62914560) === J && 300 > Ce() - Hl ? !(G & 2) && uu(e, 0) : Il |= n, Rl === J && (Rl = 0)), Wu(e);
	}
	function Pu(e, t) {
		t === 0 && (t = Ge()), e = oi(e, t), e !== null && (qe(e, t), Wu(e));
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
		return N(e, t);
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
								a = (1 << 31 - Pe(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
							}
							a !== 0 && (n = !0, Xu(r, a));
						} else a = J, a = Ve(r, r === K ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || He(r, a) || (n = !0, Xu(r, a));
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
		for (var t = Ce(), n = null, r = Ru; r !== null;) {
			var i = r.next, a = Ju(r, t);
			a === 0 ? (r.next = null, n === null ? Ru = i : n.next = i, i === null && (zu = n)) : (n = r, (e !== 0 || a & 3) && (Vu = !0)), r = i;
		}
		Gu(e, !1);
	}
	function Ju(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Pe(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ue(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = K, n = J, n = Ve(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Y === 2 || Y === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && be(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || He(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && be(r), Qe(n)) {
				case 2:
				case 8:
					n = Ee;
					break;
				case 32:
					n = De;
					break;
				case 268435456:
					n = P;
					break;
				default: n = De;
			}
			return r = Yu.bind(null, e), n = N(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && be(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function Yu(e, t) {
		if (Kl !== 0 && Kl !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (ku(!0) && e.callbackNode !== n) return null;
		var r = J;
		return r = Ve(e, e === K ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (iu(e, r, t), Ju(e, Ce()), e.callbackNode != null && e.callbackNode === n ? Yu.bind(null, e) : null);
	}
	function Xu(e, t) {
		if (ku()) return null;
		iu(e, t, !0);
	}
	function Zu() {
		Fd(function() {
			G & 6 ? N(Te, Ku) : qu();
		});
	}
	function Qu() {
		return Uu === 0 && (Uu = We()), Uu;
	}
	function $u(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : tn("" + e);
	}
	function ed(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function td(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = $u((i[rt] || null).action), o = r.submitter;
			o && (t = (t = o[rt] || null) ? $u(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Cn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (Uu !== 0) {
								var e = o ? ed(i, o) : new FormData(i);
								rs(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? ed(i, o) : new FormData(i), rs(n, {
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
	for (var nd = 0; nd < Xr.length; nd++) {
		var rd = Xr[nd];
		Zr(rd.toLowerCase(), "on" + (rd[0].toUpperCase() + rd.slice(1)));
	}
	Zr(Hr, "onAnimationEnd"), Zr(Ur, "onAnimationIteration"), Zr(Wr, "onAnimationStart"), Zr("dblclick", "onDoubleClick"), Zr("focusin", "onFocus"), Zr("focusout", "onBlur"), Zr(Gr, "onTransitionRun"), Zr(Kr, "onTransitionStart"), Zr(qr, "onTransitionCancel"), Zr(Jr, "onTransitionEnd"), yt("onMouseEnter", ["mouseout", "mouseover"]), yt("onMouseLeave", ["mouseout", "mouseover"]), yt("onPointerEnter", ["pointerout", "pointerover"]), yt("onPointerLeave", ["pointerout", "pointerover"]), vt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), vt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), vt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), vt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), vt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), vt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
						Us(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Us(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function Q(e, t) {
		var n = t[at];
		n === void 0 && (n = t[at] = /* @__PURE__ */ new Set());
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
			e[cd] = !0, gt.forEach(function(t) {
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
		n = i.bind(null, t, n, e), i = void 0, !fn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (s = dt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		ln(function() {
			var r = a, i = rn(n), s = [];
			a: {
				var c = Yr.get(e);
				if (c !== void 0) {
					var l = Cn, u = e;
					switch (e) {
						case "keypress": if (vn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Vn;
							break;
						case "focusin":
							u = "focus", l = Mn;
							break;
						case "focusout":
							u = "blur", l = Mn;
							break;
						case "beforeblur":
						case "afterblur":
							l = Mn;
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
							l = An;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = jn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Un;
							break;
						case Hr:
						case Ur:
						case Wr:
							l = Nn;
							break;
						case Jr:
							l = Wn;
							break;
						case "scroll":
						case "scrollend":
							l = Tn;
							break;
						case "wheel":
							l = Gn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Pn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Hn;
							break;
						case "toggle":
						case "beforetoggle": l = Kn;
					}
					var d = !!(t & 4), f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = un(m, p), g != null && d.push(fd(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== nn && (u = n.relatedTarget || n.fromElement) && (dt(u) || u[it])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? dt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = An, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Hn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : pt(l), h = u == null ? c : pt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, dt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
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
					if (c = r ? pt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var _ = fr;
					else if (or(c)) {
						if (pr) _ = Sr;
						else {
							_ = br;
							var v = yr;
						}
					} else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Qt(r.elementType) && (_ = fr) : _ = xr;
					if (_ &&= _(e, r)) {
						sr(s, _, n, i);
						break a;
					}
					v && v(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Wt(c, "number", c.value);
				}
				switch (v = r ? pt(r) : window, e) {
					case "focusin":
						(or(v) || v.contentEditable === "true") && (Mr = v, Nr = r, Pr = null);
						break;
					case "focusout":
						Pr = Nr = Mr = null;
						break;
					case "mousedown":
						Fr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Fr = !1, Ir(s, n, i);
						break;
					case "selectionchange": if (jr) break;
					case "keydown":
					case "keyup": Ir(s, n, i);
				}
				var y;
				if (Jn) b: {
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
				else nr ? er(e, n) && (b = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (b = "onCompositionStart");
				b && (Zn && n.locale !== "ko" && (nr || b !== "onCompositionStart" ? b === "onCompositionEnd" && nr && (y = _n()) : (mn = i, hn = "value" in mn ? mn.value : mn.textContent, nr = !0)), v = pd(r, b), 0 < v.length && (b = new Fn(b, e, null, n, i), s.push({
					event: b,
					listeners: v
				}), y ? b.data = y : (y = tr(n), y !== null && (b.data = y)))), (y = Xn ? rr(e, n) : ir(e, n)) && (b = pd(r, "onBeforeInput"), 0 < b.length && (v = new Fn("onBeforeInput", "beforeinput", null, n, i), s.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = un(e, n), i != null && r.unshift(fd(e, i, a)), i = un(e, t), i != null && r.push(fd(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = un(n, a), l != null && o.unshift(fd(n, l, c))) : i || (l = un(n, a), l != null && o.push(fd(n, l, c)))), n = n.return;
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
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Jt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Jt(e, "" + r);
				break;
			case "className":
				Tt(e, "class", r);
				break;
			case "tabIndex":
				Tt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Tt(e, n, r);
				break;
			case "style":
				Zt(e, r, o);
				break;
			case "data": if (t !== "object") {
				Tt(e, "data", r);
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
				r = tn("" + r), e.setAttribute(n, r);
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
				r = tn("" + r), e.setAttribute(n, r);
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
				n = tn("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				Q("beforetoggle", e), Q("toggle", e), wt(e, "popover", r);
				break;
			case "xlinkActuate":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Et(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Et(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Et(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Et(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				wt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = $t.get(n) || n, wt(e, n, r));
		}
	}
	function xd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Zt(e, r, o);
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
				typeof r == "string" ? Jt(e, r) : (typeof r == "number" || typeof r == "bigint") && Jt(e, "" + r);
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
			default: if (!_t.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[rt] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : wt(e, n, r);
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
				Ut(e, o, c, l, u, s, a, !1), Lt(e);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Gt(e, !!r, n, !0) : Gt(e, !!r, t, !1);
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
				qt(e, r, a, o), Lt(e);
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
			default: if (Qt(t)) {
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
				Ht(e, s, c, l, u, d, o, a);
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
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Gt(e, !!n, n ? [] : "", !1) : Gt(e, !!n, t, !0)) : Gt(e, !!n, p, !1);
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
				Kt(e, p, m);
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
			default: if (Qt(t)) {
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
							o[lt] || c === "SCRIPT" || c === "STYLE" || c === "LINK" && o.rel.toLowerCase() === "stylesheet" || n.removeChild(o), o = s;
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
					zd(n), ut(n);
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
			} else if (!e[lt]) switch (t) {
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
		ut(e);
	}
	var Yd = /* @__PURE__ */ new Map(), Xd = /* @__PURE__ */ new Set();
	function Zd(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var Qd = D.d;
	D.d = {
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
		var t = ft(e);
		t !== null && t.tag === 5 && t.type === "form" ? as(t) : Qd.r(e);
	}
	var tf = typeof document > "u" ? null : document;
	function nf(e, t, n) {
		var r = tf;
		if (r && typeof t == "string" && t) {
			var i = Vt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), Xd.has(i) || (Xd.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Sd(t, "link", e), ht(t), r.head.appendChild(t)));
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
			var i = "link[rel=\"preload\"][as=\"" + Vt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Vt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Vt(n.imageSizes) + "\"]")) : i += "[href=\"" + Vt(e) + "\"]";
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
			}, n), Yd.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(pf(a)) || t === "script" && r.querySelector(_f(a)) || (t = r.createElement("link"), Sd(t, "link", e), ht(t), r.head.appendChild(t)));
		}
	}
	function sf(e, t) {
		Qd.m(e, t);
		var n = tf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Vt(r) + "\"][href=\"" + Vt(e) + "\"]", a = i;
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
				r = n.createElement("link"), Sd(r, "link", e), ht(r), n.head.appendChild(r);
			}
		}
	}
	function cf(e, t, n) {
		Qd.S(e, t, n);
		var r = tf;
		if (r && e) {
			var i = mt(r).hoistableStyles, a = ff(e);
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
					ht(c), Sd(c, "link", e), c._p = new Promise(function(e, t) {
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
			var r = mt(n).hoistableScripts, i = gf(e), a = r.get(i);
			a || (a = n.querySelector(_f(i)), a || (e = p({
				src: e,
				async: !0
			}, t), (t = Yd.get(i)) && xf(e, t), a = n.createElement("script"), ht(a), Sd(a, "link", e), n.head.appendChild(a)), a = {
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
			var r = mt(n).hoistableScripts, i = gf(e), a = r.get(i);
			a || (a = n.querySelector(_f(i)), a || (e = p({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = Yd.get(i)) && xf(e, t), a = n.createElement("script"), ht(a), Sd(a, "link", e), n.head.appendChild(a)), a = {
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
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = ff(n.href), n = mt(a).hoistableStyles, r = n.get(t), r || (r = {
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
					var o = mt(a).hoistableStyles, s = o.get(e);
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
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = gf(n), n = mt(a).hoistableScripts, r = n.get(t), r || (r = {
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
		return "href=\"" + Vt(e) + "\"";
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
		}), Sd(t, "link", n), ht(t), e.head.appendChild(t));
	}
	function gf(e) {
		return "[src=\"" + Vt(e) + "\"]";
	}
	function _f(e) {
		return "script[async]" + e;
	}
	function vf(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Vt(n.href) + "\"]");
				if (r) return t.instance = r, ht(r), r;
				var a = p({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), ht(r), Sd(r, "style", a), yf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = ff(n.href);
				var o = e.querySelector(pf(a));
				if (o) return t.state.loading |= 4, t.instance = o, ht(o), o;
				r = mf(n), (a = Yd.get(a)) && bf(r, a), o = (e.ownerDocument || e).createElement("link"), ht(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Sd(o, "link", r), t.state.loading |= 4, yf(o, n.precedence, e), t.instance = o;
			case "script": return o = gf(n.src), (a = e.querySelector(_f(o))) ? (t.instance = a, ht(a), a) : (r = n, (a = Yd.get(o)) && (r = p({}, n), xf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), ht(a), Sd(a, "link", r), e.head.appendChild(a), t.instance = a);
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
			if (!(a[lt] || a[nt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
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
					e = o._p, typeof e == "object" && e && typeof e.then == "function" && (r.count++, r = jf.bind(r), e.then(r, r)), t.state.loading |= 4, t.instance = o, ht(o);
					return;
				}
				o = e.ownerDocument || e, n = mf(n), (a = Yd.get(a)) && bf(n, a), o = o.createElement("link"), ht(o);
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
		_currentValue: ue,
		_currentValue2: ue,
		_threadCount: 0
	};
	function If(e, t, n, r, i, a, o, s) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ke(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ke(0), this.hiddenUpdates = Ke(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = s, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function Lf(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new If(e, t, n, o, s, c, l, d), t = 1, !0 === a && (t |= 24), a = di(3, null, null, t), e.current = a, a.stateNode = e, t = oa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, ja(a), e;
	}
	function Rf(e) {
		return e ? (e = li, e) : li;
	}
	function zf(e, t, n, r, i, a) {
		i = Rf(i), r.context === null ? r.context = i : r.pendingContext = i, r = Na(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Pa(e, r, t), n !== null && (ru(n, e, t), Fa(n, e, t));
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
			var t = oi(e, 67108864);
			t !== null && ru(t, e, 67108864), Vf(e, 67108864);
		}
	}
	var Uf = !0;
	function Wf(e, t, n, r) {
		var i = E.T;
		E.T = null;
		var a = D.p;
		try {
			D.p = 2, Kf(e, t, n, r);
		} finally {
			D.p = a, E.T = i;
		}
	}
	function Gf(e, t, n, r) {
		var i = E.T;
		E.T = null;
		var a = D.p;
		try {
			D.p = 8, Kf(e, t, n, r);
		} finally {
			D.p = a, E.T = i;
		}
	}
	function Kf(e, t, n, r) {
		if (Uf) {
			var i = qf(r);
			if (i === null) dd(e, t, r, Jf, n), ap(e, r);
			else if (sp(i, e, t, n, r)) r.stopPropagation();
			else if (ap(e, r), t & 4 && -1 < ip.indexOf(e)) {
				for (; i !== null;) {
					var a = ft(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Be(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Pe(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									Wu(a), !(G & 6) && (Ul = Ce() + 500, Gu(0, !1));
								}
							}
							break;
						case 13: s = oi(a, 2), s !== null && ru(s, a, 2), cu(), Vf(a, 2);
					}
					if (a = qf(r), a === null && dd(e, t, r, Jf, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else dd(e, t, r, null, n);
		}
	}
	function qf(e) {
		return e = rn(e), Yf(e);
	}
	var Jf = null;
	function Yf(e) {
		if (Jf = null, e = dt(e), e !== null) {
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
			case "message": switch (we()) {
				case Te: return 2;
				case Ee: return 8;
				case De:
				case Oe: return 32;
				case P: return 268435456;
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
		}, t !== null && (t = ft(t), t !== null && Hf(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
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
		var t = dt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, et(e.priority, function() {
							if (n.tag === 13) {
								var e = tu();
								e = Ze(e);
								var t = oi(n, e);
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
				nn = r, n.target.dispatchEvent(r), nn = null;
			} else return t = ft(n), t !== null && Hf(t), e.blockedOn = n, !1;
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
				var a = ft(n);
				a !== null && (e.splice(t, 3), t -= 3, rs(a, {
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
			var i = n[r], a = n[r + 1], o = i[rt] || null;
			if (typeof a == "function") o || mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[rt] || null) s = o.formAction;
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
			zf(e.current, 2, null, e, null, null), cu(), t[it] = null;
		}
	};
	function _p(e) {
		this._internalRoot = e;
	}
	_p.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = $e();
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
	D.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = l(t), e = e === null ? null : d(e), e = e === null ? null : e.stateNode, e;
	};
	var yp = {
		bundleType: 0,
		version: "19.1.1",
		rendererPackageName: "react-dom",
		currentDispatcherRef: E,
		reconcilerVersion: "19.1.1"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var bp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!bp.isDisabled && bp.supportsFiber) try {
			je = bp.inject(yp), Me = bp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Ws, s = Gs, c = Ks, l = null;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError), t.unstable_transitionCallbacks !== void 0 && (l = t.unstable_transitionCallbacks)), t = Lf(e, 1, !1, null, null, n, r, o, s, c, l, null), e[it] = t.current, ld(e), new gp(t);
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
}).format(e / 100), C = (e) => e ? (/* @__PURE__ */ new Date(`${e}T00:00:00`)).toLocaleDateString() : "—", w = (e = "") => String(e).replaceAll("_", " ");
function te(e = "chart_of_accounts") {
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
function ne(e) {
	let t = String(e || "").replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0];
	if (!t.trim()) return [];
	let n = [], r = "", i = !1;
	for (let e = 0; e < t.length; e += 1) {
		let a = t[e];
		a === "\"" ? i && t[e + 1] === "\"" ? (r += "\"", e += 1) : i = !i : a === "," && !i ? (n.push(r.trim()), r = "") : r += a;
	}
	return n.push(r.trim()), n.filter(Boolean);
}
function re(e, t, n = {}) {
	let r = new Map(t.map((e) => [e.toLowerCase().replaceAll(" ", "_"), e]));
	return Object.fromEntries(e.fields.map((e) => [e.key, t.includes(n[e.key]) ? n[e.key] : r.get(e.key.toLowerCase()) || ""]));
}
function ie(e, t) {
	return e.length === t.length && e.every((e, n) => e === t[n]);
}
async function T(e, { method: t = "GET", body: n, idempotent: r = !0, headers: i } = {}) {
	let a = { Accept: "application/json" };
	Object.assign(a, i), n !== void 0 && (a["Content-Type"] = "application/json"), t !== "GET" && ee && (a["X-CSRF-Token"] = ee), t !== "GET" && r && (a["Idempotency-Key"] = crypto.randomUUID());
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
	return s.csrf_token && (ee = s.csrf_token), s;
}
function ae(e, t = []) {
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
var oe = [
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
		"Reports",
		"⌁"
	],
	[
		"administration",
		"Administration",
		"⚙"
	]
];
function se() {
	let [e, t] = (0, _.useState)(null), [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)(!0);
	return (0, _.useEffect)(() => {
		T("/api/auth/me").then(t).catch(async (e) => {
			if (e.status !== 401) throw e;
			r((await T("/setup/status")).needs_setup);
		}).finally(() => a(!1));
	}, []), i ? /* @__PURE__ */ (0, b.jsx)(Ce, {
		title: "Opening Folio",
		detail: "Checking your secure session…"
	}) : e ? /* @__PURE__ */ (0, b.jsx)(le, {
		auth: e,
		setAuth: t
	}) : /* @__PURE__ */ (0, b.jsx)(ce, {
		needsSetup: n,
		onAuthenticated: (e) => t(e)
	});
}
function ce({ needsSetup: e, onAuthenticated: t }) {
	let [n, r] = (0, _.useState)(!1), [i, a] = (0, _.useState)("");
	async function o(n) {
		n.preventDefault();
		let i = new FormData(n.currentTarget);
		r(!0), a("");
		try {
			t(await T(e ? "/api/auth/register" : "/api/auth/login", {
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
				/* @__PURE__ */ (0, b.jsx)(_e, {}),
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
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Organization",
								name: "organization_name",
								autoComplete: "organization"
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Your name",
								name: "name",
								autoComplete: "name"
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Deployment bootstrap token",
								name: "bootstrap_token",
								type: "password",
								autoComplete: "off",
								required: !1,
								hint: "Provided by the person who deployed Folio. Local development may leave this blank."
							})
						] }),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Email",
							name: "email",
							type: "email",
							autoComplete: "email"
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Password",
							name: "password",
							type: "password",
							minLength: 12,
							autoComplete: e ? "new-password" : "current-password",
							hint: e ? "At least 12 characters with upper/lowercase and a number." : ""
						}),
						i && /* @__PURE__ */ (0, b.jsx)(Te, { children: i }),
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
function le({ auth: e, setAuth: t }) {
	let [n, r] = (0, _.useState)("overview"), [i, a] = (0, _.useState)(null), o = oe.find(([e]) => e === n), s = (t) => e.permissions.includes(t);
	async function c() {
		await T("/api/auth/logout", {
			method: "POST",
			idempotent: !1
		}), ee = "", t(null);
	}
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "app-shell",
		children: [/* @__PURE__ */ (0, b.jsxs)("aside", {
			className: "sidebar",
			children: [
				/* @__PURE__ */ (0, b.jsx)(_e, {}),
				/* @__PURE__ */ (0, b.jsxs)("div", {
					className: "workspace-card",
					children: [/* @__PURE__ */ (0, b.jsx)("span", {
						className: "workspace-avatar",
						children: e.organization.name.slice(0, 1).toUpperCase()
					}), /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: e.organization.name }), /* @__PURE__ */ (0, b.jsx)("small", { children: "USD · Accrual" })] })]
				}),
				/* @__PURE__ */ (0, b.jsx)("nav", {
					"aria-label": "Accounting modules",
					children: oe.map(([e, t, i]) => /* @__PURE__ */ (0, b.jsxs)("button", {
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
				i && /* @__PURE__ */ (0, b.jsx)(Ee, {
					notice: i,
					onClose: () => a(null)
				}),
				/* @__PURE__ */ (0, b.jsx)(E, {
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
function E({ active: e, ...t }) {
	let n = {
		overview: de,
		journals: fe,
		revenue: pe,
		receivables: O,
		"bank-close": k,
		integrations: D,
		imports: ue,
		investments: me,
		"fixed-assets": A,
		reports: he,
		administration: ge
	}[e];
	return /* @__PURE__ */ (0, b.jsx)(n, { ...t });
}
function D({ can: e, notify: t }) {
	let n = ae(() => T("/api/integrations/overview"), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: n.error,
		retry: n.refresh
	});
	let a = n.data;
	async function o(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget);
		try {
			await T("/api/integrations/connections", {
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
			await T("/api/integrations/connections/status", {
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
			await T("/api/integrations/exceptions/status", {
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
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
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Connections",
						value: a.connections.length,
						detail: "Configured providers"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Active",
						value: a.metrics.active_connections,
						detail: "Eligible to synchronize"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Provider errors",
						value: a.metrics.error_connections,
						detail: "Connections needing attention",
						warning: a.metrics.error_connections > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Exceptions",
						value: a.metrics.open_exceptions,
						detail: "Open connector failures",
						warning: a.metrics.open_exceptions > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsx)(M, {
					title: "Connections",
					subtitle: "Status, environment and latest successful synchronization",
					children: /* @__PURE__ */ (0, b.jsx)(ye, {
						columns: [
							"Provider",
							"Connection",
							"Environment",
							"Last sync",
							"Status",
							"Action"
						],
						rows: a.connections.map((t) => [
							w(t.provider),
							t.display_name,
							w(t.environment),
							t.last_synced_at ? new Date(t.last_synced_at).toLocaleString() : "Never",
							/* @__PURE__ */ (0, b.jsx)(N, { value: t.status }),
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
				}), /* @__PURE__ */ (0, b.jsx)(M, {
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
									w(e.domain),
									" · ",
									e.capabilities.length,
									" capabilities"
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(N, { value: "available" })
							]
						}, e.provider))
					})
				})]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Synchronization history",
				subtitle: "Cursors, pages and idempotent source-record outcomes",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
						w(e.trigger),
						e.added,
						e.modified,
						e.removed,
						/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Integration exception queue",
				subtitle: "Provider failures remain visible until an authorized operator records a disposition",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
						/* @__PURE__ */ (0, b.jsx)(N, { value: t.status }),
						t.status === "open" && e("operate") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => c(t),
							children: "Resolve"
						}) : "—"
					])
				})
			}),
			r && /* @__PURE__ */ (0, b.jsx)(De, {
				title: "Configure connector",
				subtitle: "Enter secret-manager reference names only. Tokens and client secrets never belong in this form.",
				close: () => i(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: o,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Provider",
								name: "provider",
								as: "select",
								options: a.catalog.map((e) => [e.provider, e.name])
							}), /* @__PURE__ */ (0, b.jsx)(P, {
								label: "Environment",
								name: "environment",
								as: "select",
								options: [["sandbox", "Sandbox"], ["production", "Production"]]
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Connection name",
							name: "display_name"
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "External account ID",
							name: "external_account_id",
							required: !1,
							hint: "Required for production; use the provider's tenant, account or company identifier."
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Credential secret reference",
								name: "credential_secret_ref",
								placeholder: "STRIPE_OAUTH_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							}), /* @__PURE__ */ (0, b.jsx)(P, {
								label: "Webhook secret reference",
								name: "webhook_secret_ref",
								required: !1,
								placeholder: "STRIPE_WEBHOOK_CONNECTION_01",
								pattern: "[A-Z][A-Z0-9_]{2,79}"
							})]
						}),
						/* @__PURE__ */ (0, b.jsx)(Oe, {
							close: () => i(!1),
							label: "Save configuration"
						})
					]
				})
			})
		]
	});
}
function ue({ can: e, notify: t }) {
	let [n, r] = (0, _.useState)("open"), [i, a] = (0, _.useState)(1), o = ae(() => Promise.all([
		T("/api/imports/templates"),
		T("/api/imports/batches"),
		T("/api/accounts"),
		T("/api/imports/mapping-profiles"),
		T("/api/imports/duplicate-policies")
	]), []), s = ae(() => T(`/api/imports/exceptions?status=${encodeURIComponent(n)}&page=${i}&page_size=20`), [n, i]), [c, l] = (0, _.useState)(!1), [u, d] = (0, _.useState)(1), [f, p] = (0, _.useState)(te()), [m, h] = (0, _.useState)(null), [g, v] = (0, _.useState)(!1), [y, ee] = (0, _.useState)(""), [x, S] = (0, _.useState)(!1), [C, oe] = (0, _.useState)({
		template_key: "customers",
		field_key: "name",
		threshold_percent: "88",
		active: !0
	}), [se, ce] = (0, _.useState)(null), [le, E] = (0, _.useState)("");
	if (o.loading || s.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (o.error || s.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: o.error || s.error,
		retry: () => Promise.all([o.refresh(), s.refresh()])
	});
	let [D, ue, de, fe, pe] = o.data, { items: O, page: k, open_total: me } = s.data, A = D.find((e) => e.key === f.template_key) || D[0], he = fe.find((e) => e.id === f.mapping_profile_id), ge = ne(f.csv), _e = A.fields.filter((e) => e.required).every((e) => f.mapping[e.key]), xe = ue.filter((e) => `${e.filename} ${e.template_key} ${e.status}`.toLowerCase().includes(y.trim().toLowerCase())), Ce = m?.mapping_profile_id ? fe.find((e) => e.id === m.mapping_profile_id) : null, Ee = (D.find((e) => e.key === C.template_key) || D[0]).fields.filter((e) => e.type === "string");
	function ke() {
		p(te()), d(1), l(!0);
	}
	function Ae(e) {
		p((t) => ({
			...t,
			...e
		}));
	}
	function je(e) {
		p(te(e));
	}
	function Me(e = "customers") {
		let t = D.find((t) => t.key === e) || D[0], n = pe.find((e) => e.template_key === t.key), r = t.fields.filter((e) => e.type === "string");
		oe({
			template_key: t.key,
			field_key: n?.field_key || r[0]?.key || "",
			threshold_percent: String(n?.threshold_percent || 88),
			active: n?.active ?? !0
		}), S(!0);
	}
	async function Ne(e) {
		e.preventDefault(), v(!0);
		try {
			let e = await T("/api/imports/duplicate-policies", {
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
	async function Pe(e) {
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
		Ae({
			filename: n.name,
			csv: r,
			mapping: ie(ge, ne(r)) ? f.mapping : {}
		});
	}
	function Fe() {
		let e = new Blob([`${A.sample_header}\n`], { type: "text/csv;charset=utf-8" }), t = URL.createObjectURL(e), n = document.createElement("a");
		n.href = t, n.download = `${A.key}-v${A.version}-template.csv`, document.body.append(n), n.click(), n.remove(), URL.revokeObjectURL(t);
	}
	function Ie() {
		if (!f.filename.trim() || !f.csv.trim()) {
			t({
				kind: "error",
				message: "Choose a CSV file or paste CSV data first."
			});
			return;
		}
		if (!ge.length) {
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
		Ae({ mapping: re(A, ge, f.mapping) }), d(2);
	}
	function Le(e) {
		let t = fe.find((t) => t.id === e);
		Ae({
			mapping_profile_id: t?.id || "",
			mapping: t ? re(A, ge, t.mapping) : re(A, ge, f.mapping)
		});
	}
	async function Re(e) {
		if (e.preventDefault(), u === 3) {
			v(!0);
			try {
				let e = f.template_key === "bank_transactions" ? {
					cash_account_id: Number(f.cash_account_id),
					start_date: f.start_date,
					end_date: f.end_date,
					opening_cents: Math.round(Number(f.opening) * 100),
					closing_cents: Math.round(Number(f.closing) * 100)
				} : {}, n = await T("/api/imports/stage", {
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
				}), r = !1, i = "";
				if (f.mapping_profile_name.trim()) try {
					await T("/api/imports/mapping-profiles", {
						method: "POST",
						body: {
							name: f.mapping_profile_name,
							template_key: f.template_key,
							mapping: f.mapping
						}
					}), r = !0;
				} catch (e) {
					i = e.message;
				}
				h(n), l(!1), await Promise.all([o.refresh(), s.refresh()]), t({
					kind: i ? "error" : "success",
					message: i ? `Import staged, but the optional mapping profile was not saved: ${i}` : `Import validated and staged for review${r ? "; mapping profile saved" : ""}.`
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
	async function ze(e, n = 1) {
		try {
			h(await T(`/api/imports/batches/${e}?page=${n}&page_size=100`));
		} catch (e) {
			t({
				kind: "error",
				message: e.message
			});
		}
	}
	async function Be() {
		v(!0);
		try {
			let e = await T(`/api/imports/batches/${m.id}/correction-source`);
			p({
				...te(e.template_key),
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
	async function Ve() {
		v(!0);
		try {
			let e = m.error_count > 0 || m.duplicate_count > 0;
			await T(`/api/imports/batches/${m.id}/approve`, {
				method: "POST",
				body: { apply_valid_rows: e }
			});
			let n = await T(`/api/imports/batches/${m.id}/apply`, {
				method: "POST",
				body: {}
			});
			h(n), await Promise.all([o.refresh(), s.refresh()]), t({
				kind: "success",
				message: `${n.applied_count} validated rows applied with retained lineage.`
			});
		} catch (e) {
			try {
				let e = await T(`/api/imports/batches/${m.id}?page=1&page_size=100`);
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
	async function He(e) {
		try {
			await T("/api/imports/exceptions/status", {
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
	async function Ue(e) {
		e.preventDefault(), v(!0);
		try {
			let e = await T(`/api/imports/exceptions/${se.id}/accept-distinct`, {
				method: "POST",
				body: { resolution: le }
			});
			m?.id === e.batch.id && h(e.batch), await Promise.all([o.refresh(), s.refresh()]), ce(null), E(""), t({
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
				title: "Controlled imports",
				detail: "Versioned templates, validation previews, duplicate controls and traceable application",
				action: (e("operate") || e("admin")) && /* @__PURE__ */ (0, b.jsxs)("div", {
					className: "button-row",
					children: [e("admin") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "secondary",
						onClick: () => Me(),
						children: "Matching policies"
					}), e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
						className: "primary",
						onClick: ke,
						children: "New import"
					})]
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Templates",
						value: D.length,
						detail: "Versioned entity formats"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Staged",
						value: ue.filter((e) => e.status === "staged").length,
						detail: "Awaiting approval"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Applied rows",
						value: ue.reduce((e, t) => e + t.applied_count, 0),
						detail: "With entity lineage"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Open exceptions",
						value: me,
						detail: "Validation or apply issues",
						warning: me > 0
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Duplicate candidate controls",
				subtitle: "Versioned tenant policies compare normalized text without auto-merging records",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
					rows: pe.map((t) => [
						w(t.template_key),
						w(t.field_key),
						`${t.threshold_percent}% · v${t.version}`,
						t.indexed_rows,
						/* @__PURE__ */ (0, b.jsx)(N, { value: t.active ? "active" : "disabled" }),
						e("admin") ? /* @__PURE__ */ (0, b.jsx)("button", {
							className: "small-button",
							onClick: () => Me(t.template_key),
							children: "Configure"
						}) : "—"
					])
				})
			}),
			/* @__PURE__ */ (0, b.jsxs)("div", {
				className: "two-column",
				children: [/* @__PURE__ */ (0, b.jsxs)(M, {
					title: "Import batches",
					subtitle: "Files remain staged until an operator reviews the preview",
					children: [/* @__PURE__ */ (0, b.jsxs)("div", {
						className: "workflow-toolbar",
						children: [/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Find a batch",
							type: "search",
							value: y,
							onChange: (e) => ee(e.target.value),
							placeholder: "Filename, template or status",
							required: !1
						}), /* @__PURE__ */ (0, b.jsxs)("span", { children: [xe.length, " shown"] })]
					}), /* @__PURE__ */ (0, b.jsx)(ye, {
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
							/* @__PURE__ */ (0, b.jsx)(N, { value: e.status }),
							/* @__PURE__ */ (0, b.jsx)("button", {
								className: "small-button",
								onClick: () => ze(e.id),
								children: "Review"
							})
						])
					})]
				}), /* @__PURE__ */ (0, b.jsxs)(M, {
					title: "Exception queue",
					subtitle: "Warnings and blocking rows require an explicit disposition",
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "workflow-toolbar",
							children: [/* @__PURE__ */ (0, b.jsx)(P, {
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
							}), /* @__PURE__ */ (0, b.jsx)("span", { children: k.total ? `${k.from}–${k.to} of ${k.total}` : "Queue clear" })]
						}),
						/* @__PURE__ */ (0, b.jsx)(ye, {
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
							rows: O.map((t) => [
								w(t.code),
								/* @__PURE__ */ (0, b.jsx)(N, { value: t.severity }),
								t.message,
								/* @__PURE__ */ (0, b.jsx)(N, { value: t.status }),
								t.resolution ? `${t.resolution} · ${t.owner || "reviewer"}` : "—",
								t.status === "open" && e("operate") ? t.code === "FUZZY_DUPLICATE" ? /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => {
										ce(t), E("");
									},
									children: "Compare"
								}) : /* @__PURE__ */ (0, b.jsx)("button", {
									className: "small-button",
									onClick: () => He(t),
									children: "Resolve"
								}) : "—"
							])
						}),
						k.total_pages > 1 && /* @__PURE__ */ (0, b.jsxs)("nav", {
							className: "table-pagination",
							"aria-label": "Import exception pages",
							children: [
								/* @__PURE__ */ (0, b.jsx)("button", {
									className: "secondary",
									disabled: k.page === 1,
									onClick: () => a((e) => e - 1),
									children: "Previous"
								}),
								/* @__PURE__ */ (0, b.jsxs)("span", {
									"aria-live": "polite",
									children: [
										"Page ",
										k.page,
										" of ",
										k.total_pages
									]
								}),
								/* @__PURE__ */ (0, b.jsx)("button", {
									className: "secondary",
									disabled: k.page === k.total_pages,
									onClick: () => a((e) => e + 1),
									children: "Next"
								})
							]
						})
					]
				})]
			}),
			m && /* @__PURE__ */ (0, b.jsxs)(M, {
				title: `Review ${m.filename}`,
				subtitle: `SHA-256 ${m.file_sha256.slice(0, 16)}… · template v${m.template_version}`,
				children: [
					/* @__PURE__ */ (0, b.jsxs)("div", {
						className: "review-strip",
						children: [/* @__PURE__ */ (0, b.jsx)(be, { items: [
							["Rows", m.row_count],
							["Valid", m.valid_count],
							["Errors", m.error_count],
							["Duplicates", m.duplicate_count],
							["Candidate policy", m.duplicate_policy ? `${w(m.duplicate_policy.field_key)} · ${m.duplicate_policy.threshold_percent}% · v${m.duplicate_policy.version}` : "Exact natural keys only"],
							["Mapping", Ce ? `${Ce.name} · v${m.mapping_profile_version}` : "Exact batch snapshot"],
							["Correction lineage", m.restaged_from_batch_id ? `Restaged from ${m.restaged_from_batch_id.slice(0, 8)}…` : "Original source batch"],
							["Status", /* @__PURE__ */ (0, b.jsx)(N, { value: m.status })]
						] }), /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "button-row",
							children: [(m.error_count > 0 || m.duplicate_count > 0 || m.status === "failed") && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
								className: "secondary",
								disabled: g,
								onClick: Be,
								children: "Correct and restage"
							}), m.status === "staged" && e("operate") && /* @__PURE__ */ (0, b.jsx)("button", {
								className: "primary",
								disabled: g || !m.valid_count,
								onClick: Ve,
								children: g ? "Applying…" : m.error_count || m.duplicate_count ? "Apply valid rows only" : "Approve and apply"
							})]
						})]
					}),
					/* @__PURE__ */ (0, b.jsx)(ye, {
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
							/* @__PURE__ */ (0, b.jsx)(N, { value: e.status }),
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
								onClick: () => ze(m.id, m.row_page.page - 1),
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
								onClick: () => ze(m.id, m.row_page.page + 1),
								children: "Next 100"
							})
						]
					})
				]
			}),
			x && /* @__PURE__ */ (0, b.jsx)(De, {
				title: "Duplicate candidate policy",
				subtitle: "Choose one text field and a review threshold. Changes are versioned and rebuild the applied-import index.",
				close: () => S(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ne,
					children: [
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Import template",
							as: "select",
							value: C.template_key,
							onChange: (e) => {
								let t = D.find((t) => t.key === e.target.value), n = pe.find((t) => t.template_key === e.target.value), r = t.fields.filter((e) => e.type === "string");
								oe({
									template_key: t.key,
									field_key: n?.field_key || r[0]?.key || "",
									threshold_percent: String(n?.threshold_percent || 88),
									active: n?.active ?? !0
								});
							},
							options: D.filter((e) => e.fields.some((e) => e.type === "string")).map((e) => [e.key, e.name])
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Text field to compare",
							as: "select",
							value: C.field_key,
							onChange: (e) => oe((t) => ({
								...t,
								field_key: e.target.value
							})),
							options: Ee.map((e) => [e.key, e.label])
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Similarity threshold",
							type: "number",
							min: "70",
							max: "99",
							value: C.threshold_percent,
							onChange: (e) => oe((t) => ({
								...t,
								threshold_percent: e.target.value
							})),
							hint: "70–99%. Lower values surface more candidates for human review."
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Policy status",
							as: "select",
							value: C.active ? "active" : "disabled",
							onChange: (e) => oe((t) => ({
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
						/* @__PURE__ */ (0, b.jsx)(Oe, {
							close: () => S(!1),
							label: g ? "Saving…" : "Save policy"
						})
					]
				})
			}),
			se && /* @__PURE__ */ (0, b.jsx)(De, {
				title: "Compare duplicate candidate",
				subtitle: se.message,
				close: () => ce(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Ue,
					children: [
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "review-notice",
							role: "note",
							children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: "No automatic merge" }), /* @__PURE__ */ (0, b.jsx)("span", { children: "Accepting makes this row eligible for the batch. The similarity evidence, policy version, reviewer and rationale remain attached to the import history." })]
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Reviewer rationale",
							as: "textarea",
							minLength: "8",
							maxLength: "500",
							value: le,
							onChange: (e) => E(e.target.value),
							hint: "Describe the source evidence that proves these are separate records."
						}),
						/* @__PURE__ */ (0, b.jsx)(Oe, {
							close: () => ce(null),
							label: g ? "Recording…" : "Accept as distinct"
						})
					]
				})
			}),
			c && /* @__PURE__ */ (0, b.jsx)(De, {
				title: "New controlled import",
				subtitle: "Choose the source, map its columns, then review before server validation. Nothing posts automatically.",
				close: () => l(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: Re,
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
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Import template",
								as: "select",
								value: f.template_key,
								onChange: (e) => je(e.target.value),
								options: D.map((e) => [e.key, `${e.name} · version ${e.version}`])
							}),
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "template-download",
								children: [/* @__PURE__ */ (0, b.jsxs)("button", {
									type: "button",
									className: "secondary",
									onClick: Fe,
									children: [
										"Download blank ",
										A.name.toLowerCase(),
										" template"
									]
								}), /* @__PURE__ */ (0, b.jsxs)("span", { children: [
									"CSV headers match template version ",
									A.version,
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
										onChange: Pe
									}),
									/* @__PURE__ */ (0, b.jsx)("strong", { children: f.csv ? "Replace CSV file" : "Choose CSV file" }),
									/* @__PURE__ */ (0, b.jsx)("span", { children: "Up to 5 MB and 10,000 data rows. The file stays tenant-scoped." })
								]
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Source filename",
								value: f.filename,
								onChange: (e) => Ae({ filename: e.target.value }),
								placeholder: `${f.template_key}.csv`
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "CSV data",
								as: "textarea",
								value: f.csv,
								onChange: (e) => {
									let t = e.target.value;
									Ae({
										csv: t,
										mapping: ie(ge, ne(t)) ? f.mapping : {}
									});
								},
								placeholder: `${A.sample_header}\n`,
								hint: `Choose a file above or paste its contents. Expected fields: ${A.fields.map((e) => e.key).join(", ")}.`
							}),
							f.template_key === "bank_transactions" && /* @__PURE__ */ (0, b.jsxs)("div", {
								className: "source-options",
								"aria-label": "Bank statement details",
								children: [
									/* @__PURE__ */ (0, b.jsx)("h3", { children: "Statement control totals" }),
									/* @__PURE__ */ (0, b.jsx)(P, {
										label: "Cash account",
										as: "select",
										value: f.cash_account_id,
										onChange: (e) => Ae({ cash_account_id: e.target.value }),
										options: [["", "Select a cash account"], ...de.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])]
									}),
									/* @__PURE__ */ (0, b.jsxs)("div", {
										className: "form-grid",
										children: [
											/* @__PURE__ */ (0, b.jsx)(P, {
												label: "Statement start",
												type: "date",
												value: f.start_date,
												onChange: (e) => Ae({ start_date: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(P, {
												label: "Statement end",
												type: "date",
												value: f.end_date,
												onChange: (e) => Ae({ end_date: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(P, {
												label: "Opening balance",
												type: "number",
												step: "0.01",
												value: f.opening,
												onChange: (e) => Ae({ opening: e.target.value })
											}),
											/* @__PURE__ */ (0, b.jsx)(P, {
												label: "Closing balance",
												type: "number",
												step: "0.01",
												value: f.closing,
												onChange: (e) => Ae({ closing: e.target.value })
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
									onClick: Ie,
									children: "Map columns"
								})]
							})
						] }),
						u === 2 && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsxs)("div", {
								className: "source-summary",
								children: [
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Source" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: f.filename })] }),
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Detected columns" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: ge.length })] }),
									/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("span", { children: "Target" }), /* @__PURE__ */ (0, b.jsx)("strong", { children: A.name })] })
								]
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Use a saved mapping",
								as: "select",
								required: !1,
								defaultValue: "",
								onChange: (e) => Le(e.target.value),
								options: [["", "Automatic exact-name mapping"], ...fe.filter((e) => e.template_key === f.template_key).map((e) => [e.id, `${e.name} · version ${e.version}`])],
								hint: "Profiles are tenant-scoped and retain their template version."
							}),
							/* @__PURE__ */ (0, b.jsx)("div", {
								className: "mapping-list",
								role: "group",
								"aria-label": "Column mappings",
								children: A.fields.map((e) => /* @__PURE__ */ (0, b.jsxs)("div", {
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
										/* @__PURE__ */ (0, b.jsx)(P, {
											label: `Source column for ${e.label}`,
											as: "select",
											required: e.required,
											value: f.mapping[e.key] || "",
											onChange: (t) => Ae({
												mapping_profile_id: "",
												mapping: {
													...f.mapping,
													[e.key]: t.target.value
												}
											}),
											options: [["", e.required ? "Select a source column" : "Not mapped"], ...ge.map((e) => [e, e])]
										})
									]
								}, e.key))
							}),
							e("admin") && /* @__PURE__ */ (0, b.jsx)(P, {
								label: "Save this mapping for reuse",
								value: f.mapping_profile_name,
								onChange: (e) => Ae({ mapping_profile_name: e.target.value }),
								required: !1,
								placeholder: "Optional profile name",
								hint: "Saved only after this file passes server validation."
							}),
							!_e && /* @__PURE__ */ (0, b.jsx)(Te, { children: "Map every required target field before continuing." }),
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
									disabled: !_e,
									onClick: () => d(3),
									children: "Review import"
								})]
							})
						] }),
						u === 3 && /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
							/* @__PURE__ */ (0, b.jsx)("div", {
								className: "review-card",
								children: /* @__PURE__ */ (0, b.jsx)(be, { items: [
									["Source file", f.filename],
									["Template", `${A.name} · v${A.version}`],
									["Detected columns", ge.length],
									["Mapped fields", Object.values(f.mapping).filter(Boolean).length],
									["Correction source", f.restaged_from_batch_id ? `${f.correction_source_filename} · ${f.correction_row_count} rows` : "Original source batch"],
									["Mapping lineage", he ? `${he.name} · v${he.version}` : "Exact batch snapshot"],
									["Saved profile", f.mapping_profile_name || "Not requested"]
								] })
							}),
							/* @__PURE__ */ (0, b.jsx)(ye, {
								caption: "Import mapping review",
								columns: [
									"Target field",
									"Source column",
									"Requirement"
								],
								rows: A.fields.map((e) => [
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
function de() {
	let e = ae(() => Promise.all([T("/api/dashboard"), T("/api/reconciliation-exceptions")]), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(we, {
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
				/* @__PURE__ */ (0, b.jsx)(j, {
					label: "Cash",
					value: S(t.cash_cents),
					detail: "Posted cash balance"
				}),
				/* @__PURE__ */ (0, b.jsx)(j, {
					label: "Revenue",
					value: S(t.revenue_cents),
					detail: "Posted revenue"
				}),
				/* @__PURE__ */ (0, b.jsx)(j, {
					label: "Net income",
					value: S(t.net_income_cents),
					detail: "Current ledger"
				}),
				/* @__PURE__ */ (0, b.jsx)(j, {
					label: "Drafts",
					value: t.drafts,
					detail: "Awaiting approval",
					warning: t.drafts > 0
				})
			]
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Monthly performance",
				subtitle: "Revenue and expense activity by posting month",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
			}), /* @__PURE__ */ (0, b.jsx)(M, {
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
							/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
						]
					}, e.id))
				}) : /* @__PURE__ */ (0, b.jsx)(xe, {
					title: "Everything reconciles",
					detail: "No unresolved reconciliation exceptions."
				})
			})]
		})]
	});
}
function fe({ can: e, notify: t }) {
	let n = ae(() => Promise.all([T("/api/journals"), T("/api/accounts")]), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: n.error,
		retry: n.refresh
	});
	let [a, o] = n.data;
	async function s(e) {
		e.preventDefault();
		let r = new FormData(e.currentTarget), a = Math.round(Number(r.get("amount")) * 100);
		try {
			await T("/api/journals", {
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
			await T(`/api/journals/${e}/post`, { method: "POST" }), await n.refresh(), t({
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
				title: "Journal register",
				detail: `${a.length} entries with controlled approval and posting`,
				action: e("draft") && /* @__PURE__ */ (0, b.jsx)("button", {
					className: "primary",
					onClick: () => i(!0),
					children: "New journal"
				})
			}),
			/* @__PURE__ */ (0, b.jsx)(M, { children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
					/* @__PURE__ */ (0, b.jsx)(N, { value: t.status }),
					t.status === "draft" && e("post") ? /* @__PURE__ */ (0, b.jsx)("button", {
						className: "small-button",
						onClick: () => c(t.id),
						children: "Post"
					}) : "—"
				])
			}) }),
			r && /* @__PURE__ */ (0, b.jsx)(De, {
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
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Entry date",
									name: "date",
									type: "date",
									defaultValue: x
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Debit account",
									name: "debit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Credit account",
									name: "credit_account",
									as: "select",
									options: o.map((e) => [e.id, `${e.code} · ${e.name}`])
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Memo",
							name: "memo",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Line description",
							name: "description",
							maxLength: 240
						}),
						/* @__PURE__ */ (0, b.jsx)(Oe, {
							close: () => i(!1),
							label: "Save draft"
						})
					]
				})
			})
		]
	});
}
function pe({ can: e, notify: t }) {
	let n = ae(() => T("/api/saas/overview"), []);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: n.error,
		retry: n.refresh
	});
	let r = n.data;
	async function i() {
		try {
			let e = await T("/api/revenue/recognize", {
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
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
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Contracts",
						value: r.contracts.length,
						detail: "Customer arrangements"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Schedules",
						value: r.schedules.length,
						detail: "Recognition periods"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Invoices",
						value: r.invoices.length,
						detail: "Billing records"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "RPO",
						value: S(r.rpo_cents || 0),
						detail: "Remaining obligations"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Contracts",
				subtitle: "Signed arrangements and allocated transaction price",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
function O({ can: e, notify: t }) {
	let n = ae(() => Promise.all([T("/api/receivables"), T("/api/saas/overview")]), []), [r, i] = (0, _.useState)(null);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(we, {
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
			await T(s, {
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
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
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Open AR",
						value: S(a.aging.total_cents),
						detail: `${s.length} open invoices`
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Overdue",
						value: S(a.aging.overdue_cents),
						detail: "Past due balance",
						warning: a.aging.overdue_cents > 0
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Disputed",
						value: S(a.aging.disputed_cents),
						detail: "Active disputes"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "GL difference",
						value: S(a.reconciliation.ar_difference_cents),
						detail: a.reconciliation.balanced ? "Subledger agrees" : "Requires resolution",
						warning: !a.reconciliation.balanced
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Invoice aging",
				subtitle: "Outstanding customer invoices and application status",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
						/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
					])
				})
			}),
			r && /* @__PURE__ */ (0, b.jsx)(De, {
				title: r === "invoice" ? "Create customer invoice" : "Record customer payment",
				subtitle: "The resulting accounting entry retains this workflow's audit lineage.",
				close: () => i(null),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: c,
					children: [r === "invoice" ? /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)(P, {
						label: "Contract",
						name: "contract_id",
						as: "select",
						options: o.contracts.map((e) => [e.id, `${e.contract_number} · ${e.customer_name}`])
					}), /* @__PURE__ */ (0, b.jsxs)("div", {
						className: "form-grid",
						children: [
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Invoice number",
								name: "number",
								defaultValue: `INV-${Date.now().toString().slice(-6)}`
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Amount",
								name: "amount",
								type: "number",
								min: "0.01",
								step: "0.01"
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Invoice date",
								name: "date",
								type: "date",
								defaultValue: x
							}),
							/* @__PURE__ */ (0, b.jsx)(P, {
								label: "Due date",
								name: "due_date",
								type: "date",
								defaultValue: x
							})
						]
					})] }) : /* @__PURE__ */ (0, b.jsxs)(b.Fragment, { children: [
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Customer",
							name: "customer_id",
							as: "select",
							options: o.customers.map((e) => [e.id, e.name])
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Apply to invoice (optional)",
							name: "invoice_id",
							as: "select",
							required: !1,
							options: [["", "Leave unapplied"], ...s.map((e) => [e.id, `${e.invoice_number} · ${S(e.balance_cents)}`])]
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Payment number",
									name: "number",
									defaultValue: `PAY-${Date.now().toString().slice(-6)}`
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Amount",
									name: "amount",
									type: "number",
									min: "0.01",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Received date",
									name: "date",
									type: "date",
									defaultValue: x
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
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
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Bank reference",
							name: "reference",
							required: !1
						})
					] }), /* @__PURE__ */ (0, b.jsx)(Oe, {
						close: () => i(null),
						label: "Post and save"
					})]
				})
			})
		]
	});
}
function k({ can: e, notify: t }) {
	let n = ae(() => Promise.all([
		T("/api/bank-statements"),
		T("/api/reconciliation-exceptions"),
		T("/api/accounts")
	]), []), [r, i] = (0, _.useState)(!1);
	if (n.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (n.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: n.error,
		retry: n.refresh
	});
	let [a, o, s] = n.data;
	async function c(e, r) {
		try {
			await T(`/api/reconciliation-exceptions/${e.id}`, {
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
			await T("/api/bank-statements/import", {
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
			/* @__PURE__ */ (0, b.jsx)(ve, {
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
				children: [/* @__PURE__ */ (0, b.jsx)(M, {
					title: "Bank statements",
					subtitle: "Imported statements and match status",
					children: /* @__PURE__ */ (0, b.jsx)(ye, {
						columns: [
							"Period",
							"Closing",
							"Transactions",
							"Unmatched",
							"Status"
						],
						rows: a.map((e) => [
							`${C(e.start_date)} – ${C(e.end_date)}`,
							S(e.closing_cents),
							e.transaction_count,
							e.unmatched_count,
							/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
						])
					})
				}), /* @__PURE__ */ (0, b.jsx)(M, {
					title: "Exception queue",
					subtitle: "Resolve material differences before close",
					children: o.length ? /* @__PURE__ */ (0, b.jsx)("div", {
						className: "attention-list",
						children: o.map((t) => /* @__PURE__ */ (0, b.jsxs)("div", {
							className: "attention exception",
							children: [
								/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("strong", { children: w(t.kind) }), /* @__PURE__ */ (0, b.jsxs)("small", { children: [
									t.reference,
									" · ",
									S(t.amount_cents)
								] })] }),
								/* @__PURE__ */ (0, b.jsx)(N, { value: t.status }),
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
					}) : /* @__PURE__ */ (0, b.jsx)(xe, {
						title: "No close exceptions",
						detail: "All synchronized reconciliations agree."
					})
				})]
			}),
			r && /* @__PURE__ */ (0, b.jsx)(De, {
				title: "Import bank statement",
				subtitle: "Validate a versioned CSV before matching it against posted cash entries.",
				close: () => i(!1),
				children: /* @__PURE__ */ (0, b.jsxs)("form", {
					className: "form-stack",
					onSubmit: l,
					children: [
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Cash account",
							name: "cash_account_id",
							as: "select",
							options: s.filter((e) => e.type === "asset").map((e) => [e.id, `${e.code} · ${e.name}`])
						}),
						/* @__PURE__ */ (0, b.jsxs)("div", {
							className: "form-grid",
							children: [
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Start date",
									name: "start_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "End date",
									name: "end_date",
									type: "date"
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Opening balance",
									name: "opening",
									type: "number",
									step: "0.01"
								}),
								/* @__PURE__ */ (0, b.jsx)(P, {
									label: "Closing balance",
									name: "closing",
									type: "number",
									step: "0.01"
								})
							]
						}),
						/* @__PURE__ */ (0, b.jsx)(P, {
							label: "Statement CSV",
							name: "csv",
							as: "textarea",
							hint: "Required columns: date, description and amount. Include external_id when available. Never paste bank credentials."
						}),
						/* @__PURE__ */ (0, b.jsx)(Oe, {
							close: () => i(!1),
							label: "Validate and import"
						})
					]
				})
			})
		]
	});
}
function me() {
	let e = ae(() => T("/api/investments/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(ve, {
				title: "Investment subledger",
				detail: "Positions, measurement models and ledger reconciliation"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Instruments",
						value: t.instruments.length,
						detail: "Active and disposed"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Carrying value",
						value: S(t.totals?.carrying_value_cents || 0),
						detail: "Subledger basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Fair value",
						value: S(t.totals?.fair_value_cents || 0),
						detail: "Latest measurements"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "GL difference",
						value: S(t.reconciliation?.difference_cents || 0),
						detail: "Control reconciliation",
						warning: !!t.reconciliation?.difference_cents
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Positions",
				subtitle: "Accounting model, classification and current carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
						/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
					])
				})
			})
		]
	});
}
function A() {
	let e = ae(() => T("/api/fixed-assets/overview"), []);
	if (e.loading) return /* @__PURE__ */ (0, b.jsx)(Se, {});
	if (e.error) return /* @__PURE__ */ (0, b.jsx)(we, {
		error: e.error,
		retry: e.refresh
	});
	let t = e.data;
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [
			/* @__PURE__ */ (0, b.jsx)(ve, {
				title: "Fixed-asset register",
				detail: "PP&E, depreciation, CIP, impairment, disposals and ARO"
			}),
			/* @__PURE__ */ (0, b.jsxs)("section", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Assets",
						value: t.assets.length,
						detail: "Register records"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Gross PP&E",
						value: S(t.totals?.gross_carrying_cents || t.totals?.cost_cents || 0),
						detail: "Capitalized basis"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "Net book value",
						value: S(t.totals?.net_book_value_cents || 0),
						detail: "After depreciation"
					}),
					/* @__PURE__ */ (0, b.jsx)(j, {
						label: "CIP",
						value: S(t.totals?.cip_cents || 0),
						detail: "Construction in progress"
					})
				]
			}),
			/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Asset register",
				subtitle: "Class, custody, lifecycle status and carrying value",
				children: /* @__PURE__ */ (0, b.jsx)(ye, {
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
						/* @__PURE__ */ (0, b.jsx)(N, { value: e.status })
					])
				})
			})
		]
	});
}
function he() {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "module-flow",
		children: [/* @__PURE__ */ (0, b.jsx)(ve, {
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
					/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: w(e) }), /* @__PURE__ */ (0, b.jsx)("p", { children: "Generated from posted journals with current report mappings." })] }),
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
function ge({ auth: e, setAuth: t, notify: n }) {
	async function r(e) {
		try {
			let r = await T("/api/auth/switch-org", {
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
		children: [/* @__PURE__ */ (0, b.jsx)(ve, {
			title: "Workspace administration",
			detail: "Identity, organization access and controlled configuration"
		}), /* @__PURE__ */ (0, b.jsxs)("div", {
			className: "two-column",
			children: [/* @__PURE__ */ (0, b.jsx)(M, {
				title: "Signed-in identity",
				children: /* @__PURE__ */ (0, b.jsx)(be, { items: [
					["Name", e.user.name],
					["Email", e.user.email],
					["Role", w(e.role)],
					["Permissions", e.permissions.map(w).join(", ")]
				] })
			}), /* @__PURE__ */ (0, b.jsx)(M, {
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
							t.org_id === e.organization.id ? /* @__PURE__ */ (0, b.jsx)(N, { value: "current" }) : /* @__PURE__ */ (0, b.jsx)("button", {
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
function _e() {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "brand",
		children: [/* @__PURE__ */ (0, b.jsx)("span", {
			className: "brand-mark",
			children: "F"
		}), /* @__PURE__ */ (0, b.jsx)("span", { children: "Folio" })]
	});
}
function j({ label: e, value: t, detail: n, warning: r }) {
	return /* @__PURE__ */ (0, b.jsxs)("article", {
		className: `kpi-card${r ? " warning" : ""}`,
		children: [
			/* @__PURE__ */ (0, b.jsx)("span", { children: e }),
			/* @__PURE__ */ (0, b.jsx)("strong", { children: t }),
			/* @__PURE__ */ (0, b.jsx)("small", { children: n })
		]
	});
}
function M({ title: e, subtitle: t, children: n }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "panel",
		children: [e && /* @__PURE__ */ (0, b.jsx)("header", { children: /* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), t && /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }) }), /* @__PURE__ */ (0, b.jsx)("div", {
			className: "panel-body",
			children: n
		})]
	});
}
function ve({ title: e, detail: t, action: n }) {
	return /* @__PURE__ */ (0, b.jsxs)("section", {
		className: "module-bar",
		children: [/* @__PURE__ */ (0, b.jsxs)("div", { children: [/* @__PURE__ */ (0, b.jsx)("h2", { children: e }), /* @__PURE__ */ (0, b.jsx)("p", { children: t })] }), n && /* @__PURE__ */ (0, b.jsx)("div", { children: n })]
	});
}
function ye({ columns: e, rows: t, caption: n, emptyTitle: r = "Nothing here yet", emptyDetail: i = "New records will appear here." }) {
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
	}) : /* @__PURE__ */ (0, b.jsx)(xe, {
		title: r,
		detail: i
	});
}
function N({ value: e }) {
	let t = String(e || "unknown").toLowerCase();
	return /* @__PURE__ */ (0, b.jsx)("span", {
		className: `status status-${t.replaceAll(" ", "-")}`,
		children: w(e)
	});
}
function be({ items: e }) {
	return /* @__PURE__ */ (0, b.jsx)("dl", {
		className: "description-list",
		children: e.map(([e, t]) => /* @__PURE__ */ (0, b.jsxs)(_.Fragment, { children: [/* @__PURE__ */ (0, b.jsx)("dt", { children: e }), /* @__PURE__ */ (0, b.jsx)("dd", { children: t })] }, e))
	});
}
function xe({ title: e, detail: t }) {
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
function Se() {
	return /* @__PURE__ */ (0, b.jsx)(Ce, {
		title: "Loading workspace",
		detail: "Retrieving current accounting data…"
	});
}
function Ce({ title: e, detail: t }) {
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
function we({ error: e, retry: t }) {
	return /* @__PURE__ */ (0, b.jsxs)(Te, {
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
function Te({ children: e, action: t }) {
	return /* @__PURE__ */ (0, b.jsxs)("div", {
		className: "alert",
		role: "alert",
		children: [/* @__PURE__ */ (0, b.jsx)("div", { children: e }), t]
	});
}
function Ee({ notice: e, onClose: t }) {
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
function De({ title: e, subtitle: t, close: n, children: r }) {
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
function Oe({ close: e, label: t }) {
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
function P({ label: e, hint: t, as: n = "input", options: r = [], required: i = !0, ...a }) {
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
var ke = document.querySelector("#root");
ke && (0, v.createRoot)(ke).render(/* @__PURE__ */ (0, b.jsx)(se, {}));
//#endregion
