// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BuilderRewards
 * @notice A smart contract for distributing ETH rewards to top Mantle builders
 * @dev Deployed on Mantle Network - distributes 10 ETH to top 10 builders
 * 
 * Distribution Scale (for 10 ETH total):
 * - Rank 1: 2.5 ETH (25%)
 * - Rank 2: 1.8 ETH (18%)
 * - Rank 3: 1.4 ETH (14%)
 * - Rank 4: 1.1 ETH (11%)
 * - Rank 5: 0.9 ETH (9%)
 * - Rank 6: 0.7 ETH (7%)
 * - Rank 7: 0.6 ETH (6%)
 * - Rank 8: 0.5 ETH (5%)
 * - Rank 9: 0.3 ETH (3%)
 * - Rank 10: 0.2 ETH (2%)
 */
contract BuilderRewards {
    address public owner;
    
    // Distribution percentages (in basis points, 10000 = 100%)
    // These percentages sum to 10000 (100%)
    uint256[10] public distributionPercentages = [
        2500,  // Rank 1: 25%
        1800,  // Rank 2: 18%
        1400,  // Rank 3: 14%
        1100,  // Rank 4: 11%
        900,   // Rank 5: 9%
        700,   // Rank 6: 7%
        600,   // Rank 7: 6%
        500,   // Rank 8: 5%
        300,   // Rank 9: 3%
        200    // Rank 10: 2%
    ];
    
    // Top 10 builder wallet addresses
    address[10] public topBuilders;
    
    // Events
    event FundsReceived(address indexed sender, uint256 amount);
    event RewardsDistributed(uint256 totalAmount, uint256 timestamp);
    event BuilderPaid(address indexed builder, uint256 rank, uint256 amount);
    event TopBuildersUpdated(address[10] builders);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor(address[10] memory _initialBuilders) {
        owner = msg.sender;
        topBuilders = _initialBuilders;
    }
    
    /**
     * @notice Receive ETH into the contract
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    /**
     * @notice Fallback function to receive ETH
     */
    fallback() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    /**
     * @notice Update the top 10 builder addresses
     * @param _newBuilders Array of 10 wallet addresses ranked from 1st to 10th
     */
    function updateTopBuilders(address[10] memory _newBuilders) external onlyOwner {
        // Validate all addresses are non-zero
        for (uint256 i = 0; i < 10; i++) {
            require(_newBuilders[i] != address(0), "Invalid address at position");
        }
        topBuilders = _newBuilders;
        emit TopBuildersUpdated(_newBuilders);
    }
    
    /**
     * @notice Distribute all ETH in the contract to the top 10 builders
     * @dev Can only be called by the owner
     */
    function distributeRewards() external onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No funds to distribute");
        
        // Validate all builder addresses are set
        for (uint256 i = 0; i < 10; i++) {
            require(topBuilders[i] != address(0), "Builder address not set");
        }
        
        // Distribute to each builder based on their rank
        for (uint256 i = 0; i < 10; i++) {
            uint256 amount = (totalBalance * distributionPercentages[i]) / 10000;
            
            if (amount > 0) {
                (bool success, ) = payable(topBuilders[i]).call{value: amount}("");
                require(success, "Transfer failed");
                emit BuilderPaid(topBuilders[i], i + 1, amount);
            }
        }
        
        emit RewardsDistributed(totalBalance, block.timestamp);
    }
    
    /**
     * @notice Get the current contract balance
     * @return The balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get all top builder addresses
     * @return Array of 10 builder addresses
     */
    function getTopBuilders() external view returns (address[10] memory) {
        return topBuilders;
    }
    
    /**
     * @notice Get the distribution amount for each rank based on current balance
     * @return amounts Array of amounts each builder would receive
     */
    function getDistributionAmounts() external view returns (uint256[10] memory amounts) {
        uint256 totalBalance = address(this).balance;
        for (uint256 i = 0; i < 10; i++) {
            amounts[i] = (totalBalance * distributionPercentages[i]) / 10000;
        }
        return amounts;
    }
    
    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    /**
     * @notice Emergency withdraw function (only owner)
     * @dev Use only in case of emergency - withdraws all funds to owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}
