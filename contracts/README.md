# FastSwap Contract

## Unit test

1. Install dependencies

```
npm install
```

2. Compile contracts

```
npm run compile
```

3. Run unit tests

```
npm test
```

3. Run coverage test

```
npm run coverage
```

## Contract deployment (on Kovan)

### Environment configuration

Make a copy of the env dile:

```
cp .env.example .env
```

Configuration variables:
```bash
# PROJECT ID infura API Key.
INFURA_API_KEY=
# Deployer address.
DEPLOYER_ADDRESS=0x..
# mnemonic phrase of deployer account.
DEPLOYER_MNENOMIC="some twelve words ....."
```

### Do the deployment

Once the environment configuration is completed, run the deploy command:
```
npm run migrate:kovan
```
