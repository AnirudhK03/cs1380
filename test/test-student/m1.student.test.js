/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

test('(1 pts) student test', () => {
  // mega nested objects
  var util = distribution.util;

  var obj = {a: {b: {c: [1, 2, {d: [3, 4, 5]}]}}};

  var result = util.deserialize(util.serialize(obj));

  expect(result).toEqual(obj);
});


test('(1 pts) student test', () => {
  // freelo tests
  var util = distribution.util;

  expect(util.deserialize(util.serialize("hello world"))).toEqual("hello world");
  expect(util.deserialize(util.serialize(42))).toEqual(42);
  expect(util.deserialize(util.serialize(-3.14))).toEqual(-3.14);
});


test('(1 pts) student test', () => {
  // calm luh ones
  var util = distribution.util;

  expect(util.deserialize(util.serialize(true))).toEqual(true);
  expect(util.deserialize(util.serialize(false))).toEqual(false);
  expect(util.deserialize(util.serialize(null))).toEqual(null);
  expect(util.deserialize(util.serialize(undefined))).toEqual(undefined);
});

test('(1 pts) student test', () => {
  // weird numbers inside nested objs
  var util = distribution.util;

  var obj = {nums: [NaN, Infinity, -Infinity, 0, -0], nested: {val: NaN}};

  var result = util.deserialize(util.serialize(obj));

  expect(Number.isNaN(result.nums[0])).toBe(true);
  expect(result.nums[1]).toBe(Infinity);
  expect(result.nums[2]).toBe(-Infinity);
  expect(Number.isNaN(result.nested.val)).toBe(true);
});

test('(1 pts) student test', () => {
  
  // T5: latency characterization for serialize/deserialize
  var util = distribution.util;
  var iterations = 1000;

  // helper to calculate average
  function avg(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
  }

  // T2 workload - base types
  var t2Data = [42, "hello world", true, null, undefined, NaN, Infinity, -Infinity];
  var t2Times = [];
  for (var i = 0; i < iterations; i++) {
    var start = performance.now();
    for (var j = 0; j < t2Data.length; j++) {
      util.deserialize(util.serialize(t2Data[j]));
    }
    t2Times.push(performance.now() - start);
  }

  // T3 workload - functions
  var t3Data = [
    function(a, b) { return a + b; },
    function(x) { return x * 2; },
    function() { return "hello"; }
  ];
  var t3Times = [];
  for (var i = 0; i < iterations; i++) {
    var start = performance.now();
    for (var j = 0; j < t3Data.length; j++) {
      util.deserialize(util.serialize(t3Data[j]));
    }
    t3Times.push(performance.now() - start);
  }

  // T4 workload - complex objects
  var t4Data = {
    arr: [1, 2, 3, "four", "five"],
    date: new Date("2020-01-01"),
    err: new Error("something went wrong"),
    nested: {a: {b: {c: 1}}},
    mixed: [{x: 1}, {y: 2}]
  };
  var t4Times = [];
  for (var i = 0; i < iterations; i++) {
    var start = performance.now();
    util.deserialize(util.serialize(t4Data));
    t4Times.push(performance.now() - start);
  }

  // print results at the end
  // console.log("--- Latency Results (local) ---");
  // console.log("T2 (base types) avg:", avg(t2Times).toFixed(4), "ms");
  // console.log("T3 (functions) avg:", avg(t3Times).toFixed(4), "ms");
  // console.log("T4 (complex obj) avg:", avg(t4Times).toFixed(4), "ms");

  // test passes if we got here
  expect(t2Times.length).toBe(iterations);
  expect(t3Times.length).toBe(iterations);
  expect(t4Times.length).toBe(iterations);
});
