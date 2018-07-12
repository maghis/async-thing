export default function register() {
    if (typeof (Symbol as any).asyncIterator === "undefined") {
        (Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
    }
}
