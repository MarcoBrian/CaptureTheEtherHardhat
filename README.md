Challenges from [Capture the ether](https://capturetheether.com/) on hardhat.

## How to use:
1. Clone this repo.
2. Challenge Solutions can be found inside `./test/`.
3. Verify the result running ``npx hardhat test``.

## Challenges

### Warmup 
The warmup challenges are intended to get you familiar with the way Capture the Ether works and the tools you need to use.
1. [Deploy a contract](#deploy-a-contract)
2. [Call me](#call-me)
3. [Choose a nickname](#choose-a-nickname)

### Lotteries
Feeling lucky? These challenges will show how hard it is to run a fair lottery.
1. [Guess the number](#guess-the-number)
2. [Guess the secret number](#guess-the-secret-number)
3. [Guess the random number](#guess-the-random-number)
4. [Guess the new number](#guess-the-new-number)
5. [Predict the future](#predict-the-future)
6. [Predict the block hash](#predict-the-block-hash)

### Math
These challenges use a variety of techniques, but they all involve a bit of math.

1. [Token sale](#token-sale)
2. [Token whale](#token-whale)
3. [Retirement fund](#retirement-fund)
4. [Mapping](#mapping)
5. [Donation](#donation)
6. [Fifty years](#fifty-years)

### Accounts 
These challenges test your understanding of Ethereum accounts.
1. [Fuzzy identity](#fuzzy-identity)
2. [Public Key](#public-key)
3. [Account Takeover](#account-takeover)

### Miscellaneous
These challenges defy categorization
1. [Assume ownership](#assume-ownership)
2. [Token bank](#token-bank)

### Warmup
#### Deploy a Contract 
Proceed to deploy the Smart Contract
``` javascript
const TargetContract = await ethers.getContractFactory("DeployChallenge");
target = await TargetContract.deploy(); 
await target.deployed();
```

#### Call Me
Simply call the function to complete the challenge
``` javascript
await target.callme();
```
### Lotteries

#### Guess The number

The number `42`  is hardcoded in the smart contract and can easily be guessed

```javascript
const tx = await target.guess(42, { value: ethers.utils.parseEther("1") });

await tx.wait();
```

#### Guess The Secret Number

The number now is stored as a `keccak256` hash. Luckily the hash is created from a `uint8` type variable which is only 8 bits and therefore range only from `0 - 255`

``` python
from Crypto.Hash import keccak

target_hash = "0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365"

for i in range(256):
    # Convert integer to bytes
    input_bytes = i.to_bytes(1, byteorder='big')
    keccak_hash = keccak.new(digest_bits=256)
    keccak_hash.update(input_bytes)

    # Get the hexadecimal digest of the hash
    hash_result = keccak_hash.hexdigest()

    # Compare the result with the target hash
    if hash_result == target_hash[2:]:  # Remove '0x' from the target hash
        print(f"Found matching input: {i}")
        print(hash_result)
        break
else:
    print("No matching input found.")
```

The brute force will eventually find a solution `170`

``` Javascript

const tx = await target.guess(170, { value: ethers.utils.parseEther("1") });

await tx.wait();

```

#### Guess The Random Number

Variables and data on-chain is readable on public even for private variables. Technically for this challenge, you get retrieve the information directly since the `answer` variable is already defined during construction of the contract. 

``` javascript
await target.provider.getStorageAt(target.address, 0);
```

#### Guess The New Number

Using hardhat there are 2 ways to solve this. 
	1. Use a separate attacker contract to pass the calculation `uint8(keccak256(block.blockhash(block.number - 1), now))` as an argument to the `guess()` function. This will calculate the 
	2. *OR* In the Hardhat local environment , the user can manipulate block timestamp and block hash so that the answer is deterministic. 

#### Predict The Future
This one is an interesting challenge, the trick is to attempt a guess between `0 - 10`  *(because the answer is modulo 10)* , and keep reverting when the answer and the guess is not the same.

This way you don't need to spend ether on every guess, you can choose to call  `settle()` function and be guaranteed to win only when the `answer == guess`

#### Predict The Block Hash

[Solidity Documentation](https://docs.soliditylang.org/en/latest/units-and-global-variables.html)

> `blockhash(uint blockNumber) returns (bytes32)`: hash of the given block when `blocknumber` is one of the 256 most recent blocks; otherwise returns zero

To break the challenge we can input 0 value as the hash guess value. During testing it is possible to simulate more than 256 blocks mined and after calling `settle()` function the test will pass successfully.



### Math

#### Token Sale
In this challenge , you will need to make use of overflow attack in order to solve the challenge. 

The goal is to find the`numTokens` required to make the `total` value overflow. The overflow value will restart the amount of `msg.value` required and you can get many tokens at cheaper price. 


#### Token Whale
In this challenge, there are 2 key vulnerabilities that will allow the contract to be exploited.

1. The first vulnerability is the potential underflow in `_transfer()`  function
2. Second vulnerability is that the `transferFrom()` function is sending token from `msg.sender` instead of from `from` address because it calls `_transfer()` function

Vulnerability 1 
```solidity
function _transfer(address to, uint256 value) internal {

unchecked {
	balanceOf[msg.sender] -= value; // This line is vulnerable to underflow attack
	balanceOf[to] += value;
}
```

Vulnerability 2
```solidity
function transferFrom(address from, address to, uint256 value) public {

	require(balanceOf[from] >= value);
	require(balanceOf[to] + value >= balanceOf[to]);
	require(allowance[from][msg.sender] >= value);
	allowance[from][msg.sender] -= value;
	
	_transfer(to, value); // This is the vulnerable part
}
```

The overall idea here is that we need to make a contract balance underflow and therefore have the max number of tokens, and afterwards be able to send these tokens back to the original player. 

Therefore to complete the challenge the steps are as of the following: 
1. Create another exploit contract  -> let's call this *Contract E*
2. From the initial `player`  , call the `approve()` with the first argument as Contract E's Address, and second argument as some arbitrary amount of tokens say `100` tokens . 
3. Step 2 will allow the exploit contract (Contract E) to transfer some balance from the `player` to any address. 
4. In the exploit contract, perform this call `tokenWhale.transferFrom(player, player, 10);` 
5. By doing this the `transferFrom()` function will check that the contract E is approved to send tokens from `player`. But the transfer will actually come from the contract E (since the `balance` is taken from `msg.sender`)
6. Since `balance[msg.sender]` is `0` , performing a transfer will underflow and cause  `balance[msg.sender]` to have `type(uint256).max` value 
7. Then we can transfer some tokens from the contract E back to the `player` and complete the challenge.