import { ethers } from "ethers";

import type { Signer } from "ethers";

import { getConfidentialETH, resolveChainIdFrom } from "./contracts";

import { encryptUint64, ensureZamaConnected, publicDecrypt } from "./fhe";

import { parseEventArg } from "./contractEvents";



export const CONFIDENTIAL_ETH_EIP712_VERSION = "2";



/** keccak256(abi.encode(encryptedUnits, inputProof)) — binds FHE ciphertext in EIP-712 */

export function computeEncryptedAmountCommitment(

  handle: string,

  inputProof: string

): `0x${string}` {

  return ethers.keccak256(

    ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes"], [handle, inputProof])

  ) as `0x${string}`;

}



export async function signWithdrawToAuthorization(

  signer: Signer,

  cEthAddress: string,

  chainId: bigint,

  params: {

    user: string;

    destination: string;

    amountCommitment: string;

    nonce: bigint;

    deadline: bigint;

  }

): Promise<string> {

  return signer.signTypedData(

    {

      name: "MedVault ConfidentialETH",

      version: CONFIDENTIAL_ETH_EIP712_VERSION,

      chainId,

      verifyingContract: cEthAddress,

    },

    {

      WithdrawTo: [

        { name: "user", type: "address" },

        { name: "destination", type: "address" },

        { name: "amountCommitment", type: "bytes32" },

        { name: "nonce", type: "uint256" },

        { name: "deadline", type: "uint256" },

      ],

    },

    params

  );

}



/** Build WithdrawTo EIP-712 args for claimParticipantRewards* */

export async function buildWithdrawToAuthorization(

  signer: Signer,

  destination: string,

  encrypted: { handle: string; inputProof: string },

  deadlineOffsetSec = 3600

): Promise<{

  nonce: bigint;

  deadline: bigint;

  signature: string;

  amountCommitment: `0x${string}`;

}> {

  const user = await signer.getAddress();

  const cEth = getConfidentialETH(signer);

  const cEthAddress = await cEth.getAddress();

  const chainId = await resolveChainIdFrom(signer);

  const nonce = await cEth.withdrawToNonces(user);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineOffsetSec);

  const amountCommitment = computeEncryptedAmountCommitment(encrypted.handle, encrypted.inputProof);

  const signature = await signWithdrawToAuthorization(signer, cEthAddress, chainId, {

    user,

    destination,

    amountCommitment,

    nonce,

    deadline,

  });

  return { nonce, deadline, signature, amountCommitment };

}



export type WithdrawExitMode = "fast" | "private_batch" | "wallet";



const EXIT_MODE_FAST = 0;

const EXIT_MODE_PRIVATE_BATCH = 1;



const ZERO_HANDLE = `0x${"0".repeat(64)}` as `0x${string}`;



export async function getPendingWithdrawHandle(signer: Signer): Promise<string | null> {

  const account = await signer.getAddress();

  const contract = getConfidentialETH(signer);

  const pending = await contract.pendingWithdrawHandle(account);

  const handle = String(pending);

  if (!handle || handle === ZERO_HANDLE || BigInt(handle) === 0n) return null;

  return handle;

}



export async function getWithdrawBlockers(

  signer: Signer

): Promise<{ locked: boolean; pendingHandle: string | null; failedWithdrawWei: bigint }> {

  const account = await signer.getAddress();

  const contract = getConfidentialETH(signer);

  const [locked, pendingHandle, failedWithdrawWei] = await Promise.all([

    contract.isBalanceLocked(account),

    getPendingWithdrawHandle(signer),

    contract.pendingFailedWithdrawWei(account),

  ]);

  return { locked, pendingHandle, failedWithdrawWei: BigInt(failedWithdrawWei) };

}



function explainWithdrawSimulationFailure(

  err: unknown,

  context: { locked: boolean; pendingHandle: string | null; walletUnits: number }

): string {

  const raw = `${(err as { reason?: string; message?: string; shortMessage?: string })?.reason || ""} ${(err as Error)?.message || ""} ${(err as { shortMessage?: string })?.shortMessage || ""}`.toLowerCase();



  if (context.pendingHandle) {

    return "A withdrawal is already staged on-chain. Completing the pending withdrawal — please wait.";

  }

  if (context.locked || raw.includes("balance locked")) {

    return "Your confidential balance is locked (e.g. active trial enrollment). Unlock or finish pending actions before unshielding.";

  }

  if (raw.includes("withdrawal already pending") || raw.includes("already pending")) {

    return "A withdrawal is already in progress. Wait for it to complete or use cancel after the timeout.";

  }

  if (raw.includes("no balance") || context.walletUnits <= 0) {

    return "Your wallet has no shielded cETH balance to withdraw. Trial rewards are held on your anonymous trial identity — claim them from My Applications first, then unshield here.";

  }

  if (raw.includes("missing revert data") || raw.includes("call_exception")) {

    if (context.walletUnits <= 0) {

      return "Withdrawal simulation failed: wallet cETH balance is 0. Shield ETH or claim trial rewards from My Applications before unshielding.";

    }

    return "Withdrawal simulation failed on-chain. Reveal your balance again, ensure Zama FHE is connected, and retry with an amount within your wallet balance (not trial rewards).";

  }

  return (err as Error)?.message || "Withdrawal request failed";

}



export async function requestEncryptedWithdraw(

  signer: Signer,

  units: number,

  walletUnitsAvailable?: number

): Promise<{ stageTxHash: string; transferableHandle: string; resumed: boolean }> {

  const account = await signer.getAddress();

  const contract = getConfidentialETH(signer);

  const contractAddress = await contract.getAddress();

  const provider = signer.provider;

  if (!provider) throw new Error("Wallet provider not available");



  const blockers = await getWithdrawBlockers(signer);

  if (blockers.locked) {

    throw new Error("Your confidential balance is locked. Finish pending trial actions before unshielding.");

  }

  if (blockers.pendingHandle) {

    return { stageTxHash: "", transferableHandle: blockers.pendingHandle, resumed: true };

  }

  if (walletUnitsAvailable != null && units > walletUnitsAvailable) {

    throw new Error(

      `Amount exceeds wallet cETH balance (${(walletUnitsAvailable / 1_000_000).toFixed(6)} ETH). Trial rewards must be claimed from My Applications — they cannot be unshielded directly from this wallet.`

    );

  }

  if (walletUnitsAvailable != null && walletUnitsAvailable <= 0) {

    throw new Error(

      "Wallet cETH balance is 0. Shield ETH into the vault, or claim trial rewards from My Applications before unshielding."

    );

  }



  await ensureZamaConnected(provider, signer);

  const encrypted = await encryptUint64(contractAddress, account, units);



  try {

    await contract.requestWithdraw.staticCall(encrypted.handle, encrypted.inputProof);

  } catch (simErr) {

    throw new Error(

      explainWithdrawSimulationFailure(simErr, {

        locked: blockers.locked,

        pendingHandle: blockers.pendingHandle,

        walletUnits: walletUnitsAvailable ?? -1,

      })

    );

  }



  const tx = await contract.requestWithdraw(encrypted.handle, encrypted.inputProof);

  const receipt = await tx.wait();

  if (!receipt) throw new Error("Withdraw request receipt missing");



  const transferableHandle = parseEventArg(

    receipt,

    contract.interface,

    contractAddress,

    "WithdrawRequested",

    "transferableHandle"

  );



  return { stageTxHash: receipt.hash, transferableHandle, resumed: false };

}



export async function completeEncryptedWithdraw(

  signer: Signer,

  transferableHandle: string

): Promise<string> {

  const contract = getConfidentialETH(signer);



  const transferable = await publicDecrypt(transferableHandle);

  const completeTx = await contract.completeWithdraw(transferable.cleartexts, transferable.proof);

  const completeRc = await completeTx.wait();

  if (!completeRc) throw new Error("Complete withdraw receipt missing");

  return completeRc.hash;

}



export async function signPublicExitAuthorization(

  signer: Signer,

  params: {

    contractAddress: string;

    chainId: number;

    owner: string;

    stealthRecipient: string;

    transferableHandle: string;

    exitMode: WithdrawExitMode;

    nonce: bigint;

    deadline: bigint;

  }

): Promise<string> {

  const exitMode =

    params.exitMode === "private_batch" ? EXIT_MODE_PRIVATE_BATCH : EXIT_MODE_FAST;



  const domain = {

    name: "MedVault ConfidentialETH",

    version: CONFIDENTIAL_ETH_EIP712_VERSION,

    chainId: params.chainId,

    verifyingContract: params.contractAddress,

  };



  const types = {

    WithdrawAuthorization: [

      { name: "owner", type: "address" },

      { name: "stealthRecipient", type: "address" },

      { name: "transferableHandle", type: "bytes32" },

      { name: "exitMode", type: "uint8" },

      { name: "nonce", type: "uint256" },

      { name: "deadline", type: "uint256" },

    ],

  };



  const value = {

    owner: params.owner,

    stealthRecipient: params.stealthRecipient,

    transferableHandle: params.transferableHandle,

    exitMode,

    nonce: params.nonce,

    deadline: params.deadline,

  };



  return signer.signTypedData(domain, types, value);

}



export async function completePublicExitViaRelayer(

  relayerUrl: string,

  body: Record<string, unknown>

): Promise<{ txHash: string }> {

  const response = await fetch(`${relayerUrl.replace(/\/$/, "")}/relay/public-exit`, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),

  });

  const data = await response.json().catch(() => ({} as Record<string, unknown>));

  if (!response.ok || !data.success || !data.txHash) {

    throw new Error(typeof data.error === "string" ? data.error : "Public exit relay failed");

  }

  return { txHash: data.txHash as string };

}



export { EXIT_MODE_FAST, EXIT_MODE_PRIVATE_BATCH };


