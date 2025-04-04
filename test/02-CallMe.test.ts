import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('DeployAContract', () => {
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  let target: Contract;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (await ethers.getContractFactory('CallMeChallenge', deployer)).deploy();

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    await target.callme(); 
    expect(await target.isComplete()).to.equal(true);
  });
});
