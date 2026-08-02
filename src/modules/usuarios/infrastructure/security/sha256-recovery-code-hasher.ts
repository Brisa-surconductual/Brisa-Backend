import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { RecoveryCodeHasher } from "../../application/ports/recovery-code-hasher";

@Injectable()
export class Sha256RecoveryCodeHasher implements RecoveryCodeHasher {

    async hash(code: string): Promise<string> {
        return createHash("sha256")
            .update(code)
            .digest("hex");
    }

    async compare(code: string, hash: string): Promise<boolean> {

        const generated =
            createHash("sha256")
                .update(code)
                .digest("hex");

        return generated === hash;
    }
}