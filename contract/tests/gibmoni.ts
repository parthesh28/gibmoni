import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Gibmoni } from "../target/types/gibmoni";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import fs from "fs";
import { init, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";

const Logger = {
  header: (title: string) => console.log(`\n==================================================\n  ${title.toUpperCase()}\n==================================================`),
  step: (msg: string) => console.log(`\n   ${msg}`),
  info: (key: string, value: string | number) => console.log(`    ▪ ${key.padEnd(15)} : ${value}`),
  success: (msg: string) => console.log(`     ${msg}`),
  wait: (msg: string) => console.log(`     ${msg}...`),
  table: (data: any[]) => { console.log(); console.table(data); }
};

describe("Capstone Crowdfunding & Governance", () => {
  const provider = anchor.AnchorProvider.local("https://devnet.helius-rpc.com/?api-key=c5d32b63-b2f3-46b9-9535-0d5510769438");
  anchor.setProvider(provider);

  const program = anchor.workspace.gibmoni as Program<Gibmoni>;

  const loadWallet = (path: string): Keypair => Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path, "utf-8"))));
  const getRandomId = (): number => Math.floor(Math.random() * 1000) + 1;
  const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
  const toSol = (lamports: number | anchor.BN): number => (typeof lamports === 'number' ? lamports : lamports.toNumber()) / LAMPORTS_PER_SOL;

  const admin = loadWallet("./wallets/admin.json");
  const user = loadWallet("./wallets/user.json");
  const contributorKeys = [
    loadWallet("./wallets/contributor1.json"),
    loadWallet("./wallets/contributor2.json"),
    loadWallet("./wallets/contributor3.json"),
    loadWallet("./wallets/contributor4.json"),
    loadWallet("./wallets/contributor5.json")
  ];

  const getVaultPda = () => PublicKey.findProgramAddressSync([Buffer.from("VAULT")], program.programId);
  const getUserPda = (wallet: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("USER"), wallet.toBuffer()], program.programId);
  const getProjectPda = (name: string, authority: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("PROJECT"), Buffer.from(name), authority.toBuffer()], program.programId);
  const getContributionPda = (funder: PublicKey, project: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("CONTRIBUTION"), funder.toBuffer(), project.toBuffer()], program.programId);
  const getMilestonePda = (authority: PublicKey, project: PublicKey, typeIndex: number) => PublicKey.findProgramAddressSync([Buffer.from("MILESTONE"), authority.toBuffer(), project.toBuffer(), Buffer.from([typeIndex])], program.programId);
  const getVotePda = (milestone: PublicKey, voter: PublicKey) => PublicKey.findProgramAddressSync([Buffer.from("VOTE"), milestone.toBuffer(), voter.toBuffer()], program.programId);

  const projectName1 = "MyTestProject1";
  const projectName2 = "MyTestProject2";

  let vaultPda: PublicKey, vaultBump: number;
  let userPda: PublicKey, userBump: number;
  let project1Pda: PublicKey, project2Pda: PublicKey;

  let tuktukProgram: any;
  let taskId = getRandomId();
  const taskQueue = new anchor.web3.PublicKey("GnCH4xcCtPTqiHa3z76dPW4DX7toa6qCntNJVtwS5KZc");
  const queueAuthority = PublicKey.findProgramAddressSync([Buffer.from("queue_authority")], program.programId)[0];
  const taskQueueAuthority = taskQueueAuthorityKey(taskQueue, queueAuthority)[0];

  interface ContributorContext {
    key: Keypair;
    cPda: PublicKey;
    contPda1: PublicKey;
    contPda2: PublicKey;
    name: string;
  }
  let contributors: ContributorContext[] = [];
  
  before(async () => {
    tuktukProgram = await init(provider);
    Logger.header("Initializing Test Suite Setup");
    Logger.info("Queue Authority", queueAuthority.toBase58());

    [vaultPda, vaultBump] = getVaultPda();
    [userPda, userBump] = getUserPda(user.publicKey);
    [project1Pda] = getProjectPda(projectName1, user.publicKey);
    [project2Pda] = getProjectPda(projectName2, user.publicKey);

    contributors = contributorKeys.map((key, index) => ({
      key,
      cPda: getUserPda(key.publicKey)[0],
      contPda1: getContributionPda(key.publicKey, project1Pda)[0],
      contPda2: getContributionPda(key.publicKey, project2Pda)[0],
      name: `Contributor ${index + 1}`
    }));
  });

  async function executeVotingRound(
    projectPda: PublicKey,
    milestonePda: PublicKey,
    decisions: boolean[],
    attemptLabel: string,
    contPdaKey: "contPda1" | "contPda2"
  ) {
    Logger.step(attemptLabel);

    for (let i = 0; i < contributors.length; i++) {
      const votePda = getVotePda(milestonePda, contributors[i].key.publicKey)[0];
      await program.methods.voteOnMilestone(decisions[i])
        .accountsStrict({
          voter: contributors[i].key.publicKey, user: contributors[i].cPda, project: projectPda,
          milestone: milestonePda, contribution: contributors[i][contPdaKey], vote: votePda,
          systemProgram: SystemProgram.programId,
        }).signers([contributors[i].key]).rpc();
    }

    const votePDAs = contributors.map(c => getVotePda(milestonePda, c.key.publicKey)[0]);
    const fetches = await Promise.all(votePDAs.map(v => program.account.vote.fetch(v)));

    Logger.table(contributors.map((c, i) => ({
      Alias: c.name,
      Decision: fetches[i].decision ? "APPROVE" : "REJECT",
      Weight: fetches[i].weight.toNumber()
    })));
  }

  async function runMilestone(index: number, typeObj: any, decisions: boolean[]) {
    taskId = getRandomId();
    const [mPda] = getMilestonePda(user.publicKey, project2Pda, index);

    await program.methods.createMilestone(typeObj, taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey, milestone: mPda, vault: vaultPda, project: project2Pda, user: userPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc({ skipPreflight: true });

    const mAcc = await program.account.milestone.fetch(mPda);
    Logger.step(`Milestone ${index + 1} Created (${Object.keys(mAcc.milestoneType)[0].toUpperCase()})`);

    await executeVotingRound(project2Pda, mPda, decisions, "Executing Community Votes", "contPda2");

    Logger.wait(`Waiting for crank to resolve Milestone ${index + 1}`);
    await sleep(180 * 1000);
    return mPda;
  }

  it("Initializes the Platform Vault", async () => {
    await program.methods.initialize()
      .accountsStrict({ admin: admin.publicKey, vault: vaultPda, systemProgram: SystemProgram.programId })
      .signers([admin]).rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    Logger.header("Vault Initialization");
    Logger.info("PDA", vaultPda.toBase58());
    Logger.info("Authority", vaultAccount.authority.toBase58());

    assert.strictEqual(vaultAccount.authority.toString(), admin.publicKey.toString());
  });

  xit("Initializes Developer and Contributor Profiles", async () => {
    Logger.header("Profile Initialization");

    await program.methods.initializeUser()
      .accountsStrict({ user: user.publicKey, userAccount: userPda, systemProgram: SystemProgram.programId })
      .signers([user]).rpc();

    const userAccount = await program.account.user.fetch(userPda);
    Logger.step("Developer Profile Created");
    Logger.info("PDA", userPda.toBase58());
    Logger.info("Joined", new Date(userAccount.timeJoined.toNumber() * 1000).toLocaleString());

    for (const c of contributors) {
      await program.methods.initializeUser()
        .accountsStrict({ user: c.key.publicKey, userAccount: c.cPda, systemProgram: SystemProgram.programId })
        .signers([c.key]).rpc();
    }

    const fetches = await Promise.all(contributors.map(c => program.account.user.fetch(c.cPda)));
    Logger.step("Contributor Profiles Created");
    Logger.table(contributors.map((c, i) => ({
      Alias: c.name,
      PDA: c.cPda.toBase58(),
      Contributed_SOL: toSol(fetches[i].contributedAmount)
    })));
  });

  xit("Creates Project 1 (Failure Simulation Target)", async () => {
    const targetAmount = new anchor.BN(0.005 * LAMPORTS_PER_SOL);
    const deadlineOffset = (days: number) => new anchor.BN(Math.floor(Date.now() / 1000) + days * 24 * 60 * 60);
    taskId = getRandomId();

    await program.methods.createProject({
      projectName: projectName1, targetAmount, fundingDeadline: deadlineOffset(7), deliveryDeadline: deadlineOffset(14)
    }, taskId)
      .accountsStrict({
        projectAuthority: user.publicKey, project: project1Pda, user: userPda, taskQueue, taskQueueAuthority,
        task: taskKey(taskQueue, taskId)[0], queueAuthority, systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc();

    const projectAccount = await program.account.project.fetch(project1Pda);
    Logger.header("Project 1 Created");
    Logger.info("PDA", project1Pda.toBase58());
    Logger.info("Target Amount", `${toSol(projectAccount.targetAmount)} SOL`);
    Logger.info("Current State", Object.keys(projectAccount.projectState)[0]);

    assert.strictEqual(projectAccount.projectName, projectName1);
  });

  xit("Fully Funds Project 1 to trigger Development Stage", async () => {
    const amount = new anchor.BN(0.001 * LAMPORTS_PER_SOL);

    for (const c of contributors) {
      await program.methods.contributeFund(amount)
        .accountsStrict({
          funder: c.key.publicKey, vault: vaultPda, project: project1Pda, user: c.cPda,
          contribution: c.contPda1, systemProgram: SystemProgram.programId,
        }).signers([c.key]).rpc();
    }

    const fetches = await Promise.all(contributors.map(c => program.account.contribution.fetch(c.contPda1)));
    const updatedProject = await program.account.project.fetch(project1Pda);

    Logger.header("Funding Project 1");
    Logger.table(contributors.map((c, i) => ({
      Alias: c.name,
      Amount_SOL: toSol(fetches[i].amount),
      Refunded: fetches[i].refunded,
    })));
    Logger.success(`Project State Updated to: ${Object.keys(updatedProject.projectState)[0].toUpperCase()}`);

    assert.ok(updatedProject.projectState.development !== undefined);
  });

  xit("Simulates Lifecycle of a Failing Project (Project 1)", async () => {
    Logger.header("Failure Lifecycle Simulation");
    taskId = getRandomId();
    const [milestone1Pda] = getMilestonePda(user.publicKey, project1Pda, 0);

    await program.methods.createMilestone({ design: {} }, taskId)
      .accountsStrict({
        milestoneAuthority: user.publicKey, milestone: milestone1Pda, vault: vaultPda, project: project1Pda, user: userPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc({ skipPreflight: true });

    Logger.info("Milestone 1 Created", milestone1Pda.toBase58());

    const decisions = [false, false, false, true, true];
    const waitTime = 180 * 1000;

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (attempt > 1) {
        taskId = getRandomId();
        await program.methods.retryMilestone(taskId)
          .accountsStrict({
            milestoneAuthority: user.publicKey, project: project1Pda, milestone: milestone1Pda, user: userPda, vault: vaultPda,
            taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
            systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
          }).signers([user]).rpc();
        Logger.info(`Triggered Retry`, attempt - 1);
      }

      await executeVotingRound(project1Pda, milestone1Pda, decisions, `Voting Round (Attempt ${attempt})`, "contPda1");

      const waitLabel = attempt === 3 ? "final failure resolution" : `crank to resolve Attempt ${attempt}`;
      Logger.wait(`Waiting for ${waitLabel}`);
      await sleep(attempt === 3 ? 120 * 1000 : waitTime);
    }

    const project1 = await program.account.project.fetch(project1Pda);
    const milestone1 = await program.account.milestone.fetch(milestone1Pda);

    Logger.step("Resolution Reached");
    Logger.info("Final Milestone Status", Object.keys(milestone1.milestoneStatus)[0]);
    Logger.info("Final Project State", Object.keys(project1.projectState)[0]);

    assert.ok(milestone1.milestoneStatus.disapproved !== undefined);
    assert.ok(project1.projectState.failed !== undefined);
  });

  xit("Allows contributors to claim refunds for a failed project (Project 1)", async () => {
    Logger.header("Refund Execution Simulation");

    for (const c of contributors) {
      const preUser = await program.account.user.fetch(c.cPda);
      const preContribution = await program.account.contribution.fetch(c.contPda1);
      const preBalance = await provider.connection.getBalance(c.key.publicKey);

      await program.methods.claimRefund()
        .accountsStrict({
          funder: c.key.publicKey,
          vault: vaultPda,
          project: project1Pda,
          user: c.cPda,
          contribution: c.contPda1,
          systemProgram: SystemProgram.programId,
        })
        .signers([c.key])
        .rpc();

      const postUser = await program.account.user.fetch(c.cPda);
      const postContribution = await program.account.contribution.fetch(c.contPda1);
      const postBalance = await provider.connection.getBalance(c.key.publicKey);

      Logger.step(`${c.name} Successfully Claimed Refund`);
      Logger.info("Amount Refunded", `${toSol(preContribution.amount)} SOL`);

      assert.isTrue(postContribution.refunded, "Contribution state should be marked as refunded");

      assert.strictEqual(
        postUser.contributedAmount.toNumber(),
        preUser.contributedAmount.toNumber() - preContribution.amount.toNumber(),
        "User's global contributed amount should decrease"
      );
    }
  });

  xit("Simulates Lifecycle of a Successful Project (Project 2)", async () => {
    Logger.header("Success Lifecycle Simulation");

    const targetAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    const deadlineOffset = (days: number) => new anchor.BN(Math.floor(Date.now() / 1000) + days * 24 * 60 * 60);
    const amount = new anchor.BN(0.01 * LAMPORTS_PER_SOL);
    taskId = getRandomId();

    await program.methods.createProject({
      projectName: projectName2, targetAmount, fundingDeadline: deadlineOffset(7), deliveryDeadline: deadlineOffset(14)
    }, taskId)
      .accountsStrict({
        projectAuthority: user.publicKey, project: project2Pda, user: userPda,
        taskQueue, taskQueueAuthority, task: taskKey(taskQueue, taskId)[0], queueAuthority,
        systemProgram: SystemProgram.programId, tuktukProgram: tuktukProgram.programId,
      }).signers([user]).rpc();

    Logger.step("Project 2 Created");

    for (const c of contributors) {
      await program.methods.contributeFund(amount)
        .accountsStrict({
          funder: c.key.publicKey, vault: vaultPda, project: project2Pda, user: c.cPda,
          contribution: c.contPda2, systemProgram: SystemProgram.programId,
        }).signers([c.key]).rpc();
    }
    Logger.success("Project 2 Fully Funded");

    await runMilestone(0, { design: {} }, [true, true, false, true, false]);
    await runMilestone(1, { development: {} }, [true, true, false, true, false]);
    await runMilestone(2, { testing: {} }, [true, true, false, true, false]);
    const milestone4Pda = await runMilestone(3, { deployment: {} }, [true, true, true, true, true]);

    const finalProject = await program.account.project.fetch(project2Pda);
    const finalMilestone4 = await program.account.milestone.fetch(milestone4Pda);

    Logger.header("Project 2 Final Assessment");
    Logger.success(`Project State: ${Object.keys(finalProject.projectState)[0].toUpperCase()}`);
    Logger.success(`Milestones Cleared: ${finalProject.milestonesCompleted}`);

    assert.ok(finalProject.projectState.completed !== undefined);
    assert.strictEqual(finalProject.milestonesCompleted, 4);
    assert.isAbove(finalProject.withdrawnAmount.toNumber(), 0);
    assert.ok(finalMilestone4.milestoneStatus.approved !== undefined);
  });
});