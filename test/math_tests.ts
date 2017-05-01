import { test } from "ava";
import thing from "../src/index";

const someValues = [1, 2, 3, 4];

test("sum", async t => {
    const expected = someValues.reduce((r, v) => r + v, 0);
    t.is(await thing(someValues).sum(), expected);

    const objs = thing(someValues).map(v => ({theNum: v, theString: v.toString()}));
    t.is(await objs.sum(o => o.theNum), expected);
});

test("mean", async t => {
    const expected = someValues.reduce((r, v) => r + v, 0) / someValues.length;
    t.is(await thing(someValues).mean(), expected);

    const objs = thing(someValues).map(v => ({theNum: v, theString: v.toString()}));
    t.is(await objs.mean(o => o.theNum), expected);
});
