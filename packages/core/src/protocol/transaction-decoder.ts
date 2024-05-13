import { Log, ethers } from 'ethers';
import { Transaction } from '../record/transaction';
import { Transaction_ID } from '../static/enums/transaction.enum';
import PWRJS from './pwrjs';
import { HexToBytes, bytesToHex } from '../utils';

// import ethUtil from 'ethereumjs-util';

export default class TransactionDecoder {
    public decode(txn: Uint8Array) {
        const sender = this.getSender(txn);

        const senderBytes = HexToBytes(sender.toLowerCase());
        return this.decode2(txn, senderBytes);
    }

    private decode2(txn: Uint8Array, sender: Uint8Array) {
        const txnDv = new DataView(txn.buffer, txn.byteOffset, txn.byteLength);

        // nonce is always 4 bytes, after identifies (1byte) and chainId (1byte)
        const nonce = txnDv.getInt32(2, false);

        switch (txn[0]) {
            case Transaction_ID.TRANSFER:
                return this.decodeTransfer(txn, sender, nonce);

            case Transaction_ID.JOIN:
                return this.decodeJoin(txn, sender, nonce);

            case Transaction_ID.CLAIM_SPOT:
                return this.decodeClaimSpot(txn, sender, nonce);

            case Transaction_ID.DELEGATE:
                return this.decodeDelegate(txn, sender, nonce);

            case Transaction_ID.WITHDRAW:
                return this.decodeWithdraw(txn, sender, nonce);

            case Transaction_ID.VM_DATA_TXN:
                return this.decodeVmDataTxn(txn, sender, nonce);

            case Transaction_ID.CLAIM_VM_ID:
                return this.decodeClaimVmId(txn, sender, nonce);

            case Transaction_ID.SET_GUARDIAN:
                return this.decodeSetGuardian(txn, sender, nonce);

            case Transaction_ID.REMOVE_GUARDIAN:
                return this.decodeRemoveGuardianTxn(txn, sender, nonce);

            case Transaction_ID.GUARDIAN_TXN:
                throw new Error('Guardian transaction not implemented');

            case Transaction_ID.PAYABLE_VM_DATA_TXN:
                throw new Error('Payable VM Data transaction not implemented');

            case Transaction_ID.CONDUIT_TXN:
                throw new Error('Conduit transaction not implemented');

            case Transaction_ID.SET_CONDUIT:
                throw new Error('Set Conduit transaction not implemented');

            case Transaction_ID.ADD_CONDUITS:
                throw new Error('Add Conduits transaction not implemented');

            case Transaction_ID.REMOVE_CONDUITS:
                throw new Error('Remove Conduits transaction not implemented');

            case Transaction_ID.MOVE_STAKE:
                throw new Error('Move Stake transaction not implemented');

            default:
                throw new Error('Invalid transaction type');
        }
    }

    public decodeTransfer(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ): {
        sender: string;
        receiver: string;
        value: string;
        nonce: number;
        size: number;
        rawTransaction: Uint8Array;
        chainId: number;
    } {
        if (txn.length !== 34 && txn.length !== 99) {
            throw new Error('Invalid txn length for transfer txn');
        }

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );

        const amount = dataView.getBigInt64(6, false); // Read amount as BigInt for precision

        const recipientBytes = new Uint8Array(txn.buffer, 14, 20); // Extract recipient address bytes
        const senderHex = `0x${bytesToHex(sender)}`;
        const recipientHex = `0x${bytesToHex(recipientBytes)}`;

        return {
            sender: senderHex,
            receiver: recipientHex,
            value: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeJoin(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 79 || txn.length > 87) {
            throw new Error('Invalid length for join txn');
        }

        // Layout:
        // Identifier - 1
        // chain id - 1
        // Nonce - 4
        // ip - X (variable length)
        // signature - 65

        const ipStartIndex = 6; // After identifier (1), chain id (1), and nonce (4)
        const ipLength = txn.length - 71; // Total length minus the length of the other known components
        const ipBytes = new Uint8Array(
            txn.buffer,
            txn.byteOffset + ipStartIndex,
            ipLength
        ); // Extract IP bytes

        // Convert IP byte array to UTF-8 string
        const textDecoder = new TextDecoder('utf-8');
        const ip = textDecoder.decode(ipBytes);

        const senderHex = `0x${bytesToHex(sender)}`;

        return {
            sender: senderHex,
            nonce: nonce,
            size: txn.length,
            ip: ip,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeClaimSpot(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length != 71)
            throw new Error('Invalid length for claim spot txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * signature - 65
         * */

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeDelegate(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (
            txn.length != 34 /*Without Signature*/ &&
            txn.length != 99 /*With Signature*/
        )
            throw new Error('Invalid length for delegate txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * validator - 20
         * signature - 65*/

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );
        const amount = dataView.getBigInt64(6, false);

        // Extract validator address which starts at byte 14 and is 20 bytes long
        const validatorStart = 14;
        const validatorBytes = new Uint8Array(txn.buffer, validatorStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const validatorHex = `0x${bytesToHex(validatorBytes)}`;

        return {
            sender: senderHex,
            validator: validatorHex,
            amount: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeWithdraw(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (
            txn.length != 34 /*Without Signature*/ &&
            txn.length != 99 /*With Signature*/
        )
            throw new Error('Invalid length for withdraw txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * amount - 8
         * validator - 20
         * signature - 65*/

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );

        const amount = dataView.getBigInt64(6, false);

        // Extract validator address which starts at byte 14 and is 20 bytes long
        const validatorStart = 14;
        const validatorBytes = new Uint8Array(txn.buffer, validatorStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const validatorHex = `0x${bytesToHex(validatorBytes)}`;

        return {
            sender: senderHex,
            validator: validatorHex,
            sharesAmount: amount.toString(),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeVmDataTxn(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (txn.length < 14) {
            throw new Error('Invalid length for VM Data txn');
        }

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * External VM ID - 8
         * Data - x
         * signature - 65
         * */

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );

        const externalVmId = dataView.getBigUint64(6, false); // Assuming little-endian-

        let dataLength;
        const senderHex = bytesToHex(sender);

        console.log('senderHex', senderHex);

        if (PWRJS.isVmAddress(senderHex)) {
            // Assuming `isVmAddress` checks if the address is a VM
            dataLength = txn.length - 14;
        } else {
            dataLength = txn.length - 79; // Adjusted for the presence of a signature
        }

        console.log('dataLength', dataLength);

        const data = new Uint8Array(
            txn.buffer,
            txn.byteOffset + 14,
            dataLength
        ); // Data starts after the VM ID

        console.log('data', data);

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            vmId: externalVmId.toString(), // Converting BigInt to string for safety in JS environments
            data: `0x${bytesToHex(data)}`,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeClaimVmId(txn: Uint8Array, sender: Uint8Array, nonce: number) {
        if (
            txn.length != 14 /*Without Signature*/ &&
            txn.length != 79 /*With Signature*/
        )
            throw new Error('Invalid length for claim vm id txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * External VM ID - 8
         * signature - 65
         * */

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );

        const vmId = dataView.getBigUint64(6, false); // Assuming little-endian

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            vmId: vmId.toString(),
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeSetGuardian(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length != 99)
            throw new Error('Invalid length for set guardian txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * Long - 8
         * address - 20
         * signature - 65
         * */

        const dataView = new DataView(
            txn.buffer,
            txn.byteOffset,
            txn.byteLength
        );

        // get the expiry date
        const expiryDateMil = dataView.getBigInt64(6, false); // Little-endian

        // Extract guardian address which starts at byte 14 and is 20 bytes long
        const guardianStart = 14;
        const guardianBytes = new Uint8Array(txn.buffer, guardianStart, 20);

        // Convert byte arrays to hex strings
        const senderHex = `0x${bytesToHex(sender)}`;
        const guardianHex = `0x${bytesToHex(guardianBytes)}`;

        return {
            sender: senderHex,
            guardian: guardianHex,
            expiryDate: Number(expiryDateMil),
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    public decodeRemoveGuardianTxn(
        txn: Uint8Array,
        sender: Uint8Array,
        nonce: number
    ) {
        if (txn.length != 71)
            throw new Error('Invalid length for remove guardian txn');

        /*
         * Identifier - 1
         * chain id - 1
         * Nonce - 4
         * signature - 65
         * */

        return {
            sender: `0x${bytesToHex(sender)}`,
            nonce: nonce,
            size: txn.length,
            rawTransaction: txn,
            chainId: txn[1],
        };
    }

    // private static decodeWithdraw(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeVmDataTxn(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeClaimVmId(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeRemoveValidator(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeSetGuardian(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeRemoveGuardian(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeGuardianTxn(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodePayableVmDataTxn(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeConduitTxn(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeSetConduit(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeAddConduits(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeRemoveConduits(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // private static decodeMoveStake(
    //     txn: Uint8Array,
    //     sender: Uint8Array
    // ): Transaction {}

    // *~~~ asd ~~~
    private getSender(txn: Uint8Array) {
        const signature = new Uint8Array(65);
        const txnData = new Uint8Array(txn.length - 65);

        // Copy the first part of txn to txnData
        txnData.set(new Uint8Array(txn.buffer, txn.byteOffset, txnData.length));

        // Copy the last 65 bytes of txn to signature
        signature.set(
            new Uint8Array(txn.buffer, txn.byteOffset + txnData.length, 65)
        );

        return TransactionDecoder.getSigner(txnData, signature);
    }

    static getSigner(txn: Uint8Array, signature: Uint8Array) {
        // Extract r, s, and v from the signature
        const r = ethers.hexlify(signature.slice(0, 32));
        const s = ethers.hexlify(signature.slice(32, 64));
        const v = signature[64];

        // Create a signature object expected by Ethers
        const fullSignature = {
            r: r,
            s: s,
            v: v,
        };

        // Compute the message digest (hash) of the transaction
        const messageHash = ethers.keccak256(txn);

        // Recover the address
        const recoveredAddress = ethers.recoverAddress(
            messageHash,
            fullSignature
        );

        return recoveredAddress;
    }
}