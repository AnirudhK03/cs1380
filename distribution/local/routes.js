/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */


/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
  // return callback(new Error('routes.get not implemented'));
  const local = global.distribution.local;

  //get the name - 2 wyas thins can be structered according to param
  let serviceName;
  if (typeof configuration === "string") {
    serviceName = configuration;
  } else {
    serviceName = configuration.service;
  }

  //check if name exists
  if (local[serviceName] === undefined) {
    return callback(new Error("Unknown service"));
  }

  callback(null, local[serviceName]);
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function put(service, configuration, callback) {
  // return callback(new Error('routes.put not implemented'));
  const local = global.distribution.local;

  local[configuration] = service;
  callback(null, configuration);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  // return callback(new Error('routes.rem not implemented'));
  const local = global.distribution.local;

  if (local[configuration] === undefined) {
    return callback(new Error("Unknown service"));
  }

  const removed = local[configuration];
  delete local[configuration];
  callback(null, removed);
}

module.exports = {get, put, rem};
