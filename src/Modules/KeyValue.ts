export interface KeyValue<V> {
    Key: string
    Value: V
}
export default class KeyValueArray<V> {
    public readonly keys: Array<string> = new Array<string>();
    public readonly values: Array<V> = new Array<V>();

    constructor(items?: any[][]) {
        if (!items) return;
        items.forEach((i) => {
            this.keys.push(<string>i[0]);
            this.values.push(<V>i[1]);
        });
    }
    private toKeyValue(key: string, value: V | null): KeyValue<V> {
        return { Key: key, Value: <V>value };
    }
    public Add(key: string, value: V): KeyValue<V> {
        if (this.keys.indexOf(key) !== -1) return this.toKeyValue(key, null);
        this.keys.push(key);
        this.values.push(value);
        return this.toKeyValue(key, value);
    }
    public Item(key: string): V {
        return this.values[this.keys.indexOf(key)];
    }
    public ItemAt(index: number): KeyValue<V> {
        return this.toKeyValue(this.keys[index], this.values[index]);
    }
    public hasKey(key: string): boolean {
        return (this.keys.indexOf(key) !== -1)
    }
    public hasValue(value: V): boolean {
        return (this.values.indexOf(value) !== -1)
    }
    public Set(key: string, value: V) {
        this.values[this.keys.indexOf(key)] = value;
    }
    public Remove(key: string) {
        this.values.splice(this.keys.indexOf(key), 1);
        this.keys.splice(this.keys.indexOf(key), 1);
    }
    public RemoveAt(index: number): V {
        return this.values.splice(index, 1)[0];
    }
}
export interface Command {
    aliases: string[]
    description: string
    handler: Function
    handlerName: string
    prefix: string
    isActive: boolean
    isPrivileged: boolean
    allowedUsers: string[] | null | undefined
    stopPropagation: boolean
    fallback: Function | null
    fallbackName: string | null
}
export interface DataReference {
    reference: string
    data: any
}