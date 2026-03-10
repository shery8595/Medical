// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

contract MockAave {
    mapping(address => uint256) public balances;
    
    function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable {
        balances[onBehalfOf] += msg.value;
    }

    function withdrawETH(address pool, uint256 amount, address to) external {
        require(balances[msg.sender] >= amount, "Insufficient aWETH");
        balances[msg.sender] -= amount;
        payable(to).transfer(amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        return true;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        require(balances[sender] >= amount, "Insufficient aWETH");
        balances[sender] -= amount;
        balances[recipient] += amount;
        return true;
    }

    receive() external payable {}
}
