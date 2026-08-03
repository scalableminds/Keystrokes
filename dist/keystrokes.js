var E = Object.defineProperty;
var w = (a, e, t) => e in a ? E(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var r = (a, e, t) => (w(a, typeof e != "symbol" ? e + "" : e, t), t);
const R = {
  /*
  eslint-disable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
  addEventListener: (...a) => {
  },
  removeEventListener: (...a) => {
  },
  dispatchEvent: (...a) => {
  }
  /*
  eslint-enable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
}, x = {
  userAgent: ""
}, p = () => typeof document < "u" ? document : R, q = () => typeof navigator < "u" ? navigator : x, B = () => q().userAgent.toLowerCase().includes("mac");
let v = !1;
const M = (a) => {
  !B() || a.key !== "Meta" || (v = !0);
}, I = (a) => {
  !v || a.key !== "Meta" || (v = !1, k());
}, b = /* @__PURE__ */ new Map(), P = (a) => a.code || a.key, L = (a) => a.isComposing === !0 || a.key === "Process" || a.key === "Unidentified", W = (a) => {
  b.set(P(a), a);
}, O = (a) => {
  b.delete(P(a));
}, k = () => {
  for (const a of b.values()) {
    const e = new KeyboardEvent("keyup", {
      key: a.key,
      code: a.code,
      bubbles: !0,
      cancelable: !0
    });
    p().dispatchEvent(e);
  }
  b.clear();
}, z = (a) => {
  try {
    const e = () => a();
    return addEventListener("focus", e), () => {
      removeEventListener("focus", e);
    };
  } catch {
  }
}, U = (a) => {
  try {
    const e = () => {
      k(), a();
    }, t = () => {
      p().visibilityState === "hidden" && e();
    };
    return addEventListener("blur", e), addEventListener("pagehide", e), addEventListener("visibilitychange", t), () => {
      removeEventListener("blur", e), removeEventListener("pagehide", e), removeEventListener("visibilitychange", t);
    };
  } catch {
  }
}, F = (a) => {
  try {
    const e = (t) => {
      L(t) || (W(t), M(t), a({
        key: t.key,
        aliases: [`@${t.code}`],
        identity: t.code || void 0,
        originalEvent: t,
        composedPath: () => t.composedPath(),
        preventDefault: () => t.preventDefault()
      }));
    };
    return p().addEventListener("keydown", e), () => p().removeEventListener("keydown", e);
  } catch {
  }
}, H = (a) => {
  try {
    const e = (t) => {
      O(t), I(t), a({
        key: t.key,
        aliases: [`@${t.code}`],
        identity: t.code || void 0,
        originalEvent: t,
        composedPath: () => t.composedPath(),
        preventDefault: () => t.preventDefault()
      });
    };
    return p().addEventListener("keyup", e), () => p().removeEventListener("keyup", e);
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
    var t, s;
    this._isPressed || (t = this._onPressed) == null || t.call(this, e), this._isPressed = !0, (s = this._onPressedWithRepeat) == null || s.call(this, e);
  }
  executeReleased(e) {
    var t;
    this._isPressed && ((t = this._onReleased) == null || t.call(this, e)), this._isPressed = !1;
  }
}
const l = class l {
  constructor(e, t, s = {}) {
    r(this, "_normalizedKeyCombo");
    r(this, "_parsedKeyCombo");
    r(this, "_handlerState");
    r(this, "_keyComboEventMapper");
    r(this, "_movingToNextSequenceAt");
    r(this, "_sequenceIndex");
    r(this, "_sequenceAdvancedAt");
    r(this, "_unitIndex");
    r(this, "_lastActiveKeyPresses");
    r(this, "_lastActiveKeyCount");
    r(this, "_isPressedWithFinalUnit");
    this._normalizedKeyCombo = l.normalizeKeyCombo(e), this._parsedKeyCombo = l.parseKeyCombo(e), this._handlerState = new g(s), this._keyComboEventMapper = t, this._movingToNextSequenceAt = 0, this._sequenceIndex = 0, this._sequenceAdvancedAt = 0, this._unitIndex = 0, this._lastActiveKeyPresses = [], this._lastActiveKeyCount = 0, this._isPressedWithFinalUnit = null;
  }
  static parseKeyCombo(e) {
    if (l._parseCache[e])
      return l._parseCache[e];
    const t = e.toLowerCase();
    let s = "", i = [], o = [i], n = [o];
    const d = [n];
    let h = !1;
    for (let c = 0; c < e.length; c += 1)
      if (t[c] === "\\")
        h = !0;
      else if ((t[c] === "+" || t[c] === ">" || t[c] === ",") && !h) {
        if (s)
          throw new Error("cannot have two operators in a row");
        s = t[c];
      } else
        t[c].match(/[^\s]/) && (s && (s === "," ? (i = [], o = [i], n = [o], d.push(n)) : s === ">" ? (i = [], o = [i], n.push(o)) : s === "+" && (i = [], o.push(i)), s = ""), h = !1, i.push(t[c]));
    const _ = d.map((c) => c.map((f) => f.map((m) => m.join(""))));
    return l._parseCache[e] = _, _;
  }
  static stringifyKeyCombo(e) {
    return e.map((t) => t.map((s) => s.map((i) => i === "+" ? "\\+" : i === ">" ? "\\>" : i === "," ? "\\," : i).join("+")).join(">")).join(",");
  }
  static normalizeKeyCombo(e) {
    if (l._normalizationCache[e])
      return l._normalizationCache[e];
    const t = this.stringifyKeyCombo(this.parseKeyCombo(e));
    return l._normalizationCache[e] = t, t;
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
  /**
   * Releases the combo if it is pressed and abandons any progress through its
   * sequence.
   *
   * Both halves matter. A combo waiting part way through its sequence — "control
   * + k" typed but not yet completed — is armed without being pressed, so nothing
   * in the normal release path touches it, and it would otherwise swallow whatever
   * key is pressed next, however much later.
   */
  forceRelease(e) {
    this._isPressedWithFinalUnit && (e && this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses, {
      key: e.key,
      aliases: new Set(e.aliases),
      identity: e.identity,
      event: e
    })), this._isPressedWithFinalUnit = null), this._resetProgress();
  }
  _resetProgress() {
    this._movingToNextSequenceAt = 0, this._sequenceIndex = 0, this._sequenceAdvancedAt = 0, this._unitIndex = 0, this._lastActiveKeyPresses.length = 0;
  }
  isOwnHandler(e) {
    return this._handlerState.isOwnHandler(e);
  }
  executePressed(e) {
    var t, s;
    !((t = this._isPressedWithFinalUnit) != null && t.has(e.key)) && !((s = e.aliases) != null && s.some((i) => {
      var o;
      return (o = this._isPressedWithFinalUnit) == null ? void 0 : o.has(i);
    })) || this._handlerState.executePressed(this._wrapEvent(this._lastActiveKeyPresses, {
      key: e.key,
      aliases: new Set(e.aliases),
      event: e
    }));
  }
  executeReleased(e) {
    var t, s;
    !((t = this._isPressedWithFinalUnit) != null && t.has(e.key)) && !((s = e.aliases) != null && s.some((i) => {
      var o;
      return (o = this._isPressedWithFinalUnit) == null ? void 0 : o.has(i);
    })) || (this._handlerState.executeReleased(this._wrapEvent(this._lastActiveKeyPresses, {
      key: e.key,
      aliases: new Set(e.aliases),
      event: e
    })), this._isPressedWithFinalUnit = null);
  }
  updateState(e, t) {
    const s = e.length, i = s < this._lastActiveKeyCount;
    this._lastActiveKeyCount = s;
    const o = () => {
      this._resetProgress(), this._handlerState.isEmpty && (this._isPressedWithFinalUnit = null);
    };
    this._sequenceAdvancedAt !== 0 && this._sequenceAdvancedAt + t < Date.now() && o();
    const n = this._parsedKeyCombo[this._sequenceIndex], d = n.slice(0, this._unitIndex), h = n.slice(this._unitIndex);
    let _ = 0;
    if (i) {
      if (this._movingToNextSequenceAt === 0)
        return o();
      if (this._movingToNextSequenceAt + t < Date.now() || s !== 0)
        return;
      this._movingToNextSequenceAt = 0, this._sequenceIndex += 1, this._sequenceAdvancedAt = Date.now(), this._unitIndex = 0;
      return;
    }
    for (const c of d) {
      for (const f of c) {
        let m = !1;
        for (let y = _; y < e.length && y < _ + c.length; y += 1)
          if (e[y].key === f || e[y].aliases.has(f)) {
            m = !0;
            break;
          }
        if (!m)
          return o();
      }
      _ += c.length;
    }
    if (this._movingToNextSequenceAt === 0) {
      for (const c of h) {
        for (const f of c) {
          let m = !1;
          for (let y = _; y < e.length && y < _ + c.length; y += 1)
            if (e[y].key === f || e[y].aliases.has(f)) {
              m = !0;
              break;
            }
          if (!m)
            return;
        }
        this._unitIndex += 1, _ += c.length;
      }
      if (_ < s - 1)
        return o();
      if (this._lastActiveKeyPresses[this._sequenceIndex] = e.slice(0), this._sequenceIndex < this._parsedKeyCombo.length - 1) {
        this._movingToNextSequenceAt = Date.now();
        return;
      }
      this._isPressedWithFinalUnit = new Set(n[n.length - 1]), this._sequenceAdvancedAt = 0;
    }
  }
  _wrapEvent(e, t) {
    return {
      ...this._keyComboEventMapper(e, t),
      keyCombo: this._normalizedKeyCombo,
      keyEvents: e.flat().map((i) => i.event),
      finalKeyEvent: t.event
    };
  }
};
r(l, "_parseCache", {}), r(l, "_normalizationCache", {});
let u = l;
const T = 1e3;
class S {
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
    this.sequenceTimeout = T, this._isActive = !0, this._onActiveBinder = () => {
    }, this._onInactiveBinder = () => {
    }, this._onKeyPressedBinder = () => {
    }, this._onKeyReleasedBinder = () => {
    }, this._keyComboEventMapper = () => ({}), this._selfReleasingKeys = [], this._keyRemap = {}, this._handlerStates = {}, this._keyComboStates = {}, this._keyComboStatesArray = [], this._activeKeyPresses = [], this._activeKeyMap = /* @__PURE__ */ new Map(), this._watchedKeyComboStates = {}, this._keyCombosPressedByKey = /* @__PURE__ */ new Map(), this.bindEnvironment(e);
  }
  get pressedKeys() {
    return this._activeKeyPresses.map((e) => e.key);
  }
  bindKey(e, t) {
    var i;
    if (typeof e == "object") {
      for (const o of e)
        this.bindKey(o, t);
      return;
    }
    e = e.toLowerCase();
    const s = new g(t);
    (i = this._handlerStates)[e] ?? (i[e] = []), this._handlerStates[e].push(s);
  }
  unbindKey(e, t) {
    if (typeof e == "object") {
      for (const i of e)
        this.unbindKey(i, t);
      return;
    }
    e = e.toLowerCase();
    const s = this._handlerStates[e];
    if (s)
      if (t)
        for (let i = 0; i < s.length; i += 1)
          s[i].isOwnHandler(t) && (s.splice(i, 1), i -= 1);
      else
        s.length = 0;
  }
  bindKeyCombo(e, t) {
    var i;
    if (typeof e == "object") {
      for (const o of e)
        this.bindKeyCombo(o, t);
      return;
    }
    e = u.normalizeKeyCombo(e);
    const s = new u(e, this._keyComboEventMapper, t);
    (i = this._keyComboStates)[e] ?? (i[e] = []), this._keyComboStates[e].push(s), this._keyComboStatesArray.push(s);
  }
  unbindKeyCombo(e, t) {
    if (typeof e == "object") {
      for (const i of e)
        this.unbindKeyCombo(i, t);
      return;
    }
    e = u.normalizeKeyCombo(e);
    const s = this._keyComboStates[e];
    if (s)
      if (t) {
        for (let i = 0; i < s.length; i += 1)
          if (s[i].isOwnHandler(t)) {
            for (let o = 0; o < this._keyComboStatesArray.length; o += 1)
              this._keyComboStatesArray[o] === s[i] && (this._keyComboStatesArray.splice(o, 1), o -= 1);
            s.splice(i, 1), i -= 1;
          }
      } else
        s.length = 0;
  }
  checkKey(e) {
    return e = e.toLowerCase(), this._activeKeyPresses.some((t) => t.key === e || t.aliases.has(e));
  }
  checkKeyCombo(e) {
    return this._ensureCachedKeyComboState(e).isPressed;
  }
  checkKeyComboSequenceIndex(e) {
    return this._ensureCachedKeyComboState(e).sequenceIndex;
  }
  bindEnvironment(e = {}) {
    this.unbindEnvironment(), this._onActiveBinder = e.onActive ?? z, this._onInactiveBinder = e.onInactive ?? U, this._onKeyPressedBinder = e.onKeyPressed ?? F, this._onKeyReleasedBinder = e.onKeyReleased ?? H, this._keyComboEventMapper = e.mapKeyComboEvent ?? (() => ({})), this._selfReleasingKeys = e.selfReleasingKeys ?? [], this._keyRemap = e.keyRemap ?? {};
    const t = this._onActiveBinder(() => {
      this._isActive = !0;
    }), s = this._onInactiveBinder(() => {
      this._isActive = !1, this.releaseAllKeys();
    }), i = this._onKeyPressedBinder((n) => {
      this._handleKeyPress(n);
    }), o = this._onKeyReleasedBinder((n) => {
      this._handleKeyRelease(n);
    });
    this._unbinder = () => {
      t == null || t(), s == null || s(), i == null || i(), o == null || o();
    };
  }
  unbindEnvironment() {
    var e;
    (e = this._unbinder) == null || e.call(this);
  }
  /**
   * Releases every key currently believed to be held and abandons any progress
   * through a key combo. Call this whenever keyups may have been missed — the
   * page regaining focus, or a modal that stopped propagation of key events.
   *
   * Without a way to do this a single missed keyup is unrecoverable: a stranded
   * key stops all single key combos from matching, and a combo left marked as
   * pressed keeps suppressing shorter combos (see the readme).
   */
  releaseAllKeys() {
    var s;
    const e = [...this._activeKeyPresses];
    for (const i of e)
      this._handleKeyRelease(i.event);
    const t = (s = e[e.length - 1]) == null ? void 0 : s.event;
    for (const i of this._keyComboStatesArray)
      i.forceRelease(t);
    this._activeKeyPresses.length = 0, this._activeKeyMap.clear(), this._keyCombosPressedByKey.clear(), this._updateKeyComboStates();
  }
  _ensureCachedKeyComboState(e) {
    e = u.normalizeKeyCombo(e), this._watchedKeyComboStates[e] || (this._watchedKeyComboStates[e] = new u(e, this._keyComboEventMapper));
    const t = this._watchedKeyComboStates[e];
    return t.updateState(this._activeKeyPresses, this.sequenceTimeout), t;
  }
  _normalizeEvent(e) {
    var i;
    const t = {
      ...e,
      key: e.key.toLowerCase(),
      aliases: ((i = e.aliases) == null ? void 0 : i.map((o) => o.toLowerCase())) ?? []
    }, s = this._keyRemap[t.key];
    s && (t.key = s);
    for (let o = 0; o < t.aliases.length; o += 1) {
      const n = this._keyRemap[t.aliases[o]];
      n && (t.aliases[o] = n);
    }
    return t;
  }
  _identityOf(e) {
    return e.identity ?? e.key;
  }
  _handleKeyPress(e) {
    if (!this._isActive || e.key == null)
      return;
    e = this._normalizeEvent(e);
    const t = this._handlerStates[e.key];
    if (t)
      for (const n of t)
        n.executePressed(e);
    for (let n = 0; n < e.aliases.length; n += 1) {
      const d = this._handlerStates[e.aliases[n]];
      if (d)
        for (const h of d)
          h.executePressed(e);
    }
    const s = this._identityOf(e), i = this._activeKeyMap.get(s);
    if (i)
      i.key = e.key, i.aliases = new Set(e.aliases), i.event = e;
    else {
      const n = {
        key: e.key,
        aliases: new Set(e.aliases),
        identity: s,
        event: e
      };
      this._activeKeyMap.set(s, n), this._activeKeyPresses.push(n);
    }
    this._updateKeyComboStates();
    const o = this._keyComboStatesArray.filter((n) => n.isPressed);
    if (o.length > 0) {
      const n = Math.max(...o.map((h) => h.sequenceLength)), d = [];
      for (const h of o)
        h.sequenceLength === n && (h.executePressed(e), d.push(h));
      d.length > 0 && this._keyCombosPressedByKey.set(s, d);
    }
  }
  _handleKeyRelease(e) {
    if (e.key == null) {
      const n = e.identity != null ? this._activeKeyMap.get(e.identity) : void 0;
      if (!n)
        return;
      e = { ...e, key: n.key, aliases: [...n.aliases] };
    } else
      e = this._normalizeEvent(e);
    const t = this._identityOf(e), s = this._activeKeyMap.get(t);
    s && s.key !== e.key && (e = {
      ...e,
      key: s.key,
      aliases: [...s.aliases]
    });
    const i = this._handlerStates[e.key];
    if (i)
      for (const n of i)
        n.executeReleased(e);
    for (let n = 0; n < e.aliases.length; n += 1) {
      const d = this._handlerStates[e.aliases[n]];
      if (d)
        for (const h of d)
          h.executeReleased(e);
    }
    if (this._activeKeyMap.has(t)) {
      this._activeKeyMap.delete(t);
      for (let n = 0; n < this._activeKeyPresses.length; n += 1)
        if (this._identityOfKeyPress(this._activeKeyPresses[n]) === t) {
          this._activeKeyPresses.splice(n, 1), n -= 1;
          break;
        }
    }
    this._tryReleaseSelfReleasingKeys(), this._updateKeyComboStates();
    const o = this._keyCombosPressedByKey.get(t);
    if (o) {
      for (const n of o)
        n.executeReleased(e);
      this._keyCombosPressedByKey.delete(t);
    }
  }
  _identityOfKeyPress(e) {
    return e.identity ?? e.key;
  }
  _updateKeyComboStates() {
    for (const e of this._keyComboStatesArray)
      e.updateState(this._activeKeyPresses, this.sequenceTimeout);
  }
  _tryReleaseSelfReleasingKeys() {
    for (const e of this._activeKeyPresses)
      for (const t of this._selfReleasingKeys)
        e.key === t && this._handleKeyRelease(e.event);
  }
}
let A, C;
const j = (a) => {
  C = a ?? new S(A);
}, K = () => (C || j(), C), N = (a) => {
  A = a;
}, G = (...a) => K().bindKey(...a), $ = (...a) => K().unbindKey(...a), J = (...a) => K().bindKeyCombo(...a), Q = (...a) => K().unbindKeyCombo(...a), V = (...a) => K().checkKey(...a), X = (...a) => K().checkKeyCombo(...a), Y = (...a) => K().releaseAllKeys(...a), Z = u.normalizeKeyCombo, ee = u.stringifyKeyCombo, te = u.parseKeyCombo, se = (a = {}) => {
  let e, t, s, i;
  return Object.assign(new S({
    ...a,
    onActive(n) {
      e = n;
    },
    onInactive(n) {
      t = n;
    },
    onKeyPressed(n) {
      s = n;
    },
    onKeyReleased(n) {
      i = n;
    }
  }), {
    activate() {
      e();
    },
    deactivate() {
      t();
    },
    press(n) {
      s({ composedPath: () => [], ...n });
    },
    release(n) {
      i({ composedPath: () => [], ...n });
    }
  });
};
export {
  g as HandlerState,
  u as KeyComboState,
  S as Keystrokes,
  G as bindKey,
  J as bindKeyCombo,
  z as browserOnActiveBinder,
  U as browserOnInactiveBinder,
  F as browserOnKeyPressedBinder,
  H as browserOnKeyReleasedBinder,
  V as checkKey,
  X as checkKeyCombo,
  se as createTestKeystrokes,
  T as defaultSequenceTimeout,
  K as getGlobalKeystrokes,
  Z as normalizeKeyCombo,
  te as parseKeyCombo,
  Y as releaseAllKeys,
  j as setGlobalKeystrokes,
  N as setGlobalKeystrokesOptions,
  ee as stringifyKeyCombo,
  $ as unbindKey,
  Q as unbindKeyCombo
};
