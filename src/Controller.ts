import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import {
  FeeCollected,
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
  AssetEntity,
  RebalanceHistoryItem,
  TradeHistoryItem,
  VaultEntity
} from '../generated/schema'
import {
  createFeeHistory,
  createLiquidationHistory,
  createMarginHistory,
  ensureOpenPosition
} from './helper'

export function handleOperatorUpdated(event: OperatorUpdated): void {}

export function handlePairAdded(event: PairAdded): void {
  const asset = new AssetEntity(event.params.assetId.toString())

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
  const vault = new VaultEntity(event.params.vaultId.toString())

  vault.vaultId = event.params.vaultId
  vault.owner = event.params.owner
  vault.margin = BigInt.zero()
  vault.isMainVault = event.params.isMainVault
  vault.isClosed = false

  vault.save()
}

export function handleTokenSupplied(event: TokenSupplied): void {
  const asset = AssetEntity.load(event.params.assetId.toString())

  if (!asset) {
    return
  }

  asset.totalSupply = asset.totalSupply.plus(event.params.suppliedAmount)

  asset.save()
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  const asset = AssetEntity.load(event.params.assetId.toString())

  if (!asset) {
    return
  }

  asset.totalSupply = asset.totalSupply.minus(event.params.finalWithdrawnAmount)

  asset.save()
}

export function handleMarginUpdated(event: MarginUpdated): void {
  const vault = VaultEntity.load(event.params.vaultId.toString())

  if (!vault) {
    return
  }

  vault.margin = vault.margin.plus(event.params.marginAmount)

  vault.save()

  createMarginHistory(
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleIsolatedVaultOpened(event: IsolatedVaultOpened): void {
  const vault = VaultEntity.load(event.params.vaultId.toString())
  const isolatedVault = VaultEntity.load(
    event.params.isolatedVaultId.toString()
  )

  if (!vault || !isolatedVault) {
    return
  }

  vault.margin = vault.margin.minus(event.params.marginAmount)
  isolatedVault.margin = isolatedVault.margin.plus(event.params.marginAmount)

  vault.save()
  isolatedVault.save()

  createMarginHistory(
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.marginAmount.neg(),
    event.block.timestamp
  )
  createMarginHistory(
    event.transaction.hash.toHex(),
    isolatedVault.vaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleIsolatedVaultClosed(event: IsolatedVaultClosed): void {
  closeVault(
    event.transaction.hash,
    event.params.vaultId,
    event.params.isolatedVaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
}

export function handleVaultLiquidated(event: VaultLiquidated): void {
  closeVault(
    event.transaction.hash,
    event.params.mainVaultId,
    event.params.vaultId,
    event.params.withdrawnMarginAmount,
    event.block.timestamp
  )
  createLiquidationHistory(
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.totalPenaltyAmount,
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
  const vault = VaultEntity.load(vaultId.toString())
  const isolatedVault = VaultEntity.load(isolatedVaultId.toString())

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
    event.transaction.index,
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
    event.transaction.hash,
    event.transaction.index,
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
  const id = vaultId.toString() + '/' + assetId.toString()

  const openPosition = ensureOpenPosition(id, assetId, vaultId, timestamp)

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

  openPosition.save()

  const vault = VaultEntity.load(vaultId.toString())
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
        '/' +
        logIndex.toString() +
        '/' +
        vaultId.toString() +
        '/perp'
    )

    historyItem.vault = vaultId.toString()
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
        '/' +
        logIndex.toString() +
        '/' +
        vaultId.toString() +
        '/sqrt'
    )

    historyItem.vault = vaultId.toString()
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
  const id =
    event.params.vaultId.toString() + '/' + event.params.assetId.toString()

  const openPosition = ensureOpenPosition(
    id,
    event.params.assetId,
    event.params.vaultId,
    event.block.timestamp
  )

  openPosition.feeAmount = openPosition.feeAmount.plus(
    event.params.feeCollected
  )

  openPosition.save()

  if (!event.params.feeCollected.equals(BigInt.zero())) {
    createFeeHistory(
      event.transaction.hash.toHex(),
      event.transaction.index,
      event.params.vaultId,
      event.params.feeCollected,
      event.block.timestamp
    )
  }
}

export function handleRebalanced(event: Rebalanced): void {
  const id =
    event.transaction.hash.toHex() +
    '/' +
    event.transactionLogIndex.toString() +
    '/' +
    event.params.assetId.toString()

  const item = new RebalanceHistoryItem(id)

  item.asset = event.params.assetId.toString()
  item.tickLower = BigInt.fromI32(event.params.tickLower)
  item.tickUpper = BigInt.fromI32(event.params.tickUpper)
  item.profit = event.params.profit
  item.createdAt = event.block.timestamp

  item.save()
}
