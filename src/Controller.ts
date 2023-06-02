import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import {
  FeeCollected,
  InterestGrowthUpdated,
  IsolatedVaultClosed,
  IsolatedVaultOpened,
  MarginUpdated,
  OperatorUpdated,
  PairAdded,
  PositionLiquidated,
  PositionUpdated,
  PositionUpdatedPayoffStruct,
  Rebalanced,
  TokenSupplied,
  TokenWithdrawn,
  VaultCreated,
  VaultLiquidated
} from '../generated/Controller/Controller'
import {
  RebalanceHistoryItem,
  TradeHistoryItem,
  VaultEntity
} from '../generated/schema'
import {
  createFeeHistory,
  createLiquidationHistory,
  createMarginHistory,
  ensureAssetEntity,
  ensureInterestGrowthTx,
  ensureOpenPosition,
  ensureTotalTokensEntity,
  toAssetId,
  toVaultId
} from './helper'
import {
  updateFeeRevenue,
  updateInterestDaily,
  updatePremiumRevenue,
  updateProtocolRevenue,
  updateTokenRevenue
} from './revenue'
import { controllerContract } from './contracts'
import { ONE } from './constants'
import {
  createLendingDepositHistory,
  createLendingWithdrawHistory
} from './history'
import { updateOpenInterest } from './OpenInterest'

export function handleOperatorUpdated(event: OperatorUpdated): void { }

export function handlePairAdded(event: PairAdded): void {
  const asset = ensureAssetEntity(
    event.address,
    event.params.assetId,
    event.block.timestamp
  )

  asset.assetId = event.params.assetId
  asset.uniswapPool = event.params._uniswapPool
  asset.totalSupply = BigInt.zero()
  asset.totalBorrow = BigInt.zero()
  asset.sqrtTotalSupply = BigInt.zero()
  asset.sqrtTotalBorrow = BigInt.zero()
  asset.createdAt = event.block.timestamp
  asset.updatedAt = event.block.timestamp

  asset.save()
}

export function handleVaultCreated(event: VaultCreated): void {
  const vault = new VaultEntity(toVaultId(event.address, event.params.vaultId))

  vault.contractAddress = event.address
  vault.vaultId = event.params.vaultId
  vault.owner = event.params.owner
  vault.margin = BigInt.zero()
  vault.isMainVault = event.params.isMainVault
  vault.isClosed = false

  vault.save()
}

export function handleTokenSupplied(event: TokenSupplied): void {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp
  const suppliedAmount = event.params.suppliedAmount

  const asset = ensureAssetEntity(event.address, assetId, timestamp)

  asset.totalSupply = asset.totalSupply.plus(suppliedAmount)
  asset.updatedAt = timestamp

  asset.save()

  createLendingDepositHistory(
    event.address,
    assetId,
    event.transaction.from,
    event.transaction.hash.toHex(),
    event.logIndex,
    suppliedAmount,
    timestamp
  )
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp
  const finalWithdrawnAmount = event.params.finalWithdrawnAmount

  const asset = ensureAssetEntity(event.address, assetId, timestamp)

  asset.totalSupply = asset.totalSupply.minus(finalWithdrawnAmount)
  asset.updatedAt = timestamp

  asset.save()

  createLendingWithdrawHistory(
    event.address,
    assetId,
    event.transaction.from,
    event.transaction.hash.toHex(),
    event.logIndex,
    finalWithdrawnAmount,
    timestamp
  )
}

export function handleMarginUpdated(event: MarginUpdated): void {
  const vault = VaultEntity.load(toVaultId(event.address, event.params.vaultId))

  if (!vault) {
    return
  }

  vault.margin = vault.margin.plus(event.params.marginAmount)

  vault.save()

  createMarginHistory(
    event.address,
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleIsolatedVaultOpened(event: IsolatedVaultOpened): void {
  const vault = VaultEntity.load(toVaultId(event.address, event.params.vaultId))
  const isolatedVault = VaultEntity.load(
    toVaultId(event.address, event.params.isolatedVaultId)
  )

  if (!vault || !isolatedVault) {
    return
  }

  vault.margin = vault.margin.minus(event.params.marginAmount)
  isolatedVault.margin = isolatedVault.margin.plus(event.params.marginAmount)

  vault.save()
  isolatedVault.save()

  createMarginHistory(
    event.address,
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.marginAmount.neg(),
    event.block.timestamp
  )
  createMarginHistory(
    event.address,
    event.transaction.hash.toHex(),
    isolatedVault.vaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleIsolatedVaultClosed(event: IsolatedVaultClosed): void {
  closeVault(
    event.address,
    event.transaction.hash,
    event.params.vaultId,
    event.params.isolatedVaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleVaultLiquidated(event: VaultLiquidated): void {
  closeVault(
    event.address,
    event.transaction.hash,
    event.params.mainVaultId,
    event.params.vaultId,
    event.params.withdrawnMarginAmount,
    event.block.timestamp
  )
  createLiquidationHistory(
    event.address,
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.totalPenaltyAmount,
    event.block.timestamp
  )
}

function closeVault(
  controllerAddress: Bytes,
  txHash: Bytes,
  vaultId: BigInt,
  isolatedVaultId: BigInt,
  marginAmount: BigInt,
  timestamp: BigInt
): void {
  const vault = VaultEntity.load(toVaultId(controllerAddress, vaultId))
  const isolatedVault = VaultEntity.load(
    toVaultId(controllerAddress, isolatedVaultId)
  )

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

  createMarginHistory(
    controllerAddress,
    txHash.toHex(),
    vaultId,
    marginAmount,
    timestamp
  )
  createMarginHistory(
    controllerAddress,
    txHash.toHex(),
    isolatedVaultId,
    marginAmount.neg(),
    timestamp
  )
}

export function handlePositionUpdated(event: PositionUpdated): void {
  updatePosition(
    event.address,
    event.transaction.hash,
    event.logIndex,
    event.params.vaultId,
    event.params.assetId,
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
    event.address,
    event.transaction.hash,
    event.logIndex,
    event.params.vaultId,
    event.params.assetId,
    event.params.tradeAmount,
    event.params.tradeSqrtAmount,
    payoff,
    event.params.fee,
    event.block.timestamp
  )
}

function updatePosition(
  controllerAddress: Bytes,
  txHash: Bytes,
  logIndex: BigInt,
  vaultId: BigInt,
  assetId: BigInt,
  tradeAmount: BigInt,
  tradeSqrtAmount: BigInt,
  payoff: PositionUpdatedPayoffStruct,
  fee: BigInt,
  timestamp: BigInt
): void {
  const openPosition = ensureOpenPosition(
    controllerAddress,
    assetId,
    vaultId,
    timestamp
  )

  // Update OI
  updateOpenInterest(
    controllerAddress,
    assetId,
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

  const vault = VaultEntity.load(toVaultId(controllerAddress, vaultId))
  if (vault) {
    vault.margin = vault.margin
      .plus(payoff.perpPayoff)
      .plus(payoff.sqrtPayoff)
      .plus(fee)
  }

  if (!fee.equals(BigInt.zero())) {
    createFeeHistory(
      controllerAddress,
      txHash.toHex(),
      logIndex,
      vaultId,
      fee,
      timestamp
    )
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

    historyItem.vault = toVaultId(controllerAddress, vaultId)
    historyItem.assetId = assetId
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

    historyItem.vault = toVaultId(controllerAddress, vaultId)
    historyItem.assetId = assetId
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

export function handleFeeCollected(event: FeeCollected): void {

  const openPosition = ensureOpenPosition(
    event.address,
    event.params.assetId,
    event.params.vaultId,
    event.block.timestamp
  )
  
  openPosition.feeAmount = openPosition.feeAmount.plus(
    event.params.feeCollected
  )


  openPosition.save()

  // Update vault margin
  // TODO Where is this controllerAddressa coming from?
  const vault = VaultEntity.load(
    toVaultId(Bytes.fromUTF8('controllerAddress'), event.params.vaultId)
  )

  if (vault) {
    vault.margin = vault.margin
      .plus(event.params.feeCollected)
  }


  if (!event.params.feeCollected.equals(BigInt.zero())) {
    createFeeHistory(
      event.address,
      event.transaction.hash.toHex(),
      event.logIndex,
      event.params.vaultId,
      event.params.feeCollected,
      event.block.timestamp
    )
  }
}

export function handleRebalanced(event: Rebalanced): void {
  const id =
    event.transaction.hash.toHex() +
    '-' +
    event.transactionLogIndex.toString() +
    '-' +
    event.params.assetId.toString()

  const item = new RebalanceHistoryItem(id)

  item.asset = toAssetId(event.address, event.params.assetId)
  item.tickLower = BigInt.fromI32(event.params.tickLower)
  item.tickUpper = BigInt.fromI32(event.params.tickUpper)
  item.profit = event.params.profit
  item.createdAt = event.block.timestamp

  item.save()
}

export function handleInterestGrowthUpdated(
  event: InterestGrowthUpdated
): void {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const totalTokens = ensureTotalTokensEntity(event.address, assetId, timestamp)

  const previousAsset = ensureAssetEntity(event.address, assetId, timestamp)

  // Load previous InterestGrowthTx Entity, it's needed for calculating accumulated interests and debts
  const previousEntity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount,
  )
  totalTokens.growthCount = totalTokens.growthCount.plus(BigInt.fromU32(1))
  totalTokens.save()

  // Create InterestGrowthTx Entity
  const entity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount,
  )

  entity.accumulatedInterests = previousEntity.accumulatedInterests.plus(
    event.params.assetGrowth
      .minus(previousEntity.assetGrowth)
      .times(previousAsset.totalSupply)
  )
  entity.accumulatedDebts = previousEntity.accumulatedDebts.plus(
    event.params.debtGrowth
      .minus(previousEntity.debtGrowth)
      .times(previousAsset.totalBorrow)
  )

  if (assetId.notEqual(BigInt.fromI32(1))) {
    entity.accumulatedPremiumSupply =
      previousEntity.accumulatedPremiumSupply.plus(
        event.params.supplyPremiumGrowth
          .minus(previousEntity.supplyPremiumGrowth)
          .times(previousAsset.sqrtTotalSupply)
      )

    entity.accumulatedPremiumBorrow =
      previousEntity.accumulatedPremiumBorrow.plus(
        event.params.borrowPremiumGrowth
          .minus(previousEntity.borrowPremiumGrowth)
          .times(previousAsset.sqrtTotalBorrow)
      )

    entity.accumulatedFee0 = previousEntity.accumulatedFee0.plus(
      event.params.fee0Growth
        .minus(previousEntity.fee0Growth)
        .times(previousAsset.sqrtTotalSupply)
    )

    entity.accumulatedFee1 = previousEntity.accumulatedFee1.plus(
      event.params.fee1Growth
        .minus(previousEntity.fee1Growth)
        .times(previousAsset.sqrtTotalSupply)
    )
  }
  entity.save()

  updateInterestDaily(event)
  updateProtocolRevenue(event)

  // Update AssetEntity, it will be used when this handler be called next time.
  const currentAsset = controllerContract.getAsset(assetId)
  const tokenStatus = currentAsset.tokenStatus

  // Update AssetEntity
  const asset = previousAsset
  asset.totalSupply = tokenStatus.totalCompoundDeposited
    .times(tokenStatus.assetScaler)
    .div(ONE)
    .plus(tokenStatus.totalNormalDeposited)
  asset.totalBorrow = tokenStatus.totalCompoundBorrowed
    .times(tokenStatus.debtScaler)
    .div(ONE)
    .plus(tokenStatus.totalNormalBorrowed)

  if (assetId.notEqual(BigInt.fromI32(1))) {
    const sqrtAssetStatus = currentAsset.sqrtAssetStatus
    asset.sqrtTotalSupply = sqrtAssetStatus.totalAmount
    asset.sqrtTotalBorrow = sqrtAssetStatus.borrowedAmount
  }

  asset.updatedAt = timestamp
  asset.save()

  if (
    totalTokens.growthCount.gt(BigInt.fromU32(1)) &&
    previousAsset.totalSupply.gt(BigInt.zero()) &&
    previousAsset.totalBorrow.gt(BigInt.zero())
  ) {
    updateTokenRevenue(event, totalTokens)
  }

  if (
    assetId.notEqual(BigInt.fromI32(1)) &&
    previousAsset.sqrtTotalSupply.gt(BigInt.zero()) &&
    previousAsset.sqrtTotalBorrow.gt(BigInt.zero())
  ) {
    updatePremiumRevenue(event, totalTokens)
    updateFeeRevenue(event, totalTokens)
  }

}
