import { expect } from "chai";

export async function expectRevert(
    promise: Promise<unknown>,
    fragment?: string | RegExp
): Promise<void> {
    try {
        await promise;
        expect.fail("Expected transaction to revert");
    } catch (err: unknown) {
        const message =
            err && typeof err === "object" && "message" in err
                ? String((err as { message: string }).message)
                : String(err);
        if (fragment) {
            if (typeof fragment === "string") {
                expect(message).to.include(fragment);
            } else {
                expect(message).to.match(fragment);
            }
        }
    }
}
