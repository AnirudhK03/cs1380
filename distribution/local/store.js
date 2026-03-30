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
 * Returns the directory to store items in, namespaced by NID and optionally GID.
 * @param {string | null} gid
 * @returns {string}
 */
function getStoreDir(gid) {
  const nid = id.getNID(globalThis.distribution.node.config);
  const dir = gid ? path.join(BASE_STORE_DIR, nid, gid) : path.join(BASE_STORE_DIR, nid);
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
 * Extracts the gid from configuration (if present).
 * @param {SimpleConfig} configuration
 * @returns {string | null}
 */
function extractGid(configuration) {
  if (!configuration || typeof configuration === 'string') {
    return null;
  }
  return configuration.gid || null;
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
  const gid = extractGid(configuration);
  const filename = path.join(getStoreDir(gid), sanitizeKey(key));
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
  const gid = extractGid(configuration);
  const filename = path.join(getStoreDir(gid), sanitizeKey(key));
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
  const gid = extractGid(configuration);
  const filename = path.join(getStoreDir(gid), sanitizeKey(key));
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
  const key = extractKey(configuration);
  if (key === null) {
    return callback(new Error('store.append: no key provided'), null);
  }
  const gid = extractGid(configuration);
  const filename = path.join(getStoreDir(gid), sanitizeKey(key));

  // read existing value (if any), push new state onto it, write back
  fs.readFile(filename, 'utf8', (err, data) => {
    let existing = [];
    if (!err) {
      try {
        existing = serialization.deserialize(data);
      } catch (e) {
        existing = [];
      }
    }
    existing.push(state);
    fs.writeFile(filename, serialization.serialize(existing), (writeErr) => {
      if (writeErr) {
        return callback(writeErr, null);
      }
      return callback(null, existing);
    });
  });
}

module.exports = {put, get, del, append};
