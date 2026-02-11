// @ts-check
const id = require("../util/id.js");
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  // return callback(new Error('status.get not implemented'));
  const node = global.distribution.node;
  const config = node.config;

  if (!config || !config.ip || !config.port) {
    return callback(new Error("Node config not initialized"));
  }

  if (global.distribution.counts === undefined) {
    global.distribution.counts = 0;
  }

  const mem = process.memoryUsage();

  let result;

  if (configuration === "ip") {
    result = config.ip;
  }
  else if (configuration === "port") {
    result = config.port;
  }
  else if (configuration === "nid") {
    result = id.getNID(config);
  }
  else if (configuration === "sid") {
    result = id.getSID(config);
  }
  else if (configuration === "counts") {
    result = global.distribution.counts;
  }
  else if (configuration === "heapTotal") {
    result = mem.heapTotal;
  }
  else if (configuration === "heapUsed") {
    result = mem.heapUsed;
  }
  else {
    return callback(new Error("Unknown status property"));
  }

  callback(null, result);
};


/**
 * @param {Node} configuration
 * @param {Callback} callback
 */
function spawn(configuration, callback) {
  callback(new Error('status.spawn not implemented'));
}

/**
 * @param {Callback} callback
 */
function stop(callback) {
  callback(new Error('status.stop not implemented'));
}

module.exports = {get, spawn, stop};
