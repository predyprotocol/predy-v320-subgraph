import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
  InterestGrowthUpdated,
  MarginUpdated,
  OperatorUpdated,
  PairAdded,
  PositionLiquidated,
  PositionUpdated,
  PositionUpdatedPayoffStruct,
  PremiumGrowthUpdated,
  Rebalanced,
  ScaledAssetPositionUpdated,
  SqrtPositionUpdated,
  TokenSupplied,
  TokenWithdrawn,
  VaultCreated
} from '../generated/PredyPool/PredyPool'
import {
  RebalanceHistoryItem,
  TradeHistoryItem,
  VaultEntity
} from '../generated/schema'
import {
  createFeeHistory,
  createLiquidationHistory,
  createMarginHistory,
  ensureFeeDaily,
  ensureFeeEntity,
  ensureOpenPosition,
  ensurePairEntity,
  toPairId,
  toRebalanceId,
  toVaultId
} from './helper'
import { ONE, Q128 } from './constants'
import {
  createLendingDepositHistory,
  createLendingWithdrawHistory
} from './history'
import { updateOpenInterest } from './OpenInterest'
import { controllerContract } from './contracts'

export function handleOperatorUpdated(event: OperatorUpdated): void {}

export function handlePairAdded(event: PairAdded): void {
  const pair = ensurePairEntity(event.params.pairId, event.block.timestamp)

  pair.marginId = event.params.marginId
  pair.pairId = event.params.pairId
  pair.uniswapPool = event.params.uniswapPool

  pair.save()
}

export function handleVaultCreated(event: VaultCreated): void {
  const vault = new VaultEntity(toVaultId(event.params.vaultId))

  vault.marginId = event.params.marginId
  vault.vaultId = event.params.vaultId
  vault.owner = event.params.owner
  vault.margin = BigInt.zero()
  vault.isClosed = false

  vault.save()
}

export function handleTokenSupplied(event: TokenSupplied): void {
  const pairId = event.params.pairId
  const timestamp = event.block.timestamp
  const suppliedAmount = event.params.suppliedAmount

  createLendingDepositHistory(
    event.address,
    pairId,
    event.params.isStable,
    event.transaction.from,
    event.transaction.hash.toHex(),
    event.logIndex,
    suppliedAmount,
    timestamp
  )
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  const pairId = event.params.pairId
  const timestamp = event.block.timestamp
  const finalWithdrawnAmount = event.params.finalWithdrawnAmount

  createLendingWithdrawHistory(
    event.address,
    pairId,
    event.params.isStable,
    event.transaction.from,
    event.transaction.hash.toHex(),
    event.logIndex,
    finalWithdrawnAmount,
    timestamp
  )
}

export function handleMarginUpdated(event: MarginUpdated): void {
  const vault = VaultEntity.load(toVaultId(event.params.vaultId))

  if (!vault) {
    return
  }

  vault.margin = vault.margin.plus(event.params.updateMarginAmount)

  if (!vault.isMainVault && vault.margin.equals(BigInt.zero())) {
    vault.isClosed = true
  }

  vault.save()

  createMarginHistory(
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.updateMarginAmount,
    event.block.timestamp
  )
}

function closeVault(
  txHash: Bytes,
  vaultId: BigInt,
  isolatedVaultId: BigInt,
  marginAmount: BigInt,
  timestamp: BigInt
): void {
  const vault = VaultEntity.load(toVaultId(vaultId))
  const isolatedVault = VaultEntity.load(toVaultId(isolatedVaultId))

  if (!vault || !isolatedVault) {
    return
  }

  vault.margin = vault.margin.plus(marginAmount)
  isolatedVault.margin = isolatedVault.margin.minus(marginAmount)
  if (!vaultId.equals(isolatedVaultId)) {
    isolatedVault.isClosed = true
  }

  vault.save()
  isolatedVault.save()

  createMarginHistory(txHash.toHex(), vaultId, marginAmount, timestamp)
  createMarginHistory(
    txHash.toHex(),
    isolatedVaultId,
    marginAmount.neg(),
    timestamp
  )
}

export function handlePositionUpdated(event: PositionUpdated): void {
  updatePosition(
    event.transaction.hash,
    event.logIndex,
    event.params.vaultId,
    event.params.pairId,
    event.params.tradeAmount,
    event.params.tradeSqrtAmount,
    event.params.payoff,
    event.params.fee,
    event.block.timestamp
  )
}

export function handlePositionLiquidated(event: PositionLiquidated): void {
  const payoff = new PositionUpdatedPayoffStruct()

  for (let i = 0; i < 6; i++) {
    payoff.push(event.params.payoff[i])
  }

  updatePosition(
    event.transaction.hash,
    event.logIndex,
    event.params.vaultId,
    event.params.pairId,
    event.params.tradeAmount,
    event.params.tradeSqrtAmount,
    payoff,
    event.params.fee,
    event.block.timestamp
  )
}

function updatePosition(
  txHash: Bytes,
  logIndex: BigInt,
  vaultId: BigInt,
  pairId: BigInt,
  tradeAmount: BigInt,
  tradeSqrtAmount: BigInt,
  payoff: PositionUpdatedPayoffStruct,
  fee: BigInt,
  timestamp: BigInt
): void {
  const openPosition = ensureOpenPosition(pairId, vaultId, timestamp)

  // Update OI
  updateOpenInterest(
    pairId,
    timestamp,
    openPosition.tradeAmount,
    tradeAmount,
    openPosition.sqrtTradeAmount,
    tradeSqrtAmount
  )

  openPosition.tradeAmount = openPosition.tradeAmount.plus(tradeAmount)
  openPosition.sqrtTradeAmount =
    openPosition.sqrtTradeAmount.plus(tradeSqrtAmount)
  openPosition.entryValue = openPosition.entryValue.plus(payoff.perpEntryUpdate)
  openPosition.sqrtEntryValue = openPosition.sqrtEntryValue.plus(
    payoff.sqrtEntryUpdate
  )
  openPosition.sqrtRebalanceEntryValueStable =
    openPosition.sqrtRebalanceEntryValueStable.plus(
      payoff.sqrtRebalanceEntryUpdateStable
    )
  openPosition.sqrtRebalanceEntryValueUnderlying =
    openPosition.sqrtRebalanceEntryValueUnderlying.plus(
      payoff.sqrtRebalanceEntryUpdateUnderlying
    )
  openPosition.feeAmount = openPosition.feeAmount.plus(fee)

  if (!tradeAmount.equals(BigInt.zero())) {
    openPosition.perpUpdatedAt = timestamp
  }

  if (!tradeSqrtAmount.equals(BigInt.zero())) {
    openPosition.squartUpdatedAt = timestamp
  }

  openPosition.save()

  const vault = VaultEntity.load(toVaultId(vaultId))
  if (vault) {
    vault.margin = vault.margin
      .plus(payoff.perpPayoff)
      .plus(payoff.sqrtPayoff)
      .plus(fee)
  }

  if (!fee.equals(BigInt.zero())) {
    createFeeHistory(txHash.toHex(), logIndex, vaultId, fee, timestamp)
  }

  if (!tradeAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(
      txHash.toHex() +
        '-' +
        logIndex.toString() +
        '-' +
        vaultId.toString() +
        '-perp'
    )

    historyItem.vault = toVaultId(vaultId)
    historyItem.pair = toPairId(pairId)
    historyItem.action = 'POSITION'
    historyItem.product = 'PERP'
    historyItem.size = tradeAmount
    historyItem.entryValue = payoff.perpEntryUpdate
    historyItem.payoff = payoff.perpPayoff
    historyItem.txHash = txHash.toHex()
    historyItem.createdAt = timestamp

    historyItem.save()
  }

  if (!tradeSqrtAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(
      txHash.toHex() +
        '-' +
        logIndex.toString() +
        '-' +
        vaultId.toString() +
        '-sqrt'
    )

    historyItem.vault = toVaultId(vaultId)
    historyItem.pair = toPairId(pairId)
    historyItem.action = 'POSITION'
    historyItem.product = 'SQRT'
    historyItem.size = tradeSqrtAmount
    historyItem.entryValue = payoff.sqrtEntryUpdate
    historyItem.payoff = payoff.sqrtPayoff
    historyItem.txHash = txHash.toHex()
    historyItem.createdAt = timestamp

    historyItem.save()
  }
}

export function handleRebalanced(event: Rebalanced): void {
  const id = toRebalanceId(event)

  const item = new RebalanceHistoryItem(id)

  item.pair = toPairId(event.params.pairId)
  item.tickLower = BigInt.fromI32(event.params.tickLower)
  item.tickUpper = BigInt.fromI32(event.params.tickUpper)
  // TODO: deltaPositionAmount
  item.createdAt = event.block.timestamp

  item.save()
}

export function handleScaledAssetPositionUpdated(
  event: ScaledAssetPositionUpdated
): void {}

export function handleSqrtPositionUpdated(event: SqrtPositionUpdated): void {}

export function handleInterestGrowthUpdated(
  event: InterestGrowthUpdated
): void {
  const pairId = event.params.pairId
  const timestamp = event.block.timestamp
  const stableStatus = event.params.stableStatus
  const underlyingStatus = event.params.underlyingStatus

  const feeEntity = ensureFeeEntity(
    event.address,
    pairId,
    event.transaction.hash,
    timestamp
  )

  const totalStableSupply = stableStatus.assetScaler
    .times(stableStatus.totalCompoundDeposited)
    .plus(stableStatus.totalNormalDeposited)
  const totalStableBorrow = stableStatus.totalNormalBorrowed

  feeEntity.supplyStableInterest = event.params.interestRateStable
    .times(totalStableBorrow)
    .div(totalStableSupply)
  feeEntity.borrowStableInterest = event.params.interestRateStable
  feeEntity.supplyStableFee = feeEntity.supplyStableInterest
    .times(totalStableSupply)
    .div(ONE)
  feeEntity.supplyStableInterestGrowth = stableStatus.assetGrowth

  feeEntity.borrowStableFee = feeEntity.borrowStableInterest
    .times(totalStableBorrow)
    .div(ONE)
  feeEntity.borrowStableInterestGrowth = stableStatus.debtGrowth

  const totalUnderlyingSupply = underlyingStatus.assetScaler
    .times(underlyingStatus.totalCompoundDeposited)
    .plus(underlyingStatus.totalNormalDeposited)
  const totalUnderlyingBorrow = underlyingStatus.totalNormalBorrowed

  feeEntity.supplyUnderlyingInterest = event.params.interestRateUnderlying
    .times(totalUnderlyingBorrow)
    .div(totalUnderlyingSupply)
  feeEntity.borrowUnderlyingInterest = event.params.interestRateUnderlying
  feeEntity.supplyUnderlyingFee = feeEntity.supplyUnderlyingInterest
    .times(totalUnderlyingSupply)
    .div(ONE)
  feeEntity.supplyUnderlyingInterestGrowth = underlyingStatus.assetGrowth
  feeEntity.borrowUnderlyingFee = feeEntity.borrowUnderlyingInterest
    .times(totalUnderlyingBorrow)
    .div(ONE)
  feeEntity.borrowUnderlyingInterestGrowth = underlyingStatus.debtGrowth

  feeEntity.save()

  const feeDaily = ensureFeeDaily(event.address, pairId, timestamp)

  feeDaily.supplyStableFee = feeDaily.supplyStableFee.plus(
    feeEntity.supplyStableFee
  )
  feeDaily.borrowStableFee = feeDaily.borrowStableFee.plus(
    feeEntity.borrowStableFee
  )
  feeDaily.supplyUnderlyingFee = feeDaily.supplyUnderlyingFee.plus(
    feeEntity.supplyUnderlyingFee
  )
  feeDaily.borrowUnderlyingFee = feeDaily.borrowUnderlyingFee.plus(
    feeEntity.borrowUnderlyingFee
  )

  feeDaily.save()
}

export function handlePremiumGrowthUpdated(event: PremiumGrowthUpdated): void {
  const pairId = event.params.pairId
  const timestamp = event.block.timestamp

  const feeEntity = ensureFeeEntity(
    event.address,
    pairId,
    event.transaction.hash,
    timestamp
  )
  const totalFeeEntity = ensureFeeEntity(
    event.address,
    pairId,
    Bytes.empty(),
    timestamp
  )

  const totalSupply = event.params.totalAmount
  const totalBorrow = event.params.borrowAmount
  const spread = event.params.spread

  feeEntity.supplySqrtInterest0 = event.params.fee0Growth
    .times(
      totalSupply.plus(totalBorrow.times(spread).div(BigInt.fromU32(1000)))
    )
    .div(totalSupply)
  feeEntity.supplySqrtInterest1 = event.params.fee1Growth
    .times(
      totalSupply.plus(totalBorrow.times(spread).div(BigInt.fromU32(1000)))
    )
    .div(totalSupply)

  feeEntity.borrowSqrtInterest0 = event.params.fee0Growth
    .times(spread.plus(BigInt.fromU32(1000)))
    .div(BigInt.fromU32(1000))
  feeEntity.borrowSqrtInterest1 = event.params.fee1Growth
    .times(spread.plus(BigInt.fromU32(1000)))
    .div(BigInt.fromU32(1000))

  feeEntity.supplySqrtFee0 = feeEntity.supplySqrtInterest0
    .times(totalSupply)
    .div(Q128)
  feeEntity.supplySqrtFee1 = feeEntity.supplySqrtInterest1
    .times(totalSupply)
    .div(Q128)
  feeEntity.borrowSqrtFee0 = feeEntity.borrowSqrtInterest0
    .times(totalBorrow)
    .div(Q128)
  feeEntity.borrowSqrtFee1 = feeEntity.borrowSqrtInterest1
    .times(totalBorrow)
    .div(Q128)

  totalFeeEntity.supplySqrtInterest0Growth =
    totalFeeEntity.supplySqrtInterest0Growth.plus(feeEntity.supplySqrtInterest0)
  totalFeeEntity.supplySqrtInterest1Growth =
    totalFeeEntity.supplySqrtInterest1Growth.plus(feeEntity.supplySqrtInterest1)
  totalFeeEntity.borrowSqrtInterest0Growth =
    totalFeeEntity.borrowSqrtInterest0Growth.plus(feeEntity.borrowSqrtInterest0)
  totalFeeEntity.borrowSqrtInterest1Growth =
    totalFeeEntity.borrowSqrtInterest1Growth.plus(feeEntity.borrowSqrtInterest1)
  feeEntity.supplySqrtInterest0Growth = totalFeeEntity.supplySqrtInterest0Growth
  feeEntity.supplySqrtInterest1Growth = totalFeeEntity.supplySqrtInterest1Growth
  feeEntity.borrowSqrtInterest0Growth = totalFeeEntity.borrowSqrtInterest0Growth
  feeEntity.borrowSqrtInterest1Growth = totalFeeEntity.borrowSqrtInterest1Growth

  totalFeeEntity.save()
  feeEntity.save()

  const feeDaily = ensureFeeDaily(event.address, pairId, timestamp)

  feeDaily.supplySqrtFee0 = feeDaily.supplySqrtFee0.plus(
    feeEntity.supplySqrtFee0
  )
  feeDaily.supplySqrtFee1 = feeDaily.supplySqrtFee1.plus(
    feeEntity.supplySqrtFee1
  )
  feeDaily.borrowSqrtFee0 = feeDaily.borrowSqrtFee0.plus(
    feeEntity.borrowSqrtFee0
  )
  feeDaily.borrowSqrtFee1 = feeDaily.borrowSqrtFee1.plus(
    feeEntity.borrowSqrtFee1
  )

  feeDaily.save()
}
