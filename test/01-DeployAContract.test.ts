import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('DeployAContract', () => {
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  let target:any = null;

  beforeEach(async () => {
    [attacker, deployer] = await ethers.getSigners();
    // Deploy the contract here
    const TargetContract = await ethers.getContractFactory("DeployChallenge"); // Replace with your contract name
    target = await TargetContract.deploy(); // Add constructor arguments if needed
    await target.deployed();
  });

  it('exploit', async () => {
    expect(await target.isComplete()).to.equal(true);
  });
});
