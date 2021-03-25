require('chai').should();
const { accounts, contract } = require('@openzeppelin/test-environment');
const {
  BN,
  expectEvent,
  expectRevert,
  constants,
  balance,
  send
} = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const FastSwap = contract.fromArtifact('FastSwap');

describe('FastSwap contract', () => {
  const [owner, operator, otherAccount] = accounts;
  // 1 ether
  const MAX_AMOUNT = new BN("1000000000000000000");
  // 0.1 ether
  const MIN_AMOUNT = new BN("100000000000000000");
  // 0.001 ether
  const UNDER_MIN_AMOUNT = new BN("10000000000000000");
  // 2 ether
  const ABOVE_MAX_AMOUNT = new BN("2000000000000000000");

  describe('constructor parameters', async () => {
    it('check operator', async () => {
      await expectRevert(FastSwap.new(
        ZERO_ADDRESS,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      ),
        "_operator is required"
      );
    });

    it('check max and min amounts', async () => {
      await expectRevert(FastSwap.new(
        operator,
        0,
        MIN_AMOUNT,
        { from: owner }
      ),
        "_maxAmount is required"
      );

      await expectRevert(FastSwap.new(
        operator,
        MAX_AMOUNT,
        0,
        { from: owner }
      ),
        "_minAmount is required"
      );
    });
  });

  describe('state variables', async () => {
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check max amount', async () => {
      (await this.contract.maxAmount()).should.be.bignumber.equal(MAX_AMOUNT);
    });

    it('check min amount', async () => {
      (await this.contract.minAmount()).should.be.bignumber.equal(MIN_AMOUNT);
    });

    it('check owner', async () => {
      (await this.contract.owner()).should.equal(owner);
    });

    it('check owner admin role', async () => {
      const DEFAULT_ADMIN_ROLE = await this.contract.DEFAULT_ADMIN_ROLE();
      (await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).should.equal(true);
    });

    it('check operator role', async () => {
      const OPERATOR_ROLE = await this.contract.OPERATOR_ROLE();
      (await this.contract.hasRole(OPERATOR_ROLE, operator)).should.equal(true);
    });
  });

  describe('roles on set max and min amounts', async () => {
    const NEW_MAX_AMOUNT = new BN("10000000000000000000000");
    const NEW_MIN_AMOUNT = new BN("1000000000000000");

    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check set max amount', async () => {
      await expectRevert(
        this.contract.setMaxAmount(NEW_MAX_AMOUNT, { from: operator }),
        "Ownable: caller is not the owner"
      );
      await expectRevert(
        this.contract.setMaxAmount(0, { from: owner }),
        "_newAmount is required"
      );
      await this.contract.setMaxAmount(NEW_MAX_AMOUNT, { from: owner });

      (await this.contract.maxAmount()).should.be.bignumber.equal(NEW_MAX_AMOUNT);
    });

    it('check set min amount', async () => {
      await expectRevert(
        this.contract.setMinAmount(NEW_MIN_AMOUNT, { from: operator }),
        "Ownable: caller is not the owner"
      );
      await expectRevert(
        this.contract.setMinAmount(0, { from: owner }),
        "_newAmount is required"
      );
      await this.contract.setMinAmount(NEW_MIN_AMOUNT, { from: owner });

      (await this.contract.minAmount()).should.be.bignumber.equal(NEW_MIN_AMOUNT);
    });
  });

  describe('swap out', async () => {
    // 0.3 ether
    const RIGHT_AMOUNT = new BN("300000000000000000");
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check requiremend on swap out', async () => {
      await expectRevert(
        this.contract.send(UNDER_MIN_AMOUNT, { from: otherAccount }),
        "amount does not reach the minimum required"
      );

      await expectRevert(
        this.contract.send(ABOVE_MAX_AMOUNT, { from: otherAccount }),
        "amount exceeds the maximum required"
      );

      const { logs } = await this.contract.send(RIGHT_AMOUNT, { from: otherAccount });
      expectEvent.inLogs(logs, 'RBTCSwapOut', {
        source: otherAccount,
        amount: RIGHT_AMOUNT,
      });
      await this.contract.send(MIN_AMOUNT, { from: otherAccount });
      await this.contract.send(MAX_AMOUNT, { from: otherAccount });
    });
  });

  describe('swap in', async () => {
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check contract balance before fund', async () => {
      const balanceTracker = await balance.tracker(this.contract.address);
      const beforeBalance = await balanceTracker.get()
      beforeBalance.should.be.bignumber.equal(new BN('0'));

      await send.ether(owner, this.contract.address, MIN_AMOUNT);
      (await balanceTracker.get()).should.be.bignumber.equal(MIN_AMOUNT);
    });

    it('check role', async () => {
      await send.ether(owner, this.contract.address, MAX_AMOUNT);
      await expectRevert(
        this.contract.rbtcSwapIn(otherAccount, MIN_AMOUNT, { from: otherAccount }),
        "Caller is not a operator"
      );
    });

    it('check underfunded', async () => {
      await send.ether(owner, this.contract.address, MIN_AMOUNT);
      await expectRevert(
        this.contract.rbtcSwapIn(otherAccount, MAX_AMOUNT, { from: operator }),
        "_amount is greater than the contract fund"
      );
    });

    it('check amount limits', async () => {
      await send.ether(owner, this.contract.address, MAX_AMOUNT);
      await expectRevert(
        this.contract.rbtcSwapIn(otherAccount, UNDER_MIN_AMOUNT, { from: operator }),
        "_amount does not reach the minimum required"
      );

      await expectRevert(
        this.contract.rbtcSwapIn(otherAccount, ABOVE_MAX_AMOUNT, { from: operator }),
        "_amount exceeds the maximum required"
      );
    });

    it('check balances after swap in', async () => {
      await send.ether(owner, this.contract.address, MAX_AMOUNT);
      const contractTracker = await balance.tracker(this.contract.address);
      const accountTracker = await balance.tracker(otherAccount);

      await this.contract.rbtcSwapIn(otherAccount, MIN_AMOUNT, { from: operator });
      (await accountTracker.delta()).should.be.bignumber.equal((await contractTracker.delta()).abs());
    });
  });

  describe('withdraw function', async () => {
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('withdraw funds', async () => {
      await expectRevert(
        this.contract.withdrawFunds(operator, "0", { from: owner }),
        "_amount is require"
      );
      await expectRevert(
        this.contract.withdrawFunds(operator, MAX_AMOUNT, { from: owner }),
        "The withdrawal value is greater than the contract fun"
      );

      const oneEthers = new BN("1000000000000000000");
      const twoEthers = new BN("2000000000000000000");
      await send.ether(owner, this.contract.address, twoEthers);
      const contractTracker = await balance.tracker(this.contract.address);
      const operatorTracker = await balance.tracker(operator);
      await contractTracker.get();
      await operatorTracker.get();

      await expectRevert(
        this.contract.withdrawFunds(operator, twoEthers, { from: otherAccount }),
        "Ownable: caller is not the owne"
      );

      await this.contract.withdrawFunds(operator, oneEthers, { from: owner });

      (await operatorTracker.delta()).should.be.bignumber.equal(oneEthers);
      ((await contractTracker.delta()).abs()).should.be.bignumber.equal(oneEthers);
    });

    it('withdraw all funds', async () => {
      await expectRevert(
        this.contract.withdrawAllFunds(operator, { from: owner }),
        "Contract balance is 0"
      );

      const twoEthers = new BN("2000000000000000000");
      await send.ether(owner, this.contract.address, twoEthers);
      const contractTracker = await balance.tracker(this.contract.address);
      const operatorTracker = await balance.tracker(operator);
      await contractTracker.get();
      await operatorTracker.get();

      await expectRevert(
        this.contract.withdrawAllFunds(operator, { from: otherAccount }),
        "Ownable: caller is not the owne"
      );

      await this.contract.withdrawAllFunds(operator, { from: owner });

      (await operatorTracker.delta()).should.be.bignumber.equal(twoEthers);
      ((await contractTracker.delta()).abs()).should.be.bignumber.equal(twoEthers);
    });
  });
});
