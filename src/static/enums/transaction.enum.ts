export enum Transaction_ID {
    TRANSFER = 0,
    JOIN = 1,
    CLAIM_SPOT = 2,
    DELEGATE = 3,
    WITHDRAW = 4,
    VM_DATA_TXN = 5,
    CLAIM_VM_ID = 6,
    // REMOVE_VALIDATOR = 7,
    SET_GUARDIAN = 8,
    REMOVE_GUARDIAN = 9,
    GUARDIAN_TXN = 10,
    PAYABLE_VM_DATA_TXN = 11,
    CONDUIT_TXN = 12,
    SET_CONDUIT = 13,
    ADD_CONDUITS = 14,
    REMOVE_CONDUITS = 15,
    MOVE_STAKE = 16,

    //
    CHANGE_EARLY_WITHDRAW_PENALTY_PROPOSAL = 17,
    CHANGE_FEE_PER_BYTE_PROPOSAL = 18,
    CHANGE_MAX_BLOCK_SIZE_PROPOSAL = 19,
    CHANGE_MAX_TXN_SIZE_PROPOSAL = 20,
    CHANGE_OVERALL_BURN_PERCENTAGE_PROPOSAL = 21,
    CHANGE_REWARD_PER_YEAR_PROPOSAL_TXN = 22,
    CHANGE_VALIDATOR_COUNT_LIMIT_PROPOSAL = 23,
    CHANGE_VALIDATOR_JOINING_FEE_PROPOSAL = 24,
    CHANGE_VM_ID_CLAIMING_FEE_PROPOSAL = 25,
    CHANGE_VM_OWNER_TXN_FEE_SHARE_PROPOSAL = 26,
    OTHER_PROPOSAL_TXN = 27,
    VOTE_ON_PROPOSAL_TXN = 28,

    // Falcon transactions types
    FALCON_SET_PUBLIC = 1001,
    FALCON_JOIN_AS_VALIDATOR = 1002,
    FALCON_DELEGATE = 1003,
    FALCON_CHANGE_IP = 1004,
    FALCON_ACTIVE_NODE_SPOT = 1005,
    FALCON_TRANSFER_PWR = 1006,
    FALCON_VM_DATA = 1007,
}
