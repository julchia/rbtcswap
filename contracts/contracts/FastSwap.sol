// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BTC<>rBTC Swap Contract
/// @notice Handles swaps between btc and rbtc on the rsk side
contract FastSwap is Ownable, AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public maxAmount;
    uint256 public minAmount;

    event FundDeposit(address from, uint256 amount);
    event FundWithdraw(address from, uint256 amount);
    event RBTCSwapIn(address destiny, uint256 amount);
    event RBTCSwapOut(address source, uint256 amount);

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not a operator");
        _;
    }

    /// @dev The administrator permission is also set to the owner address
    /// @param _operator Operator address
    /// @param _maxAmount Maximum value allowed to exchange
    /// @param _minAmount Minimum value allowed to exchange
    constructor(
        address _operator,
        uint256 _maxAmount,
        uint256 _minAmount
    ) {
        require(_operator != address(0), "_operator is required");
        require(_maxAmount != 0, "_maxAmount is required");
        require(_minAmount != 0, "_minAmount is required");
        maxAmount = _maxAmount;
        minAmount = _minAmount;
        // Grant the operator role
        _setupRole(OPERATOR_ROLE, _operator);
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice SwapOut function: to initialize the swap out (rBTC > BTC)
    /// @dev Payable fallback function who receives the amount of rBTC to convert
    receive() external payable {
        if (msg.sender != owner()) {
            require(
                msg.value <= maxAmount,
                "amount exceeds the maximum required"
            );
            require(
                msg.value >= minAmount,
                "amount does not reach the minimum required"
            );

            emit RBTCSwapOut(msg.sender, msg.value);
        }
    }

    /// @notice SwapIn function: releases rBTC funds for previous BTC deposits
    /// @param _destiny rBTC recipient address
    /// @param _amount Amount of rBTC to be transferred
    function rbtcSwapIn(address payable _destiny, uint256 _amount)
        external
        onlyOperator
    {
        require(_amount <= maxAmount, "_amount exceeds the maximum required");
        require(
            _amount >= minAmount,
            "_amount does not reach the minimum required"
        );
        require(
            _amount <= address(this).balance,
            "_amount is greater than the contract fund"
        );

        _destiny.transfer(_amount);
    }

    /// @notice Withdraw rBTC funds from contract balance
    /// @param _destiny rBTC recipient address
    /// @param _amount Amount of rBTC to be withdraw
    function withdrawFunds(address payable _destiny, uint256 _amount)
        external
        onlyOwner
    {
        require(_amount != 0, "_amount is required");
        require(
            _amount <= address(this).balance,
            "The withdrawal value is greater than the contract fund"
        );

        _destiny.transfer(_amount);

        emit FundWithdraw(_destiny, _amount);
    }

    /// @notice Withdraw all rBTC funds from contract balance
    /// @param _destiny rBTC recipient address
    function withdrawAllFunds(address payable _destiny) external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount != 0, "Contract balance is 0");

        _destiny.transfer(amount);

        emit FundWithdraw(_destiny, amount);
    }

    /// @notice Set max amount of rBTC allowed per swap
    /// @param _newAmount Amount of rBTC in wei
    function setMaxAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount != 0, "_newAmount is required");
        maxAmount = _newAmount;
    }

    /// @notice Set min amount of rBTC allowed per swap
    /// @param _newAmount Amount of rBTC in wei
    function setMinAmount(uint256 _newAmount) external onlyOwner {
        require(_newAmount != 0, "_newAmount is required");
        minAmount = _newAmount;
    }
}
