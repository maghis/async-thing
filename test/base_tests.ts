import { test } from "ava";
import thing from "../src/index";

const sampleValues = [1, 2, 3];

function wait(milliseconds: number = 0): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), milliseconds);
    });
}

function testPromise<T>(value: T) {
    let resolvePromise: (() => void) | undefined;
    const promise = new Promise<void>(res => resolvePromise = res);
    const ret = {
        processing: false,
        resolved: false,
        resolve: async () => {
            if (resolvePromise) { resolvePromise(); }
            await wait(0);
        },
        awaitable: async () => {
            ret.processing = true;
            await promise;
            ret.resolved = true;

            return value;
        },
    };
    return ret;
}

test("map simple sync", async t => {
    t.deepEqual(await thing(sampleValues).map(v => v * 2).toArray(), sampleValues.map(v => v * 2));
});

test("map async", async t => {
    const values = thing(sampleValues).map(async v => {
        await wait(100);
        return v * 2;
    });

    t.deepEqual(await values.toArray(), sampleValues.map(v => v * 2));
});

test("map concurrency 1", async t => {
    const items = sampleValues.map(v => testPromise(v));
    const resPromise = thing(items).map(async v => await v.awaitable()).toArray();

    // let the event loop do 1 round
    await wait(0);

    // we should be blocked on the first
    t.is(items[0].processing, true);
    t.is(items[1].processing, false);

    // resolve the first
    await items[0].resolve();
    t.is(items[0].resolved, true);
    t.is(items[1].processing, true);
    t.is(items[2].processing, false);

    // resolve the last
    await items[2].resolve();
    t.is(items[1].resolved, false);
    t.is(items[2].processing, false);

    // resolve the second
    await items[1].resolve();
    t.is(items[1].resolved, true);
    t.is(items[2].resolved, true);

    t.deepEqual(await resPromise, sampleValues);
});

test("map concurrency 2", async t => {
    const items = sampleValues.map(v => testPromise(v));
    const resPromise = thing(items).map(async v => await v.awaitable(), 2).toArray();

    // let the event loop do 1 round
    await wait(0);

    // we should be processing the first 2
    t.is(items[0].processing, true);
    t.is(items[1].processing, true);
    t.is(items[2].processing, false);

    // resolve the first
    await items[0].resolve();
    t.is(items[0].resolved, true);
    t.is(items[1].processing, true);
    t.is(items[2].processing, true);

    // resolve the last
    await items[2].resolve();
    t.is(items[1].resolved, false);
    t.is(items[2].resolved, true);

    // resolve the second
    await items[1].resolve();
    t.is(items[1].resolved, true);
    t.is(items[2].resolved, true);

    t.deepEqual(await resPromise, sampleValues);
});

test("filter", async t => {
    t.deepEqual(await thing(sampleValues).filter(v => v > 1).toArray(), sampleValues.filter(v => v > 1));
});

test("count", async t => {
    t.deepEqual(await thing(sampleValues).count(), sampleValues.length);
});

test("reduce", async t => {
    t.is(await thing(sampleValues).reduce((r, v) => r + 1, 0), sampleValues.length);
});

test("reduceBy", async t => {
    const someValues = [
        "foo",
        "bar",
        "bar",
        "baz",
    ];

    const counts = await thing(someValues).reduceBy(v => v, (r, v) => r + 1, 0);

    t.is(counts["foo"], 1);
    t.is(counts["bar"], 2);
    t.is(counts["baz"], 1);
});

test("countBy", async t => {
    const someValues = [
        "foo",
        "bar",
        "bar",
        "baz",
    ];

    const counts = await thing(someValues).countBy(v => v);

    t.is(counts["foo"], 1);
    t.is(counts["bar"], 2);
    t.is(counts["baz"], 1);
});

test("groupBy", async t => {
    const someValues = [1, 2, 3, 4];

    const groups = await thing(someValues)
        .groupBy(v => v % 2 ? "odd" : "even");

    t.deepEqual(groups["odd"], [1, 3]);
    t.deepEqual(groups["even"], [2, 4]);
});
