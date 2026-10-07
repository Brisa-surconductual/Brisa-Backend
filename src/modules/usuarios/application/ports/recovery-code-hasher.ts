export abstract class RecoveryCodeHasher {
    abstract hash(code: string): Promise<string>;
    abstract compare(code: string, hash: string): Promise<boolean>;
}