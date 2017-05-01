import { thing } from "./async_thing";


async function main() {
    const things = thing([1, 2, 3]);

    const arr1 = await things.map(t => t * 2).toArray();
    const arr2 = await things.toArray();


    const total = await things.sum();
    const strings = await thing(["bla", "blo"]).toArray();
    // strings.sum();

    // console.log(arr2);
}
main();
