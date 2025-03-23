// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract PredictTheFuture {
    address public guesser;
    uint8 public guess;
    uint256 public settlementBlockNumber;

    constructor() payable {
        require(msg.value == 1 ether, "require 1 ether");
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(uint8 n) public payable {
        require(guesser == address(0), "guesser needs to be empty address in the beginning");
        require(msg.value == 1 ether, "require 1 ether");

        guesser = msg.sender;
        guess = n;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser, "Message sender is not guesser");
        require(block.number > settlementBlockNumber, "Block number not bigger than settlement block");

        uint8 answer = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        block.timestamp
                    )
                )
            )
        ) % 10;

        guesser = address(0);
        if (guess == answer) {
            (bool ok, ) = msg.sender.call{value: 2 ether}("");
            require(ok, "Failed to send to msg.sender");
        }
    }
}
