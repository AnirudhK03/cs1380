/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // done(new Error('Not implemented'));

   distribution.local.status.get('nid', (e, nid) => {
    if (e) return done(e);
    try {
      expect(typeof nid).toBe('string');
    } catch (err) {
      return done(err);
    }

    distribution.local.status.get('sid', (e2, sid) => {
      if (e2) return done(e2);
      try {
        expect(typeof sid).toBe('string');
        expect(sid.length).toBe(5);
        expect(nid.startsWith(sid)).toBe(true);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // done(new Error('Not implemented'));

    // routes.put + routes.get test
  const svc = {
    ping: (cb) => cb(null, 'pong'),
  };

  distribution.local.routes.put(svc, 'testService', (e) => {
    if (e) return done(e);

    distribution.local.routes.get('testService', (e2, got) => {
      if (e2) return done(e2);

      try {
        expect(got).toBeTruthy();
        expect(typeof got.ping).toBe('function');
      } catch (err) {
        return done(err);
      }

      got.ping((e3, v) => {
        if (e3) return done(e3);
        try {
          expect(v).toBe('pong');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // done(new Error('Not implemented'));

  // routes.rem test
  const svc = { hello: (cb) => cb(null, 'world') };

  distribution.local.routes.put(svc, 'temp', (e) => {
    if (e) return done(e);

    distribution.local.routes.rem('temp', (e2) => {
      if (e2) return done(e2);

      distribution.local.routes.get('temp', (e3, got) => {
        try {
          expect(e3).toBeTruthy();
          expect(got).toBeUndefined();
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // Fill out this test case...
    // done(new Error('Not implemented'));

   // comm.send should error on missing remote configuration
  distribution.local.comm.send(['nid'], null, (e, v) => {
    try {
      expect(e).toBeTruthy();
      expect(v == null || v === undefined).toBe(true);
      done();
    } catch (err) {
      done(err);
    }
  });
});

test('(1 pts) student test', (done) => {
  // status.get: verify ip, port, and heap memory stats
  distribution.local.status.get('ip', (e, ip) => {
    if (e) return done(e);
    try {
      expect(typeof ip).toBe('string');
      expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
    } catch (err) {
      return done(err);
    }

    distribution.local.status.get('port', (e2, port) => {
      if (e2) return done(e2);
      try {
        expect(typeof port).toBe('number');
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThanOrEqual(65535);
      } catch (err) {
        return done(err);
      }

      distribution.local.status.get('heapUsed', (e3, heapUsed) => {
        if (e3) return done(e3);
        try {
          expect(typeof heapUsed).toBe('number');
          expect(heapUsed).toBeGreaterThan(0);
        } catch (err) {
          return done(err);
        }

        distribution.local.status.get('heapTotal', (e4, heapTotal) => {
          if (e4) return done(e4);
          try {
            expect(typeof heapTotal).toBe('number');
            expect(heapTotal).toBeGreaterThanOrEqual(heapUsed);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // T6: characterize throughput + latency stats for comm, and (if present) rpc by sending 1000 requests.
  distribution.node.start((e) => {
    if (e) return done(e);

    const me = distribution.node.config;
    const remoteStatus = {
      node: { ip: me.ip, port: me.port },
      service: 'status',
      method: 'get',
    };

    const N = 1000;

    function finish(err) {
      globalThis.distribution.node.server.close();
      if (err) return done(err);
      done();
    }

    function summarize(label, latMs, totalMs) {
      const sorted = [...latMs].sort((a, b) => a - b);
      const avg = latMs.reduce((a, b) => a + b, 0) / latMs.length;
      const p50 = sorted[Math.floor(0.50 * (sorted.length - 1))];
      const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))];
      const p99 = sorted[Math.floor(0.99 * (sorted.length - 1))];
      const throughput = N / (totalMs / 1000);

      console.log(`\n${label} (${N} reqs)`);
      console.log(`  total: ${totalMs.toFixed(2)} ms`);
      console.log(`  throughput: ${throughput.toFixed(2)} req/s`);
      console.log(
        `  latency ms: avg=${avg.toFixed(3)} p50=${p50.toFixed(3)} p95=${p95.toFixed(3)} p99=${p99.toFixed(3)}`
      );
    }

    function runLoop(label, sendFn, next) {
      const latMs = [];
      let i = 0;
      const overallStart = process.hrtime.bigint();

      function one() {
        if (i === N) {
          const overallEnd = process.hrtime.bigint();
          const totalMs = Number(overallEnd - overallStart) / 1_000_000;
          summarize(label, latMs, totalMs);
          return next();
        }

        const t0 = process.hrtime.bigint();
        sendFn((err, nid) => {
          const t1 = process.hrtime.bigint();
          if (err) return next(err);

          try {
            expect(typeof nid).toBe('string');
          } catch (assertErr) {
            return next(assertErr);
          }

          latMs.push(Number(t1 - t0) / 1_000_000);
          i++;
          one();
        });
      }

      one();
    }

    // 1) comm
    runLoop(
      'comm',
      (cb) => distribution.local.comm.send(['nid'], remoteStatus, cb),
      (err1) => {
        if (err1) return finish(err1);

        // 2) rpc (if implemented / exposed in your stencil)
        const rpc = distribution.local.rpc;
        if (!rpc || typeof rpc.send !== 'function') {
          console.log('\nrpc not available at distribution.local.rpc.send; skipping rpc characterization.');
          return finish();
        }

        runLoop('rpc', (cb) => rpc.send(['nid'], remoteStatus, cb), (err2) => {
          if (err2) return finish(err2);
          finish();
        });
      }
    );
  });
}, 30000);
