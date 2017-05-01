export default function register() {
    (Symbol as any).asyncIterator = Symbol.asyncIterator !== undefined
        ? Symbol.asyncIterator
        : "__@@asyncIterator__";
}
