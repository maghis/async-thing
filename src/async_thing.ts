import { AsyncThingMath } from "./async_thing_math";
import registerShims from "./shims";

registerShims();


type AnyIterable<T> = AsyncThing<T> | AsyncIterable<T> | Iterable<T>;
function isAsyncThing<T>(iterable: AnyIterable<T>): iterable is AsyncThing<T> {
    return (iterable as any).isAsyncThing === true;
}

function isAsyncIterable<T>(iterable: AnyIterable<T>): iterable is AsyncIterable<T> {
    return (iterable as any)[Symbol.asyncIterator] === "function";
}

export class AsyncThing<T> extends AsyncThingMath<T> {
    public readonly isAsyncThing: true;
}

export function thing<T>(iterable: AnyIterable<T>): AsyncThing<T> {
    if (isAsyncThing(iterable)) {
        return iterable;
    }

    if (isAsyncIterable(iterable)) {
        return new AsyncThing<T>(() => {
            return iterable[Symbol.asyncIterator]();
        });
    }

    return new AsyncThing<T>(async function* asyncWrapper(): AsyncIterator<T> {
        for (const item of iterable) {
            yield item;
        }
    });
}
