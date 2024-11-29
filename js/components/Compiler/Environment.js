class Environment extends Map {
  constructor(inherited) {
    if (!(inherited instanceof Map)) {
      !globalThis.process && console.info("`inherited` not instanceof Map, defaulting to new Map().");
      inherited = null;
    }
    super();
    this.inherited = inherited || new Map();
  }
  has(key) {
    return super.has(key) || this.inherited.has(key);
  }
  get(key) {
    if (super.has(key)) return super.get(key);
    return this.inherited.has(key)
      ? this.inherited.get(key)
      : Environment.UndeclaredVariable;
  }
  set(key, value) {
    return (
      (super.has(key)
        ? super.set(key, value)
        : this.inherited.set(key, value)) && this
    );
  }
  declare(key, value) {
    return super.set(key, value);
  }
}
Environment.UndeclaredVariable = {};

export default Environment;
