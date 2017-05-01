import { test } from "ava";
import { thing } from "../src/async_thing";

test("multiple iterations", async t => {
    const someValues = [1, 2, 3, "foo", "bar"];
    t.deepEqual(await thing(someValues).toArray(), someValues);
    t.deepEqual(await thing(someValues).toArray(), someValues);
});
