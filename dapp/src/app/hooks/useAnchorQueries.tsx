'use client'

import { getGibmoniProgram, getGibmoniProgramId } from '../context/anchorProvider'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, Ed25519Program, TransactionInstruction } from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../context/clusterProvider'
import { useAnchorProvider } from '../context/solanaProvider'
import { useTransactionToast } from '../../components/transactionToast'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'
import bs58 from 'bs58'

// Browser-safe replacements for @helium/tuktuk-sdk PDA helpers
// The originals use buf.writeUint16LE which doesn't exist in browser Buffer polyfills
const TUKTUK_PROGRAM_ID = new PublicKey("tuktukUrfhXT6ZT77QTU8RQtvgL967uRuVagWF57zVA");

// Oracle public key — must match the one hardcoded in the smart contract
const ORACLE_PUBKEY = new PublicKey("AYoKgU74nVcwYQjP3CMqw5oMHMjdUNXyqPaW5eXRr57y");

function localTaskKey(taskQueue: PublicKey, taskId: number): [PublicKey, number] {
    const buf = Buffer.alloc(2);
    buf[0] = taskId & 0xff;
    buf[1] = (taskId >> 8) & 0xff;
    return PublicKey.findProgramAddressSync(
        [Buffer.from("task"), taskQueue.toBuffer(), buf],
        TUKTUK_PROGRAM_ID
    );
}

function localTaskQueueAuthorityKey(taskQueue: PublicKey, authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("task_queue_authority"), taskQueue.toBuffer(), authority.toBuffer()],
        TUKTUK_PROGRAM_ID
    );
}

/**
 * Build the Ed25519SigVerify instruction that the smart contract will
 * cross-reference via the instructions sysvar.
 */
function buildEd25519VerifyInstruction(
    oraclePubkey: PublicKey,
    message: Uint8Array,
    signature: Uint8Array,
): TransactionInstruction {
    return Ed25519Program.createInstructionWithPublicKey({
        publicKey: oraclePubkey.toBytes(),
        message,
        signature,
    });
}

export function useGibmoniProgram() {
    const { connection } = useConnection()
    const { cluster } = useCluster()
    const transactionToast = useTransactionToast()
    const provider = useAnchorProvider()
    const queryClient = useQueryClient()
    const programId = useMemo(() => getGibmoniProgramId("devnet" as Cluster), [cluster])
    const program = useMemo(() => getGibmoniProgram(provider, programId), [provider, programId])

    // Tuktuk Constants
    const taskQueue = new PublicKey("S5GBDtkKpqsMDhfKCGtQx4gspZLwSJw23nnPKGuwMF5");

    const refreshProjectsData = () => {
        queryClient.invalidateQueries({ queryKey: ['get-all-projects'] })
        queryClient.invalidateQueries({ queryKey: ['get-program-account'] })
    }

    const getProgramAccount = useQuery({
        queryKey: ['get-program-account', { cluster }],
        queryFn: () => connection.getParsedAccountInfo(programId),
    })

    const getAllProjects = useQuery({
        queryKey: ['get-all-projects', { cluster }],
        queryFn: async () => {
            return await program.account.project.all()
        }
    })

    // Check if the connected wallet has an on-chain User PDA
    const getUserAccount = useQuery({
        queryKey: ['user-account', provider.publicKey?.toBase58(), { cluster }],
        queryFn: async () => {
            if (!provider.publicKey) throw new Error('No wallet')
            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );
            return await program.account.user.fetch(userPda);
        },
        enabled: !!provider.publicKey,
        retry: false,
    })

    const checkHasVoted = async (milestonePda: PublicKey, currentAttempt: number) => {
        if (!provider.publicKey) return false;
        try {
            const [votePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("VOTE"), milestonePda.toBuffer(), provider.publicKey.toBuffer()],
                program.programId
            );
            const voteAccount = await program.account.vote.fetch(votePda);
            // The user has only voted if the vote account's attempt_count matches the milestone's current attempt_number
            return voteAccount.attemptCount === currentAttempt;
        } catch {
            return false;
        }
    };

    // 1. Initialize User Profile
    // The smart contract expects: (ix_index, wallet_score, github_score, score_timestamp, oracle_signature)
    // An Ed25519SigVerify instruction must be prepended at ix_index in the same tx.
    const initializeUser = useMutation({
        mutationKey: ['user', 'initializeUser', { cluster }],
        mutationFn: async (data: {
            walletScore: number,
            githubScore: number,
            scoreTimestamp: number,
            oracleSignature: string, // base58-encoded oracle signature
        }) => {
            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );

            // Reconstruct the message the oracle signed
            // Note: scoreTimestamp is already in unix seconds (matching the contract)
            const messageString = `gibmoni-scores:${provider.publicKey.toBase58()}:${data.walletScore}:${data.githubScore}:${data.scoreTimestamp}`;
            const messageBytes = new TextEncoder().encode(messageString);
            const signatureBytes = bs58.decode(data.oracleSignature);

            // Build the Ed25519 verify instruction (will be ix 0 in the tx)
            const ed25519Ix = buildEd25519VerifyInstruction(
                ORACLE_PUBKEY,
                messageBytes,
                signatureBytes,
            );

            // The Ed25519 verify instruction is at index 0, so ix_index = 0
            const ixIndex = 0;

            // Convert oracle signature to [u8; 64] array
            const oracleSigArray = Array.from(signatureBytes);

            const tx = await program.methods
                .initializeUser(
                    ixIndex,
                    data.walletScore,
                    data.githubScore,
                    new anchor.BN(data.scoreTimestamp),
                    oracleSigArray as any,
                )
                .accountsStrict({
                    user: provider.publicKey,
                    userAccount: userPda,
                    instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
                    systemProgram: SystemProgram.programId,
                })
                .preInstructions([ed25519Ix])
                .rpc();

            return tx;
        },
        onSuccess: (signature) => {
            transactionToast(signature, {
                title: 'Profile Initialized!',
                description: 'Your Gibmoni user profile has been created.'
            })
            queryClient.invalidateQueries({ queryKey: ['user-account'] })
        },
        onError: (error) => {
            console.error('Init user error:', error)
            toast.error('Failed to Initialize User', {
                description: 'Please check your wallet connection and try again',
                duration: 6000,
            })
        },
    })

    // 2. Create a Project
    const createProject = useMutation({
        mutationKey: ['project', 'createProject', { cluster }],
        mutationFn: async (data: { projectName: string, targetAmount: anchor.BN, fundingDeadline: anchor.BN, deliveryDeadline: anchor.BN }) => {
            const getRandomId = (): number => Math.floor(Math.random() * 1000) + 1;
            const taskId = getRandomId();

            const [projectPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("PROJECT"), Buffer.from(data.projectName), provider.publicKey.toBuffer()],
                program.programId
            );

            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );

            const [queueAuthority] = PublicKey.findProgramAddressSync(
                [Buffer.from("queue_authority")],
                program.programId
            );

            const [taskQueueAuthority] = localTaskQueueAuthorityKey(taskQueue, queueAuthority);
            const [task] = localTaskKey(taskQueue, taskId);

            return program.methods.createProject({
                projectName: data.projectName,
                targetAmount: data.targetAmount,
                fundingDeadline: data.fundingDeadline,
                deliveryDeadline: data.deliveryDeadline
            }, taskId).accountsStrict({
                projectAuthority: provider.publicKey,
                project: projectPda,
                user: userPda,
                taskQueue,
                taskQueueAuthority,
                task,
                queueAuthority,
                systemProgram: SystemProgram.programId,
                tuktukProgram: TUKTUK_PROGRAM_ID
            }).rpc()
        },
        onSuccess: (signature) => {
            transactionToast(signature, {
                title: 'Project Created Successfully! 🎉',
                description: 'Your project is now live and ready for contributions'
            })
            refreshProjectsData()
        },
        onError: (error) => {
            console.error('Create project error:', error)
            toast.error('Failed to Create Project', {
                description: 'Please ensure your user profile is initialized first.',
                duration: 6000,
            })
        },
    })

    // 3. Contribute to a Project
    const contributeFund = useMutation({
        mutationKey: ['project', 'contributeFund', { cluster }],
        mutationFn: async (data: { projectName: string, projectAuthority: PublicKey, amount: anchor.BN }) => {
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("VAULT")],
                program.programId
            );

            const [projectPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("PROJECT"), Buffer.from(data.projectName), data.projectAuthority.toBuffer()],
                program.programId
            );

            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );

            const [contributionPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("CONTRIBUTION"), provider.publicKey.toBuffer(), projectPda.toBuffer()],
                program.programId
            );

            return program.methods.contributeFund(data.amount).accountsStrict({
                funder: provider.publicKey,
                vault: vaultPda,
                project: projectPda,
                user: userPda,
                contribution: contributionPda,
                systemProgram: SystemProgram.programId,
            }).rpc()
        },
        onSuccess: (signature) => {
            transactionToast(signature, {
                title: 'Contribution Successful!',
                description: 'Your funds have been securely escrowed.'
            })
            refreshProjectsData()
        },
        onError: (error) => {
            console.error('Contribute fund error:', error)
            toast.error('Contribution Failed', {
                description: 'Unable to process your contribution. Please try again.',
                duration: 6000,
            })
        },
    })

    // 4. Create a Milestone
    const createMilestone = useMutation({
        mutationKey: ['milestone', 'createMilestone', { cluster }],
        mutationFn: async (data: {
            projectName: string,
            milestoneType: any, // e.g., { design: {} } 
            typeIndex: number   // 0 for Design, 1 for Dev, 2 for Testing, 3 for Deployment
        }) => {
            const getRandomId = (): number => Math.floor(Math.random() * 1000) + 1;
            const taskId = getRandomId();

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("VAULT")],
                program.programId
            );

            const [treasuryPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("TREASURY")],
                program.programId
            );

            const [projectPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("PROJECT"), Buffer.from(data.projectName), provider.publicKey.toBuffer()],
                program.programId
            );

            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );

            // Note: In Rust, you cast the enum to u8, which requires passing the index here
            const [milestonePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("MILESTONE"), provider.publicKey.toBuffer(), projectPda.toBuffer(), Buffer.from([data.typeIndex])],
                program.programId
            );

            // Tuktuk task queue PDAs
            const [queueAuthority] = PublicKey.findProgramAddressSync(
                [Buffer.from("queue_authority")],
                program.programId
            );
            const [taskQueueAuthority] = localTaskQueueAuthorityKey(taskQueue, queueAuthority);
            const [task] = localTaskKey(taskQueue, taskId);

            return program.methods.createMilestone(data.milestoneType, taskId).accountsStrict({
                milestoneAuthority: provider.publicKey,
                milestone: milestonePda,
                vault: vaultPda,
                treasury: treasuryPda,
                project: projectPda,
                user: userPda,
                taskQueue,
                taskQueueAuthority,
                task,
                queueAuthority,
                systemProgram: SystemProgram.programId, 
                tuktukProgram: TUKTUK_PROGRAM_ID
            }).rpc({ skipPreflight: true }) // You had skipPreflight in your tests, so I preserved it here
        },
        onSuccess: (signature) => {
            transactionToast(signature, {
                title: 'Milestone Submitted!',
                description: 'Your milestone is now active and awaiting community votes.'
            })
            refreshProjectsData()
        },
        onError: (error) => {
            console.error('Create milestone error:', error)
            toast.error('Failed to Create Milestone', {
                description: 'Please ensure your project is funded and ready for development.',
                duration: 6000,
            })
        },
    })

    // 5. Vote on a Milestone
    const voteOnMilestone = useMutation({
        mutationKey: ['milestone', 'vote', { cluster }],
        mutationFn: async (data: {
            projectName: string,
            projectAuthority: PublicKey,
            typeIndex: number, // To find the exact milestone PDA
            decision: boolean  // true for Approve, false for Reject
        }) => {
            const [projectPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("PROJECT"), Buffer.from(data.projectName), data.projectAuthority.toBuffer()],
                program.programId
            );

            const [milestonePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("MILESTONE"), data.projectAuthority.toBuffer(), projectPda.toBuffer(), Buffer.from([data.typeIndex])],
                program.programId
            );

            const [userPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("USER"), provider.publicKey.toBuffer()],
                program.programId
            );

            const [contributionPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("CONTRIBUTION"), provider.publicKey.toBuffer(), projectPda.toBuffer()],
                program.programId
            );

            const [votePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("VOTE"), milestonePda.toBuffer(), provider.publicKey.toBuffer()],
                program.programId
            );

            return program.methods.voteOnMilestone(data.decision).accountsStrict({
                voter: provider.publicKey,
                user: userPda,
                project: projectPda,
                milestone: milestonePda,
                contribution: contributionPda,
                vote: votePda,
                systemProgram: SystemProgram.programId,
            }).rpc()
        },
        onSuccess: (signature, variables) => {
            transactionToast(signature, {
                title: variables.decision ? 'Vote Cast: Approve! ✅' : 'Vote Cast: Reject ❌',
                description: 'Your governance weight has been applied to the milestone.'
            })
            refreshProjectsData()
        },
        onError: (error) => {
            console.error('Vote error:', error)
            toast.error('Voting Failed', {
                description: 'Ensure you have contributed to this project and the voting window is open.',
                duration: 6000,
            })
        },
    })

    return {
        provider,
        program,
        programId,
        getProgramAccount,
        getAllProjects,
        getUserAccount,
        initializeUser,
        createProject,
        contributeFund,
        voteOnMilestone, 
        createMilestone,
        checkHasVoted
    }
}