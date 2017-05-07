import { AsyncThingMath } from "./async_thing_math";
import registerShims from "./shims";

registerShims();

export type AnyIterable<T> = AsyncThing<T> | AsyncIterable<T> | Iterable<T>;

function isAsyncThing<T>(iterable: AnyIterable<T>): iterable is AsyncThing<T> {
    return (iterable as any).isAsyncThing === true;
}

function isAsyncIterable<T>(iterable: AnyIterable<T>): iterable is AsyncIterable<T> {
    return typeof (iterable as any)[Symbol.asyncIterator] === "function";
}

export class AsyncThing<T> extends AsyncThingMath<T> {
    public static empty<T>() {
        return new AsyncThing<T>((() => ({
            next: () => Promise.resolve({ done: true }),
        })));
    }

    public static single<T>(item: T) {
        return new AsyncThing<T>(async function* single() {
            yield item;
        });
    }

    public readonly isAsyncThing = true;
}

export function thing<T>(iterable: AnyIterable<T>): AsyncThing<T> {
    if (isAsyncThing(iterable)) {
        return iterable;
    }

    const getAsyncIterator = isAsyncIterable(iterable)
        ? () => iterable[Symbol.asyncIterator]()
        : (async function* asyncWrapper(): AsyncIterator<T> {
            for (const item of iterable) {
                yield item;
            }
        });

    return new AsyncThing<T>(getAsyncIterator);
}
