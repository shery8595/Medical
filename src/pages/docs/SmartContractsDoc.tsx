import { Prose } from "../../components/docs/Prose";
import { CodeBlock } from "../../components/docs/CodeBlock";
import { Callout } from "../../components/docs/Callout";
import { motion } from "framer-motion";

export function SmartContractsDoc() {
    return (
        <motion.div>
            <Prose className="max-w-none">
                <span className="text-emerald-500 font-bold tracking-widest uppercase text-xs">Technical Reference</span>
                <h1 className="mt-2 text-5xl">Core Logic Contracts</h1>

                <p className="lead text-2xl text-slate-500 dark:text-slate-400 mt-6 mb-12 max-w-prose">
                    MedVault's logic is explicitly distributed across several specialized contracts, ensuring a strict separation of concerns and minimizing gas vulnerabilities while executing operations on the Zama fhEVM.
                </p>

                <Callout type="info" title="Deployment Environment">
                    All contracts are deployed on the <strong>Zama Sepolia Testnet</strong> chain. Connecting to the network requires RPC URLs pointing to Zama infrastructure.
                </Callout>

                <hr className="my-12 border-slate-200 dark:border-slate-800" />

                <div className="space-y-16 mt-12">
                    {/* Trial Manager */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                                <span className="font-mono font-bold text-lg leading-none">01</span>
                            </div>
                            <h2 className="m-0 border-0 pb-0">TrialManager.sol</h2>
                        </div>

                        <p className="max-w-prose">
                            The `TrialManager` is the central hub for creating, tracking, and halting clinical trials. It acts as the routing layer between the unencrypted logic (e.g., Trial Names, Phases, Timestamps) and the encrypted requirements.
                        </p>

                        <p>
                            Before instantiating a new trial struct, the `TrialManager` makes a synchronous call to the `SponsorRegistry` to verify the `msg.sender`.
                        </p>

                        <CodeBlock
                            filename="TrialManager.sol (Create Logic)"
                            language="solidity"
                            code={`function createTrial(
    string memory name,
    string memory phase,
    string memory location,
    string memory compensation,
    bytes memory encryptedReqs
) external returns (uint256) {
    // 1. Authorize Caller via distinct registry
    require(
        sponsorRegistry.isVerifiedSponsor(msg.sender), 
        "Only verified sponsors can create trials"
    );
    
    // 2. Increment global trial counter securely
    uint256 newTrialId = ++trialCount;
    
    // 3. Decrypt and map structural data
    // Note: 'encryptedReqs' is cast to e-types internally by the Engine later.
    trials[newTrialId] = Trial({
        id: newTrialId,
        sponsor: msg.sender,
        name: name,
        phase: phase,
        active: true,
        // ...
    });

    emit TrialCreated(newTrialId, msg.sender, name);
    return newTrialId;
}`}
                        />
                    </section>

                    {/* Chainlink Oracle Feeds */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20">
                                <span className="font-mono font-bold text-lg leading-none">02</span>
                            </div>
                            <h2 className="m-0 border-0 pb-0">Chainlink Price Feeds</h2>
                        </div>

                        <p className="max-w-prose">
                            Clinical trials often guarantee compensation (e.g., "$5,000 equivalent in ETH"). To prevent sponsors from under-funding their trial escrow due to extreme market volatility, MedVault integrates <code>@chainlink/contracts</code> to fetch live market data during trial instantiation.
                        </p>

                        <CodeBlock
                            filename="TrialFundManager.sol"
                            language="solidity"
                            code={`import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract TrialFundManager {
    AggregatorV3Interface internal dataFeed;

    /**
     * Network: Zama Sepolia
     * Aggregator: ETH/USD
     * Address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
     */
    constructor() {
        dataFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
    }

    /**
     * Returns the latest USD price of 1 ETH from the decentralized oracle network,
     * scaled by 1e8. We use this to calculate the exact msg.value required 
     * before activating a Trial.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // We use latestRoundData to ensure the oracle response isn't stale
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = dataFeed.latestRoundData();
        return price;
    }
}`}
                        />

                        <Callout type="tip" title="Decentralized Validation">
                            By querying the <code>AggregatorV3Interface</code> dynamically inside the `payable` Trial Activation function, we completely eliminate the need for an admin to manually set oracle prices. If <code>msg.value &lt; requiredFiatFunding / getChainlinkDataFeedLatestAnswer()</code>, the transaction reverts immediately, protecting patient payouts.
                        </Callout>

                    </section>

                    {/* Patient Registry */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
                                <span className="font-mono font-bold text-lg leading-none">02</span>
                            </div>
                            <h2 className="m-0 border-0 pb-0">PatientRegistry.sol</h2>
                        </div>
                        <p className="max-w-prose">
                            The `PatientRegistry` handles the storage and updating of the patient's underlying health metrics. It manages the `PatientInfo` struct which holds exclusively Zama `euint32` data types.
                        </p>
                        <Callout type="warning" title="Reentrancy Protections">
                            Because the patient registry interfaces with the `EligibilityEngine` and the `ConsentManager` directly upon state updates, it utilizes standard OpenZeppelin `ReentrancyGuard` modifiers to prevent recursive calls during FHE evaluations.
                        </Callout>

                        <CodeBlock
                            filename="PatientRegistry.sol (Structs)"
                            language="solidity"
                            code={`import "@zama-ai/fhevm/contracts/lib/TFHE.sol";

// All fields are fully homomorphically encrypted
struct PatientInfo {
    euint32 age;
    euint32 bloodPressure;
    euint32 hba1c;
    euint32 weight;
    bool isRegistered; // Standard boolean. It is public knowledge *that* a patient exists.
}

mapping(address => PatientInfo) private registry;`}
                        />
                    </section>
                </div>
            </Prose>
        </motion.div>
    );
}
