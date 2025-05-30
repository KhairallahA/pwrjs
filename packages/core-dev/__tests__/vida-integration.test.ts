import { describe, test, vi, expect } from 'vitest';
import {
    VidaTransactionSubscription,
    ProcessVidaTransactions,
} from '../src/protocol/vida';
import { VidaDataTransaction } from '../src/record/vidaDataTransaction';
import { PWRJS } from '../src';

describe('VidaTransactionSubscription Integration Test (Real Objects)', () => {
    // Increase timeout if needed because this test hits the real endpoint.
    // vi.setTimeout(10000);

    test(
        'should run one poll cycle without errors and then stop',
        async () => {
            const rpc = 'https://pwrrpc.pwrlabs.io';
            const pwrjs: PWRJS = new PWRJS(rpc);

            // Real handler that logs the transaction.
            const handler: ProcessVidaTransactions = (transaction: VidaDataTransaction): void => {
                // console.log('--------- txn ---------');
                // console.log(transaction);
            };

            const vidaId = BigInt(705);
            const startingBlock = BigInt(460100);
            const pollInterval = 200; // short interval for testing

            // Create the subscription.
            const subscription = new VidaTransactionSubscription(
                pwrjs,
                vidaId,
                startingBlock,
                handler,
                pollInterval
            );

            // Start the subscription.
            const startPromise = subscription.start();

            // Wait long enough for one poll cycle.
            await new Promise((resolve) =>
                setTimeout(resolve, pollInterval * 2)
            );

            // Stop the subscription.
            subscription.stop();

            // Await the termination of the polling loop.
            await startPromise;

            // Test passes if no errors were thrown.
            expect(true).toBe(true);
        },
        {
            timeout: 10000,
        }
    );
});
