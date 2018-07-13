import { AsyncThing } from "./async_thing";
import { AsyncThingBase } from "./async_thing_base";
import registerShims from "./shims";

registerShims();

export class AsyncThingMath<T> extends AsyncThingBase<T> {
    public sum(this: AsyncThing<number>): Promise<number>;
    public sum(selector: (item: T) => number): Promise<number>;
    public async sum(selector?: (item: T) => number): Promise<number> {
        if (selector === undefined) {
            selector = (i: any) => i as number;
        }

        return this.map(selector).reduce((acc, i) => acc + i, 0);
    }

    public mean(this: AsyncThing<number>): Promise<number>;
    public mean(selector: (item: T) => number): Promise<number>;
    public async mean(selector?: (item: T) => number): Promise<number> {
        if (selector === undefined) {
            selector = (i: any) => i as number;
        }

        const r = await this
            .map(selector)
            .reduce((acc, i) => ({
                total: acc.total + i,
                count: acc.count + 1,
            }), {
                total: 0,
                count: 0,
            });

        return r.total / r.count;
    }
}
