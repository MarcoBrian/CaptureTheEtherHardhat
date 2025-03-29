import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('TokenWhaleChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;
  let attackContract: Contract; 

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenWhaleChallenge', deployer)
    ).deploy(attacker.address);

    await target.deployed();

    target = target.connect(attacker);

    attackContract = await(
      await ethers.getContractFactory('TokenWhaleExploit', deployer)
    ).deploy(target.address, attacker.address);
    
    await attackContract.deployed(); 



  });

  it('exploit', async () => {
    
     // give approval from 'player' to the attack contract to transfer balance
    await target.approve(attackContract.address,100);
    await attackContract.attack(); 

    expect(await target.isComplete()).to.equal(true);
  });
});
