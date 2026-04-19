/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solfit.json`.
 */
export type Solfit = {
  "address": "Bhxa6QHF3mJL36ak12mr9kzHLnZXjBv1q8MQHkz54VHe",
  "metadata": {
    "name": "solfit",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Pushup race on Solana"
  },
  "instructions": [
    {
      "name": "createContest",
      "discriminator": [
        129,
        189,
        164,
        27,
        152,
        242,
        123,
        93
      ],
      "accounts": [
        {
          "name": "contest",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "contestId"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "contestId",
          "type": "u64"
        },
        {
          "name": "wager",
          "type": "u64"
        },
        {
          "name": "maxPlayers",
          "type": "u8"
        },
        {
          "name": "duration",
          "type": "u32"
        },
        {
          "name": "judge",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "joinContest",
      "discriminator": [
        247,
        243,
        77,
        111,
        247,
        254,
        100,
        133
      ],
      "accounts": [
        {
          "name": "contest",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "refundTimeout",
      "discriminator": [
        142,
        147,
        135,
        70,
        231,
        198,
        23,
        207
      ],
      "accounts": [
        {
          "name": "contest",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "settle",
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "contest",
          "writable": true
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "scores",
          "type": {
            "vec": "u32"
          }
        }
      ]
    },
    {
      "name": "withdrawRefund",
      "discriminator": [
        220,
        99,
        224,
        50,
        13,
        71,
        215,
        101
      ],
      "accounts": [
        {
          "name": "contest",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "contest",
      "discriminator": [
        216,
        26,
        88,
        18,
        251,
        80,
        201,
        96
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidMaxPlayers",
      "msg": "max_players must be between 2 and 8"
    },
    {
      "code": 6001,
      "name": "invalidDuration",
      "msg": "duration must be positive"
    },
    {
      "code": 6002,
      "name": "notOpen",
      "msg": "contest is not in Open state"
    },
    {
      "code": 6003,
      "name": "full",
      "msg": "contest is full"
    },
    {
      "code": 6004,
      "name": "alreadyJoined",
      "msg": "already joined"
    },
    {
      "code": 6005,
      "name": "notActive",
      "msg": "contest is not Active"
    },
    {
      "code": 6006,
      "name": "deadlineNotPassed",
      "msg": "deadline has not passed yet"
    },
    {
      "code": 6007,
      "name": "notWinner",
      "msg": "winner account does not match the on-chain-computed winner"
    },
    {
      "code": 6008,
      "name": "mathOverflow",
      "msg": "arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "badJudgeSignature",
      "msg": "judge signature is missing, malformed, or from the wrong pubkey"
    },
    {
      "code": 6010,
      "name": "messageMismatch",
      "msg": "signed message does not match the expected (contest, scores) tuple"
    },
    {
      "code": 6011,
      "name": "scoreLengthMismatch",
      "msg": "scores length must equal players length"
    },
    {
      "code": 6012,
      "name": "refundWindowNotReached",
      "msg": "refund grace window has not passed yet"
    },
    {
      "code": 6013,
      "name": "notRefunding",
      "msg": "contest is not Refunding"
    },
    {
      "code": 6014,
      "name": "notAPlayerOfContest",
      "msg": "signer is not a player of this contest"
    },
    {
      "code": 6015,
      "name": "alreadyRefunded",
      "msg": "this player has already refunded"
    }
  ],
  "types": [
    {
      "name": "contest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "contestId",
            "type": "u64"
          },
          {
            "name": "wager",
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "type": "u8"
          },
          {
            "name": "duration",
            "type": "u32"
          },
          {
            "name": "judge",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "players",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "finalScores",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "withdrawn",
            "type": {
              "vec": "bool"
            }
          }
        ]
      }
    }
  ]
};
