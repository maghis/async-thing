import { AsyncThing } from "./async_thing";
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

    public async reduce<U>(reduce: (acc: U, item: T) => Promise<U> | U, init: U): Promise<U> {
        let acc = init;
        for await (const item of this) {
            acc = await reduce(acc, item);
        }

        return acc;
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
