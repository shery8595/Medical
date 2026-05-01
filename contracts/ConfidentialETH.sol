// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, Common, euint64, ebool, InEuint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ConfidentialETH
 * @notice A privacy-preserving wrapper for native ETH (similar to WETH but with FHE)
 * @dev 1 unit = 1 micro-ETH (1e-6 ETH = 1e12 wei)
 */
contract ConfidentialETH {
    uint256 public constant UNIT_SCALE = 1_000_000_000_000; // 1 unit = 1e12 wei = 1 micro-ETH

    mapping(address => euint64) private _balances;
    mapping(address => bool) public authorizedContracts;
    mapping(bytes32 => bool) private usedWithdrawProofs;
    // C-2: Per-user nonce for replay protection
    mapping(address => uint256) public withdrawNonces;
    address public owner;
    // AUDIT-MED: Add two-step ownership transfer (previously no transfer function existed).
    address public pendingOwner;

    // Reentrancy Guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    event Deposit(address indexed user, uint256 weiAmount, uint64 units);
    event Withdrawal(address indexed user, uint256 weiAmount);
    event EncryptedTransfer(address indexed from, address indexed to);
    event OwnershipProposed(address indexed proposedOwner);
    event OwnershipAccepted(address indexed newOwner);

    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedContracts[msg.sender], "Not authorized");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    function authorizeContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Zero address");
        authorizedContracts[_contract] = true;
    }

    // AUDIT-MED: Allow owners to revoke authorization (previously one-way grant only).
    function deauthorizeContract(address _contract) external onlyOwner {
        authorizedContracts[_contract] = false;
    }

    /// @notice AUDIT-MED: Two-step ownership transfer.
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

    /**
     * @notice Deposit native ETH and receive encrypted balance
     */
    function deposit() external payable {
        require(msg.value > 0, "Amount must be > 0");
        require(msg.value >= UNIT_SCALE, "Min deposit is 1 micro-ETH");
        
        uint64 units = uint64(msg.value / UNIT_SCALE);
        _creditBalance(msg.sender, units);

        emit Deposit(msg.sender, msg.value, units);
    }

    /**
     * @notice Deposit ETH on behalf of another user (used by authorized vault contracts)
     * @dev The vault calls this to credit encrypted cETH to a participant's balance
     */
    function depositFor(address _recipient) external payable onlyAuthorized {
        require(msg.value > 0, "Amount must be > 0");
        require(msg.value >= UNIT_SCALE, "Min deposit is 1 micro-ETH");
        
        uint64 units = uint64(msg.value / UNIT_SCALE);
        _creditBalance(_recipient, units);

        emit Deposit(_recipient, msg.value, units);
    }

    /**
     * @notice Withdraw by providing the plaintext amount and a Threshold Network signature
     * @dev CRIT-3: Requires a TN signature proving plaintext(balance) >= units.
     *      This prevents free ETH extraction via FHE underflow edge cases.
     * @dev C-2: Signature must cover (ctHash, balance, msg.sender, units, nonce) to prevent replay
     * @param units The amount to withdraw in micro-ETH units
     * @param balanceSig Threshold Network ECDSA signature over (ctHash, balance, caller, units, nonce)
     * @param balance The claimed plaintext balance (must match signature)
     */
    function withdraw(uint64 units, bytes calldata balanceSig, uint64 balance) external nonReentrant {
        require(units > 0, "Amount must be > 0");
        
        // C-2: Include caller, units, and nonce in proof key for replay protection
        // The Threshold Network signature must cover: (ctHash, balance, msg.sender, units, nonce)
        uint256 currentNonce = withdrawNonces[msg.sender];
        bytes32 proofKey = keccak256(abi.encodePacked(balanceSig, msg.sender, units, currentNonce));
        require(!usedWithdrawProofs[proofKey], "Proof already used");
        usedWithdrawProofs[proofKey] = true;
        
        euint64 bal = _balances[msg.sender];
        require(Common.isInitialized(bal), "No balance");

        // CRIT-3: Verify TN signed that plaintext(balance) >= units
        require(balance >= units, "Insufficient balance");
        require(
            FHE.verifyDecryptResult(bal, balance, balanceSig),
            "Invalid balance proof"
        );

        euint64 eAmount = FHE.asEuint64(units);
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], eAmount);

        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[msg.sender]);

        uint256 weiAmount = uint256(units) * UNIT_SCALE;

        // LOW-2: Increment nonce BEFORE external call (Checks-Effects-Interactions pattern)
        // nonReentrant guard provides additional protection
        withdrawNonces[msg.sender] = currentNonce + 1;

        (bool success, ) = msg.sender.call{value: weiAmount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, weiAmount);
    }

    /**
     * @notice Withdraw on behalf with Threshold Network signature verification
     * @dev CRIT-3: Same protection as withdraw() but for authorized contract usage
     * @dev C-2: Signature must cover (ctHash, balance, user, destination, units, nonce) to prevent replay
     */
    function withdrawTo(
        address user,
        address destination,
        uint64 units,
        bytes calldata balanceSig,
        uint64 balance
    ) external onlyAuthorized nonReentrant {
        require(units > 0, "Amount must be > 0");
        
        // C-2: Include user, destination, units, and nonce in proof key for replay protection
        // The Threshold Network signature must cover: (ctHash, balance, user, destination, units, nonce)
        uint256 currentNonce = withdrawNonces[user];
        bytes32 proofKey = keccak256(abi.encodePacked(balanceSig, user, destination, units, currentNonce));
        require(!usedWithdrawProofs[proofKey], "Proof already used");
        usedWithdrawProofs[proofKey] = true;
        
        euint64 bal = _balances[user];
        require(Common.isInitialized(bal), "No balance");

        // CRIT-3: Verify TN signed that plaintext(balance) >= units
        require(balance >= units, "Insufficient balance");
        require(
            FHE.verifyDecryptResult(bal, balance, balanceSig),
            "Invalid balance proof"
        );

        euint64 eAmount = FHE.asEuint64(units);
        _balances[user] = FHE.sub(_balances[user], eAmount);

        FHE.allow(_balances[user], user);
        FHE.allowThis(_balances[user]);

        uint256 weiAmount = uint256(units) * UNIT_SCALE;

        // LOW-2: Increment nonce BEFORE external call (Checks-Effects-Interactions pattern)
        withdrawNonces[user] = currentNonce + 1;

        (bool success, ) = destination.call{value: weiAmount}("");
        require(success, "Transfer failed");

        emit Withdrawal(user, weiAmount);
    }


    /**
     * @notice Encrypted transfer between accounts (used by authorized vault contracts)
     * @dev LOW-1: Any authorized contract can transfer from any user to any destination.
     *      This is by design — authorized contracts are fully trusted. If compromised,
     *      they can drain all balances. Use extreme caution when authorizing contracts.
     */
    function transferEncrypted(address from, address to, euint64 amount) external onlyAuthorized {
        _balances[from] = FHE.sub(_balances[from], amount);

        if (Common.isInitialized(_balances[to])) {
            _balances[to] = FHE.add(_balances[to], amount);
        } else {
            _balances[to] = amount;
        }

        FHE.allow(_balances[from], from);
        FHE.allow(_balances[to], to);
        FHE.allowThis(_balances[from]);
        FHE.allowThis(_balances[to]);

        emit EncryptedTransfer(from, to);
    }

    function getBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    /**
     * @dev Internal helper to credit encrypted balance
     */
    function _creditBalance(address user, uint64 units) internal {
        euint64 encryptedAmount = FHE.asEuint64(units);

        if (Common.isInitialized(_balances[user])) {
            _balances[user] = FHE.add(_balances[user], encryptedAmount);
        } else {
            _balances[user] = encryptedAmount;
        }

        FHE.allow(_balances[user], user);
        FHE.allowThis(_balances[user]);
    }

    /**
     * @notice FINDING 7: Auto-credit direct ETH transfers as deposits
     * @dev Prevents ETH from being locked forever in the contract
     */
    receive() external payable {
        require(msg.value >= UNIT_SCALE, "Min deposit is 1 micro-ETH");
        uint64 units = uint64(msg.value / UNIT_SCALE);
        _creditBalance(msg.sender, units);
        emit Deposit(msg.sender, msg.value, units);
    }
}
