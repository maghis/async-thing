import { AsyncThing, thing } from "./async_thing";
import registerShims from "./shims";

registerShims();

async function* concurrentMap<T, U>(iterable: AsyncIterable<T>, func: (item: T) => Promise<U> | U, concurrency: number) {
    const inProgress: (Promise<U> | U)[] = [];
    const iterator = iterable[Symbol.asyncIterator]();
    while (true) {
        let iteratorResult;
        while (inProgress.length < concurrency
            && !(iteratorResult = await iterator.next()).done) {
            inProgress.push(func(iteratorResult.value));
        }

        if (inProgress.length === 0) {
            break;
        }

        yield await inProgress.splice(0, 1)[0];
    }
}

export class AsyncThingBase<T> implements AsyncIterable<T> {
    constructor(private getIterator: () => AsyncIterator<T>) { }

    public [Symbol.asyncIterator](): AsyncIterator<T> {
        const ret = this.getIterator();
        return ret;
    }

    public map<U>(func: (item: T) => Promise<U>, concurrency?: number): AsyncThing<U>;
    public map<U>(func: (item: T) => U): AsyncThing<U>;
    public map<U>(func: (item: T) => Promise<U> | U, concurrency: number = 1): AsyncThing<U> {
        const iterable = this;
        return new AsyncThing<U>(() => concurrentMap(iterable, func, concurrency));
    }

    public filter(expr: (item: T) => Promise<boolean>, concurrency?: number): AsyncThing<T>;
    public filter(expr: (item: T) => boolean): AsyncThing<T>;
    public filter(expr: (item: T) => Promise<boolean> | boolean, concurrency: number = 1): AsyncThing<T> {
        const mapper = async (item: T) => ({
            item,
            result: await expr(item),
        });

        const iterable = this;
        return new AsyncThing<T>(async function* filter() {
            for await (const item of concurrentMap(iterable, mapper, concurrency)) {
                if (item.result) {
                    yield item.item;
                }
            }
        });
    }

    public concat<U>(sequence: AsyncIterable<U> | Iterable<U>) {
        const first = this;
        const second = thing(sequence);
        return new AsyncThing<T>(async function* concat() {
            yield* first;
            yield* second;
        });
    }

    public take(count: number) {
        if (count === 0) {
            return AsyncThing.empty<T>();
        }

        const iterable = this;
        return new AsyncThing<T>(async function* take() {
            let taken = 0;
            for await (const item of iterable) {
                yield item;
                if (++taken >= count) {
                    break;
                }
            }
        });
    }

    public skip(count: number) {
        if (count === 0) {
            return this;
        }

        const iterable = this;
        return new AsyncThing<T>(async function* skip() {
            let skipped = 0;
            for await (const item of iterable) {
                if (++skipped > count) {
                    yield item;
                }
            }
        });
    }

    public async reduce<U>(reduce: (acc: U, item: T) => Promise<U> | U, init: U): Promise<U> {
        let acc = init;
        for await (const item of this) {
            acc = await reduce(acc, item);
        }

        return acc;
    }

    public async reduceBy<U>(
        selector: (item: T) => Promise<string> | string,
        reduce: (acc: U, item: T) => Promise<U> | U,
        init: (() => U) | U,
    ): Promise<{ [key: string]: U }> {
        const ret: { [key: string]: U } = {};
        for await (const item of this) {
            const key = await selector(item);
            if (ret[key] === undefined) {
                ret[key] = typeof init === "function" ? init() : init;
            }

            ret[key] = await reduce(ret[key], item);
        }

        return ret;
    }

    public async groupBy(selector: (item: T) => Promise<string> | string) {
        return this.reduceBy(selector, (group, item) => {
            group.push(item);
            return group;
        }, () => [] as T[]);
    }

    public async countBy(selector: (item: T) => Promise<string> | string) {
        return this.reduceBy(selector, (count, _) => count + 1, 0);
    }

    public async toArray(): Promise<T[]> {
        return await this.reduce((acc, item) => {
            acc.push(item);
            return acc;
        }, [] as T[]);
    }

    public async count(): Promise<number> {
        return await this.reduce((acc, _) => acc + 1, 0);
    }
}
