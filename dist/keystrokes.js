var w = Object.defineProperty;
var R = (n, e, s) => e in n ? w(n, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : n[e] = s;
var r = (n, e, s) => (R(n, typeof e != "symbol" ? e + "" : e, s), s);
const A = {
  /*
  eslint-disable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
  addEventListener: (...n) => {
  },
  removeEventListener: (...n) => {
  },
  dispatchEvent: (...n) => {
  }
  /*
  eslint-enable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
}, x = {
  userAgent: ""
}, K = () => typeof document < "u" ? document : A, E = () => typeof navigator < "u" ? navigator : x, q = () => E().userAgent.toLowerCase().includes("mac");
let C = !1;
const B = (n) => {
  !q() || n.key !== "Meta" || (C = !0);
}, I = (n) => {
  !C || n.key !== "Meta" || (C = !1, P());
}, b = /* @__PURE__ */ new Map(), M = (n) => {
  b.set(n.key, n);
}, L = (n) => {
  b.delete(n.key);
}, P = () => {
  for (const n of b.values()) {
    const e = new KeyboardEvent("keyup", {
      key: n.key,
      code: n.code,
      bubbles: !0,
      cancelable: !0
    });
    K().dispatchEvent(e);
  }
  b.clear();
}, W = (n) => {
  try {
    const e = () => n();
    return addEventListener("focus", e), () => {
      removeEventListener("focus", e);
    };
  } catch {
  }
}, O = (n) => {
  try {
    const e = () => {
      P(), n();
    };
    return addEventListener("blur", e), () => removeEventListener("blur", e);
  } catch {
  }
}, z = (n) => {
  try {
    const e = (s) => {
      M(s), B(s), n({
        key: s.key,
        aliases: [`@${s.code}`],
        originalEvent: s,
        composedPath: () => s.composedPath(),
        preventDefault: () => s.preventDefault()
      });
    };
    return K().addEventListener("keydown", e), () => K().removeEventListener("keydown", e);
  } catch {
  }
}, T = (n) => {
  try {
    const e = (s) => {
      L(s), I(s), n({
        key: s.key,
        aliases: [`@${s.code}`],
        originalEvent: s,
        composedPath: () => s.composedPath(),
        preventDefault: () => s.preventDefault()
      });
    };
    return K().addEventListener("keyup", e), () => K().removeEventListener("keyup", e);
  } catch {
  }
};
class g {
  constructor(e) {
    r(this, "_onPressed");
    r(this, "_onPressedWithRepeat");
    r(this, "_onReleased");
    r(this, "_isPressed");
    r(this, "_identity");
    this._isPressed = !1, this._identity = e, typeof e == "function" ? this._onPressedWithRepeat = e : (this._onPressed = e.onPressed, this._onPressedWithRepeat = e.onPressedWithRepeat, this._onReleased = e.onReleased);
  }
  get isEmpty() {
    return !this._onPressed && !this._onPressedWithRepeat && !this._onReleased;
  }
  isOwnHandler(e) {
    return this._identity === e;
  }
  executePressed(e) {
    var s, t;
    this._isPressed || (s = this._onPressed) == null || s.call(this, e), this._isPressed = !0, (t = this._onPressedWithRepeat) == null || t.call(this, e);
  }
  executeReleased(e) {
    var s;
    this._isPressed && ((s = this._onReleased) == null || s.call(this, e)), this._isPressed = !1;
  }
}
const y = class y {
  constructor(e, s, t = {}) {
    r(this, "_normalizedKeyCombo");
    r(this, "_parsedKeyCombo");
    r(this, "_handlerState");
    r(this, "_keyComboEventMapper");
    r(this, "_movingToNextSequenceAt");
    r(this, "_sequenceIndex");
    r(this, "_unitIndex");
    r(this, "_lastActiveKeyPresses");
    r(this, "_lastActiveKeyCount");
    r(this, "_isPressedWithFinalUnit");
    this._normalizedKeyCombo = y.normalizeKeyCombo(e), this._parsedKeyCombo = y.parseKeyCombo(e), this._handlerState = new g(t), this._keyComboEventMapper = s, this._movingToNextSequenceAt = 0, this._sequenceIndex = 0, this._unitIndex = 0, this._lastActiveKeyPresses = [], this._lastActiveKeyCount = 0, this._isPressedWithFinalUnit = null;
  }
  static parseKeyCombo(e) {
    if (y._parseCache[e])
      return y._parseCache[e];
    const s = e.toLowerCase();
    let t = "", i = [], a = [i], o = [a];
    const c = [o];
    let h = !1;
    for (let l = 0; l < e.length; l += 1)
      if (s[l] === "\\")
        h = !0;
      else if ((s[l] === "+" || s[l] === ">" || s[l] === ",") && !h) {
        if (t)
          throw new Error("cannot have two operators in a row");
        t = s[l];
      } else
        s[l].match(/[^\s]/) && (t && (t === "," ? (i = [], a = [i], o = [a], c.push(o)) : t === ">" ? (i = [], a = [i], o.push(a)) : t === "+" && (i = [], a.push(i)), t = ""), h = !1, i.push(s[l]));
    const d = c.map((l) => l.map((m) => m.map((f) => f.join(""))));
    return y._parseCache[e] = d, d;
  }
  static stringifyKeyCombo(e) {
    return e.map((s) => s.map((t) => t.map((i) => i === "+" ? "\\+" : i === ">" ? "\\>" : i === "," ? "\\," : i).join("+")).join(">")).join(",");
  }
  static normalizeKeyCombo(e) {
    if (y._normalizationCache[e])
      return y._normalizationCache[e];
    const s = this.stringifyKeyCombo(this.parseKeyCombo(e));
    return y._normalizationCache[e] = s, s;
  }
  get isPressed() {
    return !!this._isPressedWithFinalUnit;
  }
  get sequenceIndex() {
    return this.isPressed ? this._parsedKeyCombo.length : this._sequenceIndex;
  }
  get sequenceLength() {
    return this._parsedKeyCombo.length;
  }
  isOwnHandler(e) {
    return this._handlerState.isOwnHandler(e);
  }
  executePressed(e) {
    var s, t;
    !((s = this._isPressedWithFinalUnit) != null && s.has(e.key)) && !((t = e.aliases) != null && t.some((i) => {
      var a;
      return (a = this._isPressedWithFinalUnit) == null ? void 0 : a.has(i);
    })) || this._handlerState.executePressed(this._wrapEvent(this._lastActiveKeyPresses, {
      key: e.key,
      aliases: new Set(e.aliases),
      event: e
    }));
  }
  executeReleased(e) {
    var s, t;
    !((s = this._isPressedWithFinalUnit) != null && s.has(e.key)) && !((t = e.aliases) != null && t.some((i) => {
      var a;
      return (a = this._isPressedWithFinalUnit) == null ? void 0 : a.has(i);
    })) || (this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses, {
      key: e.key,
      aliases: new Set(e.aliases),
      event: e
    })), this._isPressedWithFinalUnit = null);
  }
  updateState(e, s) {
    const t = e.length, i = t < this._lastActiveKeyCount;
    this._lastActiveKeyCount = t;
    const a = this._parsedKeyCombo[this._sequenceIndex], o = a.slice(0, this._unitIndex), c = a.slice(this._unitIndex), h = () => {
      this._movingToNextSequenceAt = 0, this._sequenceIndex = 0, this._unitIndex = 0, this._lastActiveKeyPresses.length = 0, this._handlerState.isEmpty && (this._isPressedWithFinalUnit = null);
    };
    let d = 0;
    if (i) {
      if (this._movingToNextSequenceAt === 0)
        return h();
      if (this._movingToNextSequenceAt + s < Date.now() || t !== 0)
        return;
      this._movingToNextSequenceAt = 0, this._sequenceIndex += 1, this._unitIndex = 0;
      return;
    }
    for (const l of o) {
      for (const m of l) {
        let f = !1;
        for (let _ = d; _ < e.length && _ < d + l.length; _ += 1)
          if (e[_].key === m || e[_].aliases.has(m)) {
            f = !0;
            break;
          }
        if (!f)
          return h();
      }
      d += l.length;
    }
    if (this._movingToNextSequenceAt === 0) {
      for (const l of c) {
        for (const m of l) {
          let f = !1;
          for (let _ = d; _ < e.length && _ < d + l.length; _ += 1)
            if (e[_].key === m || e[_].aliases.has(m)) {
              f = !0;
              break;
            }
          if (!f)
            return;
        }
        this._unitIndex += 1, d += l.length;
      }
      if (d < t - 1)
        return h();
      if (this._lastActiveKeyPresses[this._sequenceIndex] = e.slice(0), this._sequenceIndex < this._parsedKeyCombo.length - 1) {
        this._movingToNextSequenceAt = Date.now();
        return;
      }
      this._isPressedWithFinalUnit = new Set(a[a.length - 1]);
    }
  }
  _wrapEvent(e, s) {
    return {
      ...this._keyComboEventMapper(e, s),
      keyCombo: this._normalizedKeyCombo,
      keyEvents: e.flat().map((i) => i.event),
      finalKeyEvent: s.event
    };
  }
};
r(y, "_parseCache", {}), r(y, "_normalizationCache", {});
let u = y;
const U = 1e3;
class v {
  constructor(e = {}) {
    r(this, "sequenceTimeout");
    r(this, "_isActive");
    r(this, "_unbinder");
    r(this, "_onActiveBinder");
    r(this, "_onInactiveBinder");
    r(this, "_onKeyPressedBinder");
    r(this, "_onKeyReleasedBinder");
    r(this, "_keyComboEventMapper");
    r(this, "_selfReleasingKeys");
    r(this, "_keyRemap");
    r(this, "_handlerStates");
    r(this, "_keyComboStates");
    r(this, "_keyComboStatesArray");
    r(this, "_activeKeyPresses");
    r(this, "_activeKeyMap");
    r(this, "_watchedKeyComboStates");
    r(this, "_keyCombosPressedByKey");
    this.sequenceTimeout = U, this._isActive = !0, this._onActiveBinder = () => {
    }, this._onInactiveBinder = () => {
    }, this._onKeyPressedBinder = () => {
    }, this._onKeyReleasedBinder = () => {
    }, this._keyComboEventMapper = () => ({}), this._selfReleasingKeys = [], this._keyRemap = {}, this._handlerStates = {}, this._keyComboStates = {}, this._keyComboStatesArray = [], this._activeKeyPresses = [], this._activeKeyMap = /* @__PURE__ */ new Map(), this._watchedKeyComboStates = {}, this._keyCombosPressedByKey = /* @__PURE__ */ new Map(), this.bindEnvironment(e);
  }
  get pressedKeys() {
    return this._activeKeyPresses.map((e) => e.key);
  }
  bindKey(e, s) {
    var i;
    if (typeof e == "object") {
      for (const a of e)
        this.bindKey(a, s);
      return;
    }
    e = e.toLowerCase();
    const t = new g(s);
    (i = this._handlerStates)[e] ?? (i[e] = []), this._handlerStates[e].push(t);
  }
  unbindKey(e, s) {
    if (typeof e == "object") {
      for (const i of e)
        this.unbindKey(i, s);
      return;
    }
    e = e.toLowerCase();
    const t = this._handlerStates[e];
    if (t)
      if (s)
        for (let i = 0; i < t.length; i += 1)
          t[i].isOwnHandler(s) && (t.splice(i, 1), i -= 1);
      else
        t.length = 0;
  }
  bindKeyCombo(e, s) {
    var i;
    if (typeof e == "object") {
      for (const a of e)
        this.bindKeyCombo(a, s);
      return;
    }
    e = u.normalizeKeyCombo(e);
    const t = new u(e, this._keyComboEventMapper, s);
    (i = this._keyComboStates)[e] ?? (i[e] = []), this._keyComboStates[e].push(t), this._keyComboStatesArray.push(t);
  }
  unbindKeyCombo(e, s) {
    if (typeof e == "object") {
      for (const i of e)
        this.unbindKeyCombo(i, s);
      return;
    }
    e = u.normalizeKeyCombo(e);
    const t = this._keyComboStates[e];
    if (t)
      if (s) {
        for (let i = 0; i < t.length; i += 1)
          if (t[i].isOwnHandler(s)) {
            for (let a = 0; a < this._keyComboStatesArray.length; a += 1)
              this._keyComboStatesArray[a] === t[i] && (this._keyComboStatesArray.splice(a, 1), a -= 1);
            t.splice(i, 1), i -= 1;
          }
      } else
        t.length = 0;
  }
  checkKey(e) {
    return e = e.toLowerCase(), this._activeKeyPresses.some((s) => s.key === e || s.aliases.has(e));
  }
  checkKeyCombo(e) {
    return this._ensureCachedKeyComboState(e).isPressed;
  }
  checkKeyComboSequenceIndex(e) {
    return this._ensureCachedKeyComboState(e).sequenceIndex;
  }
  bindEnvironment(e = {}) {
    this.unbindEnvironment(), this._onActiveBinder = e.onActive ?? W, this._onInactiveBinder = e.onInactive ?? O, this._onKeyPressedBinder = e.onKeyPressed ?? z, this._onKeyReleasedBinder = e.onKeyReleased ?? T, this._keyComboEventMapper = e.mapKeyComboEvent ?? (() => ({})), this._selfReleasingKeys = e.selfReleasingKeys ?? [], this._keyRemap = e.keyRemap ?? {};
    const s = this._onActiveBinder(() => {
      this._isActive = !0;
    }), t = this._onInactiveBinder(() => {
      this._isActive = !1;
    }), i = this._onKeyPressedBinder((o) => {
      this._handleKeyPress(o);
    }), a = this._onKeyReleasedBinder((o) => {
      this._handleKeyRelease(o);
    });
    this._unbinder = () => {
      s == null || s(), t == null || t(), i == null || i(), a == null || a();
    };
  }
  unbindEnvironment() {
    var e;
    (e = this._unbinder) == null || e.call(this);
  }
  _ensureCachedKeyComboState(e) {
    e = u.normalizeKeyCombo(e), this._watchedKeyComboStates[e] || (this._watchedKeyComboStates[e] = new u(e, this._keyComboEventMapper));
    const s = this._watchedKeyComboStates[e];
    return s.updateState(this._activeKeyPresses, this.sequenceTimeout), s;
  }
  _handleKeyPress(e) {
    var o;
    if (!this._isActive)
      return;
    e = {
      ...e,
      key: e.key.toLowerCase(),
      aliases: ((o = e.aliases) == null ? void 0 : o.map((c) => c.toLowerCase())) ?? []
    };
    const s = this._keyRemap[e.key];
    s && (e.key = s);
    for (let c = 0; c < e.aliases.length; c += 1) {
      const h = this._keyRemap[e.aliases[c]];
      h && (e.aliases[c] = h);
    }
    const t = this._handlerStates[e.key];
    if (t)
      for (const c of t)
        c.executePressed(e);
    for (let c = 0; c < e.aliases.length; c += 1) {
      const h = this._handlerStates[e.aliases[c]];
      if (h)
        for (const d of h)
          d.executePressed(e);
    }
    const i = this._activeKeyMap.get(e.key);
    if (i)
      i.event = e;
    else {
      const c = {
        key: e.key,
        aliases: new Set(e.aliases),
        event: e
      };
      this._activeKeyMap.set(e.key, c), this._activeKeyPresses.push(c);
    }
    this._updateKeyComboStates();
    const a = this._keyComboStatesArray.filter((c) => c.isPressed);
    if (a.length > 0) {
      const c = Math.max(...a.map((d) => d.sequenceLength)), h = [];
      for (const d of a)
        d.sequenceLength === c && (d.executePressed(e), h.push(d));
      h.length > 0 && this._keyCombosPressedByKey.set(e.key, h);
    }
  }
  _handleKeyRelease(e) {
    var a;
    e = {
      ...e,
      key: e.key.toLowerCase(),
      aliases: ((a = e.aliases) == null ? void 0 : a.map((o) => o.toLowerCase())) ?? []
    };
    const s = this._keyRemap[e.key];
    if (s && (e.key = s), e.aliases)
      for (let o = 0; o < e.aliases.length; o += 1) {
        const c = this._keyRemap[e.aliases[o]];
        c && (e.aliases[o] = c);
      }
    const t = this._handlerStates[e.key];
    if (t)
      for (const o of t)
        o.executeReleased(e);
    for (let o = 0; o < e.aliases.length; o += 1) {
      const c = this._handlerStates[e.aliases[o]];
      if (c)
        for (const h of c)
          h.executeReleased(e);
    }
    if (this._activeKeyMap.has(e.key)) {
      this._activeKeyMap.delete(e.key);
      for (let o = 0; o < this._activeKeyPresses.length; o += 1)
        if (this._activeKeyPresses[o].key === e.key) {
          this._activeKeyPresses.splice(o, 1), o -= 1;
          break;
        }
    }
    this._tryReleaseSelfReleasingKeys(), this._updateKeyComboStates();
    const i = this._keyCombosPressedByKey.get(e.key);
    if (i) {
      for (const o of i)
        o.executeReleased(e);
      this._keyCombosPressedByKey.delete(e.key);
    }
  }
  _updateKeyComboStates() {
    for (const e of this._keyComboStatesArray)
      e.updateState(this._activeKeyPresses, this.sequenceTimeout);
  }
  _tryReleaseSelfReleasingKeys() {
    for (const e of this._activeKeyPresses)
      for (const s of this._selfReleasingKeys)
        e.key === s && this._handleKeyRelease(e.event);
  }
}
let S, k;
const F = (n) => {
  k = n ?? new v(S);
}, p = () => (k || F(), k), j = (n) => {
  S = n;
}, N = (...n) => p().bindKey(...n), D = (...n) => p().unbindKey(...n), G = (...n) => p().bindKeyCombo(...n), $ = (...n) => p().unbindKeyCombo(...n), J = (...n) => p().checkKey(...n), Q = (...n) => p().checkKeyCombo(...n), V = u.normalizeKeyCombo, X = u.stringifyKeyCombo, Y = u.parseKeyCombo, Z = (n = {}) => {
  let e, s, t, i;
  return Object.assign(new v({
    ...n,
    onActive(o) {
      e = o;
    },
    onInactive(o) {
      s = o;
    },
    onKeyPressed(o) {
      t = o;
    },
    onKeyReleased(o) {
      i = o;
    }
  }), {
    activate() {
      e();
    },
    deactivate() {
      s();
    },
    press(o) {
      t({ composedPath: () => [], ...o });
    },
    release(o) {
      i({ composedPath: () => [], ...o });
    }
  });
};
export {
  g as HandlerState,
  u as KeyComboState,
  v as Keystrokes,
  N as bindKey,
  G as bindKeyCombo,
  W as browserOnActiveBinder,
  O as browserOnInactiveBinder,
  z as browserOnKeyPressedBinder,
  T as browserOnKeyReleasedBinder,
  J as checkKey,
  Q as checkKeyCombo,
  Z as createTestKeystrokes,
  U as defaultSequenceTimeout,
  p as getGlobalKeystrokes,
  V as normalizeKeyCombo,
  Y as parseKeyCombo,
  F as setGlobalKeystrokes,
  j as setGlobalKeystrokesOptions,
  X as stringifyKeyCombo,
  D as unbindKey,
  $ as unbindKeyCombo
};
