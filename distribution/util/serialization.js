// @ts-check

const TAG = "__type";
/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  return JSON.stringify(object, (_key, v) => {
    //T3 - under
    if (typeof v === "function") {
      return { [TAG]: "function", src: v.toString() };
    }


    //T2 - under
    // Only tag values JSON can't represent correctly.
    if (v === undefined) return { [TAG]: "undefined" };

    if (typeof v === "number") {
      if (Number.isNaN(v)) return { [TAG]: "nan" };
      if (v === Infinity) return { [TAG]: "infinity" };
      if (v === -Infinity) return { [TAG]: "-infinity" };
    }

    // Everything else: let JSON do it normally (prevents infinite recursion)
    return v;
  });
}


/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== 'string') {
    throw new Error(`Invalid argument type: ${typeof string}.`);
  }

  return JSON.parse(string, (_key, v) => {
    if (!v || typeof v !== "object") return v;
    if (!(TAG in v)) return v;

    switch (v[TAG]) {
      case "undefined":
        return undefined;
      case "nan":
        return NaN;
      case "infinity":
        return Infinity;
      case "-infinity":
        return -Infinity;

      //T3 - funcs
      case "function": {
        const src = v.src;
        let fn;
        fn = eval(`(${src})`);
        return fn;
      }


      default:
        return v;
    }
  });
}

module.exports = {
  serialize,
  deserialize,
};
