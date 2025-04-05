// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CoinSeller
 * @dev This contract allows for the transfer of native cryptocurrency (Maxi) with controlled access using AccessControl.
 */
contract CoinSeller is AccessControl, ReentrancyGuard {
  bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

  mapping(string => bool) public orderIdUsed;

  event Deposited(address indexed sender, uint256 amount);
  event Transferred(
    address indexed relayer,
    address indexed recipient,
    uint256 amount,
    string orderId,
    uint256 timestamp
  );

  /**
   * @dev Sets up the default admin role for the contract deployer.
   */
  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(RELAYER_ROLE, msg.sender);

  }

  /**
   * @dev Allows the contract to receive native currency. Emits a Deposited event.
   */
  receive() external payable {
    emit Deposited(msg.sender, msg.value);
  }

  /**
   * @dev Transfers native currency from the contract to a recipient.
   * Can only be called by an account with the RELAYER_ROLE.
   * @param recipient The address of the recipient.
   * @param amount The amount to transfer.
   * @param orderId A unique identifier for the transfer.
   */
  function transfer(
    address payable recipient,
    uint256 amount,
    string calldata orderId
  ) external nonReentrant onlyRole(RELAYER_ROLE) {
    require(amount > 0, "Amount must be greater than zero");
    require(recipient != address(0), "Recipient cannot be zero address");
    require(address(this).balance >= amount, "Insufficient balance in contract");
    require(!orderIdUsed[orderId], "Order ID already used");


    emit Transferred(msg.sender, recipient, amount, orderId, block.timestamp);
    orderIdUsed[orderId] = true;
    recipient.transfer(amount);

  }
  function isOrderTransferred(string calldata orderId) external view returns (bool) 
  {
    return orderIdUsed[orderId];
  }
 
}