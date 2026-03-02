// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string | null} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

const id = require('../util/id.js');

/** @type {Map<string, any>} */
const store = new Map();

/**
 * Extracts the string key.
 * @param {SimpleConfig} configuration
 * @returns {string | null}
 */
function extractKey(configuration) {
  if (configuration === null || configuration === undefined) {
    return null;
  }
  if (typeof configuration === 'string') {
    return configuration;
  }
  return configuration.key ?? null;
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  let key = extractKey(configuration);
  if (key === null) {
    key = id.getID(state);
  }
  store.set(key, state);
  return callback(null, state);
};

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('mem.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
};

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const key = extractKey(configuration);
  if (key === null) {
    return callback(new Error('mem.get: no key provided'), null);
  }
  if (!store.has(key)) {
    return callback(new Error(`mem.get: key not found: ${key}`), null);
  }
  return callback(null, store.get(key));
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  const key = extractKey(configuration);
  if (key === null) {
    return callback(new Error('mem.del: no key provided'), null);
  }
  if (!store.has(key)) {
    return callback(new Error(`mem.del: key not found: ${key}`), null);
  }
  const value = store.get(key);
  store.delete(key);
  return callback(null, value);
};

module.exports = {put, get, del, append};
