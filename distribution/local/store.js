// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {?string} key
 * @property {?string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

const path = require('path');
const fs = require('fs');
const id = require('../util/id.js');
const serialization = require('../util/serialization.js');

const BASE_STORE_DIR = path.join(__dirname, '../../store');

//literally everything is here the same for mem just that we have to cccess to directories so thus we need path and fs

/**
 * Returns the node-specific store directory (store/<NID>/)
 * @returns {string}
 */
function getStoreDir() {
  const nid = id.getNID(globalThis.distribution.node.config);
  const dir = path.join(BASE_STORE_DIR, nid);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
  return dir;
}

/**
 * Converts a key to an alphanumeric-only filename
 * @param {string} key
 * @returns {string}
 */
function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Extracts the string key from a SimpleConfig, same as meme
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
  const filename = path.join(getStoreDir(), sanitizeKey(key));
  fs.writeFile(filename, serialization.serialize(state), (err) => {
    if (err) {
      return callback(err, null);
    }
    return callback(null, state);
  });
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const key = extractKey(configuration);
  if (key === null) {
    return callback(new Error('store.get: no key provided'), null);
  }
  const filename = path.join(getStoreDir(), sanitizeKey(key));
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return callback(new Error(`store.get: key not found: ${key}`), null);
    }
    try {
      return callback(null, serialization.deserialize(data));
    } catch (e) {
      return callback((e), null);
    }
  });
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  const key = extractKey(configuration);
  if (key === null) {
    return callback(new Error('store.del: no key provided'), null);
  }
  const filename = path.join(getStoreDir(), sanitizeKey(key));
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return callback(new Error(`store.del: key not found: ${key}`), null);
    }
    let value;
    try {
      value = serialization.deserialize(data);
    } catch (e) {
      return callback((e), null);
    }
    fs.unlink(filename, (unlinkErr) => {
      if (unlinkErr) {
        return callback(unlinkErr, null);
      }
      return callback(null, value);
    });
  });
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('store.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
}

module.exports = {put, get, del, append};
