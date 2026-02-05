// @ts-check

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  return JSON.stringify(object);
}


/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== 'string') {
    throw new Error(`Invalid argument type: ${typeof string}.`);
  }

  return JSON.parse(string);
}

module.exports = {
  serialize,
  deserialize,
};
