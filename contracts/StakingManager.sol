// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, Common, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./ConfidentialETH.sol";

interface IWrappedTokenGatewayV3 {
    function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable;
    function withdrawETH(address pool, uint256 amount, address to) external;
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract StakingManager {
    // Aave V3 Arbitrum Sepolia market addresses.
    address public constant AAVE_POOL = 0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff;
    address public constant WETH_GATEWAY = 0x20040a64612555042335926d72B4E5F667a67fA1;
    address public constant AWETH = 0xf5f17EbE81E516Dc7cB38D61908EC252F150CE60;

    // Reentrancy Guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    ConfidentialETH public cETH;
    mapping(address => euint64) private _encryptedTotalStaked;
    // FINDING 6: Replay protection for balance proofs
    mapping(bytes32 => bool) private usedUnstakeProofs;
    // C-2: Per-user nonce for replay protection
    mapping(address => uint256) public unstakeNonces;

    // FINDING 11: Two-step ownership transfer
    address public owner;
    address public pendingOwner;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    constructor(address payable _cETH) {
        cETH = ConfidentialETH(_cETH);
        _status = _NOT_ENTERED;
        owner = msg.sender; // FINDING 11
    }

    // FINDING 11: Two-step ownership transfer
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function proposeOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        pendingOwner = _newOwner;
        emit OwnershipProposed(_newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not proposed owner");
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipAccepted(owner);
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Stakes ETH into Aave V3 and records the amount encrypted
     * @dev MED-4: Must stake a whole number of Gwei to prevent rounding/truncation
     */
    function stake() external payable {
        require(msg.value > 0, "Must stake > 0");
        require(msg.value % 1e9 == 0, "Stake amount must be a whole Gwei"); // MED-4: Prevent truncation

        // AUDIT-MED: Reject stakes too large to fit encrypted uint64 accounting.
        // type(uint64).max * 1e9 ~= 1.8446e28 wei ~= 1.8446e10 ETH.
        require(msg.value / 1e9 <= type(uint64).max, "Stake overflows uint64");

        // Supply ETH to Aave -> receives aWETH
        IWrappedTokenGatewayV3(WETH_GATEWAY).depositETH{value: msg.value}(
            AAVE_POOL,
            msg.sender, // aWETH sent to user
            0
        );

        // Encrypt and store the staked amount securely in Gwei to fit euint64 safety
        euint64 encAmount = FHE.asEuint64(uint64(msg.value / 1e9));
        // L-1: Use Common.isInitialized() instead of unwrap() != 0
        if (Common.isInitialized(_encryptedTotalStaked[msg.sender])) {
            _encryptedTotalStaked[msg.sender] = FHE.add(_encryptedTotalStaked[msg.sender], encAmount);
        } else {
            _encryptedTotalStaked[msg.sender] = encAmount;
        }
        
        FHE.allow(_encryptedTotalStaked[msg.sender], msg.sender);
        FHE.allowThis(_encryptedTotalStaked[msg.sender]);

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Unstakes from Aave by withdrawing ETH 
     * @dev User MUST approve this contract to spend their aWETH before calling!
     * @dev FINDING 6: Requires a Threshold Network balance proof to prevent underflow
     * @dev C-2: Signature must cover (ctHash, balance, msg.sender, amount, nonce) to prevent replay
     * @param amount The amount to unstake
     * @param balanceSig Threshold Network ECDSA signature over (ctHash, balance, caller, amount, nonce)
     * @param stakedBalance The claimed plaintext staked balance
     */
    function unstake(
        uint256 amount,
        bytes calldata balanceSig,
        uint64 stakedBalance
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalance >= uint64(amount / 1e9), "Insufficient staked balance");

        // C-2: Include caller, amount, and nonce in proof key for replay protection
        // The Threshold Network signature must cover: (ctHash, balance, msg.sender, amount, nonce)
        uint256 currentNonce = unstakeNonces[msg.sender];
        bytes32 proofKey = keccak256(abi.encodePacked(balanceSig, msg.sender, amount, currentNonce));
        require(!usedUnstakeProofs[proofKey], "Proof already used");
        usedUnstakeProofs[proofKey] = true;

        // FINDING 6: Verify TN signed that plaintext(stakedBalance) is valid
        euint64 encStaked = _encryptedTotalStaked[msg.sender];
        require(Common.isInitialized(encStaked), "No stake found");
        require(
            FHE.verifyDecryptResult(encStaked, stakedBalance, balanceSig),
            "Invalid balance proof"
        );

        // Transfer aWETH from user to this contract
        bool success = IERC20(AWETH).transferFrom(msg.sender, address(this), amount);
        require(success, "aWETH transfer failed");

        // Approve WETH Gateway to burn aWETH
        IERC20(AWETH).approve(WETH_GATEWAY, amount);

        // Withdraw ETH from Aave to user
        IWrappedTokenGatewayV3(WETH_GATEWAY).withdrawETH(AAVE_POOL, amount, msg.sender);

        // LOW-3: Reset approval to prevent residual allowance
        IERC20(AWETH).approve(WETH_GATEWAY, 0);

        // Deduct from encrypted balance
        euint64 encAmount = FHE.asEuint64(uint64(amount / 1e9));
        _encryptedTotalStaked[msg.sender] = FHE.sub(_encryptedTotalStaked[msg.sender], encAmount);
        FHE.allow(_encryptedTotalStaked[msg.sender], msg.sender);
        FHE.allowThis(_encryptedTotalStaked[msg.sender]);

        // C-2: Increment nonce after successful unstake
        unstakeNonces[msg.sender] = currentNonce + 1;

        emit Unstaked(msg.sender, amount);
    }

    function getEncryptedTotalStaked(address user) external view returns (euint64) {
        return _encryptedTotalStaked[user];
    }

    receive() external payable {}
}
