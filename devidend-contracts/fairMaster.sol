// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./base/SafeERC20.sol";

// Enhance From SG Version remove fee on profit
contract fairMaster is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for IERC20Dividends;

    IERC20 public paymentToken;
    IERC20Dividends public xfairToken;
    event DepositReward(uint256 amount);
    event AdminWithdraw(uint256 amount);

    event AdminTokenRecovery(address indexed user, uint256 amount);
    event updateDividingPeriod(uint256 dividendingBlockCount);
    event updateLockPeriod(uint256 lockProcessBlockCount);
  
    event DividendDistributed(uint256 amount);
    event MintToHolder(uint256 amount, address indexed holder);
    event BurnFromHolder(uint256 amount, address indexed holder);

    event SetEnable(bool _newStatus);
    event SetShares(uint256 shares);

    // Adjustable
    //Dividend waiting period
    uint256 public dividendingBlockCount;

    //Last distributed dividend block
    uint256 public lastDisburseBlock;
    // The address of the dividend deployer
    address public immutable VALUE_CHEF_DEPLOYER;
    // Whether it is initialized
    bool public isInitialized;
    // Accrued distributed devidend
    uint256 public accDisbursed;
    // Pool share limit
    uint256 public LimitShares;
    // current share
    uint256 public currentShares;
    // Fair master enable fag
    bool public isEnablePool;

    uint256 public startPoolBlock;
    uint256 public payoutPeriodBlockCount;
    //lock before devidend disburse
    uint256 public lockProcessBlockCount;

    mapping(address => UserInfo) public userInfo;
    struct UserInfo {
        uint256 shares; // xfair tokens that user hold
        uint256 lastestStakeBlock;
        uint256 lastestRemoveBlock;
    }

    constructor() {
        VALUE_CHEF_DEPLOYER = msg.sender;
    }

    function initialize(
        IERC20 _paymentToken,
        IERC20Dividends _xfairToken,
        address _admin,
        uint256 _startBlock,
        uint256 _finishBlockCount,
        uint256 _limitShares
    ) external {
        require(!isInitialized, "fairdMaster::initialize: Already initialized");
        require(
            msg.sender == VALUE_CHEF_DEPLOYER,
            "Fair Master::initialize: Not deployer"
        );

        // Make this contract initialized
        isInitialized = true;

        paymentToken = _paymentToken;
        xfairToken = _xfairToken;
        //adjustable
        dividendingBlockCount = 60480; //initial 7 days, blocktime 10s;
        lockProcessBlockCount = 8640; // initial 1 day


        // Start dividending period
        if (_startBlock == 0) {
            _startBlock = block.number;
        }
        startPoolBlock = _startBlock;
        lastDisburseBlock = _startBlock;

        if (_finishBlockCount == 0) {
            _finishBlockCount = 3170880; //initial 2 year, blocktime 10s;
        }
        payoutPeriodBlockCount = _finishBlockCount;

        LimitShares = _limitShares;
        currentShares = 0;
        isEnablePool = true;

        // Transfer ownership to the admin address who becomes owner of the contract
        transferOwnership(_admin);
    }

    /*
       Dividend pending for distribute 
    */
    function depositHolderShares(
        uint256 _amount,
        address holder
    ) external nonReentrant onlyOwner {
        require(
            isPoolReady(),
            "fairMaster::depositShares: Pool isn't ready to stake"
        );
        require(
            _amount > 0,
            "fairMaster::depositShares: Amount should more than 0"
        );
        require(
            checkNotExceedShares(_amount),
            "fairMaster::depositShares: Amount exceeds remain shares"
        );
        /*
        by pass for demo
        */
        // require(
        //     !isInEquiptyMintLockPeriod(),
        //     "fairMaster::depositShares: Pool is temperaly lock before dividend distribution"
        // );
        UserInfo storage user = userInfo[holder];

        // adjust shares balance

        xfairToken.mint(holder, _amount);
        user.lastestStakeBlock = block.number;
        user.shares = user.shares.add(_amount);
        currentShares = currentShares.add(_amount);
        user.shares = xfairToken.balanceOf(msg.sender);

        emit MintToHolder(_amount, holder);
    }

    function removeHolderShares(
        uint256 _amount,
        address holder
    ) external nonReentrant onlyOwner {
        require(
            isEnablePool,
            "fairMaster::removeShares: Pool is disable to disburse profit"
        );
        UserInfo storage user = userInfo[holder];
        // adjust shares in case remarket transfer
        if (user.shares == 0 || user.shares < xfairToken.balanceOf(holder)) {
            user.shares = xfairToken.balanceOf(holder);
        }
        require(
            _amount > 0,
            "fairMaster::removeShares: Amount should more than 0"
        );

        require(
            user.shares >= _amount,
            "fairMaster::removeShare: Insufficient balance"
        );
        user.shares = user.shares.sub(_amount);
        user.lastestRemoveBlock = block.number;
        currentShares = currentShares.sub(_amount);

        xfairToken.burn(holder, _amount);
        emit BurnFromHolder(_amount, holder);
    }

    /*
       Dividend pending for distribute 
    */
    function profitBalance() public view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    /*
     * @returns true in devidned gethering period
     */
    function isInDividingPeriod() public view returns (bool dividing) {
        dividing = (block.number <= nextDisburse());
    }

    /*
     * @returns true in lock for gethering period
     */
    function isInEquiptyMintLockPeriod() public view returns (bool lock) {
        lock = ((block.number.add(lockProcessBlockCount)) >= nextDisburse());
    }

    function nextDisburse() public view returns (uint256) {
        return lastDisburseBlock.add(dividendingBlockCount);
    }

    /*
       Dividend be distributed to shareholders 
    */
    function distributeDividend() external nonReentrant onlyOwner {
        /*
         by pass for demo
        */
        // require(
        //     !isInDividingPeriod(),
        //     "fairMaster::distributeProfit: Too early to distribute balance"
        // );

        uint256 _dvdtodist = profitBalance();
        require(
            _dvdtodist > 0,
            "dividendMaster::distributeReward: Dividend token amount must > 0"
        );

        uint256 allowAmount = paymentToken.allowance(
            address(this),
            address(xfairToken)
        );
        if (allowAmount == 0) {
            paymentToken.safeApprove(address(xfairToken), _dvdtodist);
        } else {
            if (allowAmount < _dvdtodist) {
                paymentToken.safeIncreaseAllowance(
                    address(xfairToken),
                    _dvdtodist
                );
            }
        }
        uint256 distAmount = _dvdtodist;
        
        lastDisburseBlock = block.number;
        accDisbursed = accDisbursed.add(distAmount);
        xfairToken.distribute(distAmount);
        emit DividendDistributed(distAmount);
    }

    /**
     * @notice Admin withdraw only reward token in emergency case.
     * @param _amount amount to withdraw
     */
    function adminDividendWithdraw(
        uint256 _amount
    ) external nonReentrant onlyOwner {
        require(
            _amount > 0,
            "dividendMaster::adminWithdraw: _amount should be higher than 0"
        );
        require(
            _amount <= profitBalance(),
            "dividendMaster::adminWithdraw: _amount should be less than or equal the total remaining reward"
        );
        paymentToken.safeTransfer(msg.sender, _amount);
        emit AdminWithdraw(_amount);
    }

    /**
     * @notice It allows the admin to recover wrong tokens sent to the contract
     * @param _tokenAddress: the address of the token to withdraw
     * @param _tokenAmount: the number of tokens to withdraw
     * @dev This function is only callable by admin.
     */
    function recoverWrongTokens(
        address _tokenAddress,
        uint256 _tokenAmount
    ) external onlyOwner {
        require(
            _tokenAddress != address(paymentToken),
            "dividendMaster::recoverWrongTokens: Cannot be reward token"
        );

        IERC20(_tokenAddress).safeTransfer(msg.sender, _tokenAmount);

        emit AdminTokenRecovery(_tokenAddress, _tokenAmount);
    }

    /**
     * @notice It allows the admin to update dividend master setting
     * @dev This function is only callable by admin.
     */
    function updateDivindingPeriod(uint256 _newCountBlock) external onlyOwner {
        require(
            _newCountBlock != dividendingBlockCount,
            "dividendMaster::updateDivindingPeriod: New dividending same old value"
        );

        // Set the dividend period as the block count
        lastDisburseBlock = block.number;
        dividendingBlockCount = _newCountBlock;

        emit updateDividingPeriod(_newCountBlock);
    }

    function updateDelayProcessPeriod(
        uint256 _newCountBlock
    ) external onlyOwner {
        require(
            _newCountBlock != lockProcessBlockCount,
            "dividendMaster::updateLockProcessPeriod: New lock period same old value"
        );

        // Set the dividend period as the block count
        lockProcessBlockCount = _newCountBlock;

        emit updateLockPeriod(_newCountBlock);
    }

    /*
     * @notice profit payment balance
     */
    function getCurrenthares() public view returns (uint256) {
        return currentShares;
    }

    /*
     * @notice shares limit is exceed or not
     */
    function checkNotExceedShares(
        uint256 newshare
    ) public view returns (bool isNotExceed) {
        isNotExceed = (getCurrenthares().add(newshare) <= LimitShares);
    }

    /*
     * @notice get shares remain in pool
     */
    function getRemainShares() public view returns (uint256 remain) {
        remain = LimitShares.sub(getCurrenthares());
    }

    /*
     * @notice dividend payout period is finish or not
     */
    function isPoolNotFinish() public view returns (bool isOn) {
        isOn = (block.number < startPoolBlock.add(payoutPeriodBlockCount));
    }

    /*
     * @notice check that is pool ready to use so must enable and be in payout period
     */
    function isPoolReady() public view returns (bool isReady) {
        isReady = (isPoolNotFinish() && isEnablePool);
    }


    function setEnablePool(bool _newStatus) external onlyOwner {
        bool _oldStatus = isEnablePool;
        require(
            _newStatus != _oldStatus,
            "dividendMaster::setEnable: New Status same old value"
        );
        isEnablePool = _newStatus;

        emit SetEnable(_newStatus);
    }

    function setLimitShares(uint256 _newLimit) external onlyOwner {
        uint256 _oldLimit = LimitShares;
        require(
            _newLimit != _oldLimit,
            "dividendMaster::setLimitShares: New Limit same old limit shares"
        );
        LimitShares = _newLimit;

        emit SetShares(_newLimit);
    }
}

interface IERC20Dividends {
    function mint(address to, uint256 amount) external;

    function burn(address from, uint256 amount) external;

    function distribute(uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}
