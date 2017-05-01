import { test } from "ava";
import thing from "../src/index";

const sampleValues = [1, 2, 3];

test("map simple sync", async t => {
    t.deepEqual(await thing(sampleValues).map(v => v * 2).toArray(), sampleValues.map(v => v * 2));
});

function wait(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), milliseconds);
    });
}

test("map async", async t => {
    const values = thing(sampleValues).map(async v => {
        await wait(100);
        return v * 2;
    });

    t.deepEqual(await values.toArray(), sampleValues.map(v => v * 2));
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
