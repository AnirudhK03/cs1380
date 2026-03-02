#!/usr/bin/env node
/*
  T5 Benchmark Script
  Usage: node t5.benchmark.js <ip1> <ip2> <ip3>
  Each AWS node should already be running: node distribution.js --ip <ip> --port 7110
*/

require('../../distribution.js')();
const distribution = globalThis.distribution;
const id = distribution.util.id;

const ip1 = process.argv[2];
const ip2 = process.argv[3];
const ip3 = process.argv[4];

const n1 = {ip: ip1, port: 7110};
const n2 = {ip: ip2, port: 7110};
const n3 = {ip: ip3, port: 7110};

const myGroup = {};
myGroup[id.getSID(n1)] = n1;
myGroup[id.getSID(n2)] = n2;
myGroup[id.getSID(n3)] = n3;

// Stage 1: generate 1000 key-value pairs in memory
const pairs = [];
for (let i = 0; i < 1000; i++) {
  const key = 'key-' + i;
  const value = {name: Math.random().toString(36), score: Math.random()};
  pairs.push({key, value});
}
console.log('Generated 1000 key-value pairs');

// Stage 2: insert all objects, measuring latency and throughput
function runPuts(done) {
  let i = 0;
  const latencies = [];
  const start = Date.now();

  function next() {
    if (i === 1000) {
      const total = Date.now() - start;
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log('\n-- PUT results --');
      console.log('total time (ms):', total);
      console.log('throughput (ops/sec):', (1000 / (total / 1000)).toFixed(2));
      console.log('avg latency (ms):', avg.toFixed(3));
      done();
      return;
    }
    const {key, value} = pairs[i];
    i++;
    const t0 = Date.now();
    distribution.mygroup.store.put(value, key, (e) => {
      if (e) console.error('put error:', e);
      latencies.push(Date.now() - t0);
      next();
    });
  }

  next();
}

// Stage 3: query all objects by key, measuring latency and throughput
function runGets(done) {
  let i = 0;
  const latencies = [];
  const start = Date.now();

  function next() {
    if (i === 1000) {
      const total = Date.now() - start;
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log('\n-- GET results --');
      console.log('total time (ms):', total);
      console.log('throughput (ops/sec):', (1000 / (total / 1000)).toFixed(2));
      console.log('avg latency (ms):', avg.toFixed(3));
      done();
      return;
    }
    const {key} = pairs[i];
    i++;
    const t0 = Date.now();
    distribution.mygroup.store.get(key, (e) => {
      if (e) console.error('get error:', e);
      latencies.push(Date.now() - t0);
      next();
    });
  }

  next();
}

distribution.node.start((e) => {
  const gid = 'mygroup';
  distribution.local.groups.put({gid}, myGroup, () => {
    distribution.mygroup.groups.put({gid}, myGroup, () => {
      console.log('Connected to nodes:', ip1, ip2, ip3);

      runPuts(() => {
        runGets(() => {
          distribution.node.server.close();
        });
      });
    });
  });
});
