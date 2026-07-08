/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/gibmoni.json`.
 */
export type Gibmoni = {
  "address": "9qmeNAZdQvMnrpj8mC6Yi8w9EoJPfzjD6ayYhrKpnquY",
  "metadata": {
    "name": "gibmoni",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "approveMilestone",
      "discriminator": [
        145,
        85,
        92,
        60,
        50,
        130,
        219,
        106
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  84,
                  82,
                  69,
                  65,
                  83,
                  85,
                  82,
                  89
                ]
              }
            ]
          }
        },
        {
          "name": "projectAuthority",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "cancelUnfundedProject",
      "discriminator": [
        13,
        161,
        156,
        212,
        112,
        41,
        71,
        24
      ],
      "accounts": [
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "claimRefund",
      "discriminator": [
        15,
        16,
        30,
        161,
        255,
        228,
        97,
        60
      ],
      "accounts": [
        {
          "name": "funder",
          "writable": true,
          "signer": true,
          "relations": [
            "contribution"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          },
          "relations": [
            "contribution"
          ]
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              }
            ]
          }
        },
        {
          "name": "contribution",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  79,
                  78,
                  84,
                  82,
                  73,
                  66,
                  85,
                  84,
                  73,
                  79,
                  78
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "contributeFund",
      "discriminator": [
        247,
        7,
        157,
        147,
        147,
        134,
        238,
        101
      ],
      "accounts": [
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              }
            ]
          }
        },
        {
          "name": "contribution",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  79,
                  78,
                  84,
                  82,
                  73,
                  66,
                  85,
                  84,
                  73,
                  79,
                  78
                ]
              },
              {
                "kind": "account",
                "path": "funder"
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createMilestone",
      "discriminator": [
        239,
        58,
        201,
        28,
        40,
        186,
        173,
        48
      ],
      "accounts": [
        {
          "name": "milestoneAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  84,
                  82,
                  69,
                  65,
                  83,
                  85,
                  82,
                  89
                ]
              }
            ]
          }
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "milestoneAuthority"
              }
            ]
          }
        },
        {
          "name": "taskQueue",
          "writable": true
        },
        {
          "name": "taskQueueAuthority"
        },
        {
          "name": "task",
          "writable": true
        },
        {
          "name": "queueAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tuktukProgram",
          "address": "tuktukUrfhXT6ZT77QTU8RQtvgL967uRuVagWF57zVA"
        }
      ],
      "args": [
        {
          "name": "milestoneType",
          "type": {
            "defined": {
              "name": "milestoneType"
            }
          }
        },
        {
          "name": "taskId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "createProject",
      "discriminator": [
        148,
        219,
        181,
        42,
        221,
        114,
        145,
        190
      ],
      "accounts": [
        {
          "name": "projectAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "arg",
                "path": "projectName"
              },
              {
                "kind": "account",
                "path": "projectAuthority"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "projectAuthority"
              }
            ]
          }
        },
        {
          "name": "taskQueue",
          "writable": true
        },
        {
          "name": "taskQueueAuthority"
        },
        {
          "name": "task",
          "writable": true
        },
        {
          "name": "queueAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tuktukProgram",
          "address": "tuktukUrfhXT6ZT77QTU8RQtvgL967uRuVagWF57zVA"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createProjectArgs"
            }
          }
        },
        {
          "name": "taskId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  84,
                  82,
                  69,
                  65,
                  83,
                  85,
                  82,
                  89
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeUser",
      "discriminator": [
        111,
        17,
        185,
        250,
        60,
        122,
        38,
        254
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "ixIndex",
          "type": "u8"
        },
        {
          "name": "walletScore",
          "type": "u16"
        },
        {
          "name": "githubScore",
          "type": "u16"
        },
        {
          "name": "scoreTimestamp",
          "type": "i64"
        },
        {
          "name": "oracleSignature",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "retryMilestone",
      "discriminator": [
        56,
        66,
        158,
        4,
        104,
        61,
        172,
        236
      ],
      "accounts": [
        {
          "name": "milestoneAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "milestoneAuthority"
              }
            ]
          }
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "milestoneAuthority"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  65,
                  85,
                  76,
                  84
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  84,
                  82,
                  69,
                  65,
                  83,
                  85,
                  82,
                  89
                ]
              }
            ]
          }
        },
        {
          "name": "taskQueue",
          "writable": true
        },
        {
          "name": "taskQueueAuthority"
        },
        {
          "name": "task",
          "writable": true
        },
        {
          "name": "queueAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  113,
                  117,
                  101,
                  117,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tuktukProgram",
          "address": "tuktukUrfhXT6ZT77QTU8RQtvgL967uRuVagWF57zVA"
        }
      ],
      "args": [
        {
          "name": "taskId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "voteOnMilestone",
      "discriminator": [
        199,
        58,
        102,
        230,
        114,
        211,
        69,
        169
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  85,
                  83,
                  69,
                  82
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  82,
                  79,
                  74,
                  69,
                  67,
                  84
                ]
              },
              {
                "kind": "account",
                "path": "project.project_name",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.project_authority",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "contribution",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  79,
                  78,
                  84,
                  82,
                  73,
                  66,
                  85,
                  84,
                  73,
                  79,
                  78
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "vote",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  86,
                  79,
                  84,
                  69
                ]
              },
              {
                "kind": "account",
                "path": "milestone"
              },
              {
                "kind": "account",
                "path": "voter"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "approve",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "contribution",
      "discriminator": [
        182,
        187,
        14,
        111,
        72,
        167,
        242,
        212
      ]
    },
    {
      "name": "milestone",
      "discriminator": [
        38,
        210,
        239,
        177,
        85,
        184,
        10,
        44
      ]
    },
    {
      "name": "project",
      "discriminator": [
        205,
        168,
        189,
        202,
        181,
        247,
        142,
        19
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    },
    {
      "name": "user",
      "discriminator": [
        159,
        117,
        95,
        227,
        239,
        151,
        58,
        236
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    },
    {
      "name": "vote",
      "discriminator": [
        96,
        91,
        104,
        57,
        145,
        35,
        172,
        155
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "zeroAmount",
      "msg": "Amount cannot be zero."
    },
    {
      "code": 6001,
      "name": "invalidProject",
      "msg": "Project is invalid"
    },
    {
      "code": 6002,
      "name": "invalidMilestoneType",
      "msg": "Invalid milestone type provided."
    },
    {
      "code": 6003,
      "name": "projectNotFunding",
      "msg": "Project is not in funding stage anymore."
    },
    {
      "code": 6004,
      "name": "projectNotDeveloping",
      "msg": "Project is not in developing stage rightnow."
    },
    {
      "code": 6005,
      "name": "projectExpired",
      "msg": "Project funding deadline is execeeded."
    },
    {
      "code": 6006,
      "name": "overflow",
      "msg": "Numerical overflow."
    },
    {
      "code": 6007,
      "name": "notVotingStage",
      "msg": "Milestone is not in voting stage."
    },
    {
      "code": 6008,
      "name": "projectNotFailed",
      "msg": "Project not in failed state"
    },
    {
      "code": 6009,
      "name": "noContribution",
      "msg": "No contribution found for the given user."
    },
    {
      "code": 6010,
      "name": "alreadyRefunded",
      "msg": "Refund already claimed by the user."
    },
    {
      "code": 6011,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in vault."
    },
    {
      "code": 6012,
      "name": "notDisapproved",
      "msg": "You can only retry a milestone in Disapprove stage."
    },
    {
      "code": 6013,
      "name": "maxAttemptsReached",
      "msg": "Maximum number of attempts for the milestone have been reached."
    },
    {
      "code": 6014,
      "name": "notEnoughTimeLeft",
      "msg": "There is not enough time left to conduct a full vote."
    },
    {
      "code": 6015,
      "name": "invalidMilestoneCount",
      "msg": "Invalid milestone count."
    },
    {
      "code": 6016,
      "name": "alreadyVoted",
      "msg": "Vote has been already casted."
    },
    {
      "code": 6017,
      "name": "previousMilestoneNotApproved",
      "msg": "Previous Milestone is not approved yet."
    },
    {
      "code": 6018,
      "name": "invalidDeadline",
      "msg": "Given deadline is invalid."
    },
    {
      "code": 6019,
      "name": "deadlineNotPassed",
      "msg": "Deadline has not passed yet."
    },
    {
      "code": 6020,
      "name": "targetAlreadyReached",
      "msg": "Target amount has already been reached."
    },
    {
      "code": 6021,
      "name": "invalidMilestoneOrder",
      "msg": "Milestones must be created in the correct chronological order."
    },
    {
      "code": 6022,
      "name": "scoreTimestampExpired",
      "msg": "Error while processing the signature."
    },
    {
      "code": 6023,
      "name": "invalidEd25519Program",
      "msg": "Instruction at index 0 is not the Ed25519 program"
    },
    {
      "code": 6024,
      "name": "invalidEd25519DataLength",
      "msg": "Ed25519 instruction data is too short"
    },
    {
      "code": 6025,
      "name": "invalidEd25519IxIndex",
      "msg": "Ed25519 instruction index is incorrect"
    },
    {
      "code": 6026,
      "name": "invalidNumSignatures",
      "msg": "Ed25519 instruction must contain exactly one signature"
    },
    {
      "code": 6027,
      "name": "oraclePubkeyMismatch",
      "msg": "The Oracle Public Key does not match the Ed25519 instruction"
    },
    {
      "code": 6028,
      "name": "oracleMessageMismatch",
      "msg": "The reconstructed message does not match the Ed25519 instruction"
    },
    {
      "code": 6029,
      "name": "oracleSignatureMismatch",
      "msg": "The Oracle Signature does not match the Ed25519 instruction"
    }
  ],
  "types": [
    {
      "name": "contribution",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "funder",
            "type": "pubkey"
          },
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "refunded",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "createProjectArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectName",
            "type": "string"
          },
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "fundingDeadline",
            "type": "i64"
          },
          {
            "name": "deliveryDeadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "milestone",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectId",
            "type": "pubkey"
          },
          {
            "name": "attemptNumber",
            "type": "u8"
          },
          {
            "name": "milestoneStatus",
            "type": {
              "defined": {
                "name": "milestoneState"
              }
            }
          },
          {
            "name": "milestoneType",
            "type": {
              "defined": {
                "name": "milestoneType"
              }
            }
          },
          {
            "name": "votesCasted",
            "type": "u32"
          },
          {
            "name": "capitalCasted",
            "type": "u64"
          },
          {
            "name": "votingEndTime",
            "type": "i64"
          },
          {
            "name": "voteAgainstWeight",
            "type": "u64"
          },
          {
            "name": "voteForWeight",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "milestoneState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "voting"
          },
          {
            "name": "approved"
          },
          {
            "name": "disapproved"
          }
        ]
      }
    },
    {
      "name": "milestoneType",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "design"
          },
          {
            "name": "development"
          },
          {
            "name": "testing"
          },
          {
            "name": "deployment"
          }
        ]
      }
    },
    {
      "name": "project",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "projectAuthority",
            "type": "pubkey"
          },
          {
            "name": "projectName",
            "type": "string"
          },
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "collectedAmount",
            "type": "u64"
          },
          {
            "name": "withdrawnAmount",
            "type": "u64"
          },
          {
            "name": "projectState",
            "type": {
              "defined": {
                "name": "projectState"
              }
            }
          },
          {
            "name": "milestonesPosted",
            "type": "u8"
          },
          {
            "name": "milestonesCompleted",
            "type": "u8"
          },
          {
            "name": "fundingDeadline",
            "type": "i64"
          },
          {
            "name": "deliveryDeadline",
            "type": "i64"
          },
          {
            "name": "funderCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "projectState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "funding"
          },
          {
            "name": "development"
          },
          {
            "name": "failed"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalFeesCollected",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "user",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "contributedAmount",
            "type": "u64"
          },
          {
            "name": "votesCasted",
            "type": "u64"
          },
          {
            "name": "projectsPosted",
            "type": "u64"
          },
          {
            "name": "milestonesSucceeded",
            "type": "u64"
          },
          {
            "name": "projectsSucceeded",
            "type": "u64"
          },
          {
            "name": "timeJoined",
            "type": "i64"
          },
          {
            "name": "lastActiveTime",
            "type": "i64"
          },
          {
            "name": "initialWalletScore",
            "type": "u16"
          },
          {
            "name": "initialGithubScore",
            "type": "u16"
          },
          {
            "name": "reputation",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vote",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "projectId",
            "type": "pubkey"
          },
          {
            "name": "milestoneId",
            "type": "pubkey"
          },
          {
            "name": "decision",
            "type": "bool"
          },
          {
            "name": "weight",
            "type": "u64"
          },
          {
            "name": "attemptCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
