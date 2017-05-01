import { test } from "ava";
import thing from "../src/index";
import registerShims from "../src/shims";

const sampleValues = [1, 2, 3, "foo", "bar"];

test("multiple iterations", async t => {
    t.deepEqual(await thing(sampleValues).toArray(), sampleValues);
    t.deepEqual(await thing(sampleValues).toArray(), sampleValues);
});

test("from Iterable", async t => {
    t.deepEqual(await thing(sampleValues).toArray(), sampleValues);
});

test("from AsyncIterable", async t => {
    const asyncIterable = (async function* wrapper() {
        for (const value of sampleValues) {
            yield value;
        }
    })();

    t.deepEqual(await thing(asyncIterable).toArray(), sampleValues);
});

test("from AsyncThing", async t => {
    t.deepEqual(await thing(thing(sampleValues)).toArray(), sampleValues);
});
