// @ts-check
/**
 * @typedef {import("../types.js").Node} Node
 * @typedef {import("../types.js").ID} ID
 * @typedef {import("../types.js").NID} NID
 * @typedef {import("../types.js").SID} SID
 * @typedef {import("../types.js").Hasher} Hasher
 */

const assert = require('assert');
const crypto = require('crypto');

/**
 * @param {any} obj
 * @returns {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @returns {NID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @returns {SID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}

/**
 * @param {any} message
 * @returns {string}
 */
function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

/**
 * @param {string} id
 * @returns {bigint}
 */
function idToNum(id) {
  assert(typeof id === 'string', 'idToNum: id is not in KID form!');
  const trimmed = id.startsWith('0x') ? id.slice(2) : id;
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return BigInt(`0x${trimmed}`);
  }
  return BigInt(id);
}

/** @type { Hasher } */
const naiveHash = (kid, nids) => {
  const sortedNids = [...nids].sort();
  const index = Number(idToNum(kid) % BigInt(sortedNids.length));
  return sortedNids[index];
};

/** @type { Hasher } */
const consistentHash = (kid, nids) => {
  const ring = [];
  for (let i = 0; i < nids.length; i++) {
    ring.push({num: idToNum(nids[i]), id: nids[i]});
  }
  ring.push({num: idToNum(kid), id: kid});

  // sort by value
  ring.sort(function(a, b) {
    if (a.num < b.num) {
      return -1;
    } else if (a.num > b.num) {
      return 1;
    } else {
      return 0;
    }
  });

  // find where kid is on the ring
  let kidIndex = -1;
  for (let i = 0; i < ring.length; i++) {
    if (ring[i].id === kid) {
      kidIndex = i;
      break;
    }
  }

  // go clockwise from kid and return the first nid we hit
  for (let i = 1; i <= ring.length; i++) {
    const next = ring[(kidIndex + i) % ring.length];
    if (next.id !== kid) {
      return next.id;
    }
  }
};

/** @type { Hasher } */
const rendezvousHash = (kid, nids) => {
  // For each NID, compute sha256(kid + nid) and convert to a number
  // The NID with the highest score wins
  let bestNid = null;
  let bestScore = BigInt(-1);

  for (const nid of nids) {
    const combined = kid + nid;
    const hashed = getID(combined);
    const score = idToNum(hashed);

    if (score > bestScore) {
      bestScore = score;
      bestNid = nid;
    }
  }

  return bestNid;
};

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
