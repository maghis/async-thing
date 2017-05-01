import { AsyncThing } from "./async_thing";
import registerShims from "./shims";

registerShims();

export class AsyncThingBase<T> implements AsyncIterable<T> {
    constructor(private getIterator: () => AsyncIterator<T>) { }

    public [Symbol.asyncIterator](): AsyncIterator<T> {
        const ret = this.getIterator();
        return ret;
    }

    public map<U>(func: (item: T) => Promise<U> | U): AsyncThing<U> {
        const iterable = this;
        return new AsyncThing<U>(async function* map() {
            for await (const item of iterable) {
                yield await func(item);
            }
        });
    }

    public filter(expr: (item: T) => Promise<boolean> | boolean): AsyncThing<T> {
        const iterable = this;
        return new AsyncThing<T>(async function* filter() {
            for await (const item of iterable) {
                if (await expr(item)) {
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

    public async toArray(): Promise<T[]> {
        return await this.reduce((acc, item) => {
            acc.push(item);
            return acc;
        }, [] as T[]);
    }
}
