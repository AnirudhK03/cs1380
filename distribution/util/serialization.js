// @ts-check

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  return JSON.stringify(object, function(key, value) {
    // get the actual original value (before JSON.stringify messes with it) - needed for Date
    var original = this[key];

    // already tagged stuff, (needed cuz of recursion)
    if (value && typeof value === "object" && "__type" in value) {
      return value;
    }

    // functions - T3
    if (typeof original === "function") {
      return { "__type": "function", "src": original.toString() };
    }

    // dates - T4 (have to check original because JSON.stringify converts dates to strings)
    if (original instanceof Date) {
      return { "__type": "date", "iso": original.toISOString() };
    }

    // errors - T4
    if (value instanceof Error) {
      return {
        "__type": "error",
        "name": value.name,
        "message": value.message,
        "stack": value.stack
      };
    }

    // undefined - T2
    if (value === undefined) {
      return { "__type": "undefined" };
    }

    // weird numbers - T2
    if (typeof value === "number") {
      if (Number.isNaN(value)) {
        return { "__type": "nan" };
      }
      if (value === Infinity) {
        return { "__type": "infinity" };
      }
      if (value === -Infinity) {
        return { "__type": "-infinity" };
      }
    }

    // everything else just let JSON handle it
    return value;
  });
}

/**
 * goes through the parsed JSON and fixes up the special types
 * @param {any} value
 * @returns {any}
 */
function revive(value) {
  // null or primitive, just return it
  if (value === null || typeof value !== "object") {
    return value;
  }

  // arrays - go through each element -> recursion here
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      value[i] = revive(value[i]);
    }
    return value;
  }

  // check if its one of our tagged objects
  if ("__type" in value) {
    var type = value["__type"];

    if (type === "undefined") {
      return undefined;
    }
    if (type === "nan") {
      return NaN;
    }
    if (type === "infinity") {
      return Infinity;
    }
    if (type === "-infinity") {
      return -Infinity;
    }
    if (type === "date") {
      return new Date(value.iso);
    }
    if (type === "error") {
      var err = new Error(value.message);
      if (value.name) {
        err.name = value.name;
      }
      if (value.stack) {
        err.stack = value.stack;
      }
      return err;
    }
    if (type === "function") {
      return eval("(" + value.src + ")");
    }

    // unknown tag, throw error
    throw new Error("Unknown type: " + type);
  }

  // regular object - go through each key
  var keys = Object.keys(value);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    value[k] = revive(value[k]);
  }
  return value;
}

/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== "string") {
    throw new Error("deserialize expects a string but got " + typeof string);
  }
  var parsed = JSON.parse(string);
  return revive(parsed);
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
