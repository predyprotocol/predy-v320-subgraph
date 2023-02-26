import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import { FeeCollected, IsolatedVaultClosed, IsolatedVaultOpened, MarginUpdated, OperatorUpdated, PairAdded, PositionUpdated, TokenSupplied, TokenWithdrawn, VaultCreated } from '../generated/Controller/Controller';
import { AssetEntity, TradeHistoryItem, VaultEntity } from '../generated/schema';
import { createFeeHistory, createMarginHistory, ensureOpenPosition } from './helper';


export function handleOperatorUpdated(event: OperatorUpdated): void {
}

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
  vault.isMainVault = event.params.isMainVault;

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
  const isolatedVault = VaultEntity.load(event.params.isolatedVaultId.toString())

  if (!vault || !isolatedVault) {
    return
  }

  vault.margin = vault.margin.minus(event.params.marginAmount)
  isolatedVault.margin = isolatedVault.margin.plus(event.params.marginAmount);

  vault.save()
  isolatedVault.save();

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
  const vault = VaultEntity.load(event.params.vaultId.toString())
  const isolatedVault = VaultEntity.load(event.params.isolatedVaultId.toString())

  if (!vault || !isolatedVault) {
    return
  }

  vault.margin = vault.margin.plus(event.params.marginAmount)
  isolatedVault.margin = isolatedVault.margin.minus(event.params.marginAmount);

  vault.save()
  isolatedVault.save();

  createMarginHistory(
    event.transaction.hash.toHex(),
    event.params.vaultId,
    event.params.marginAmount,
    event.block.timestamp
  )
  createMarginHistory(
    event.transaction.hash.toHex(),
    isolatedVault.vaultId,
    event.params.marginAmount.neg(),
    event.block.timestamp
  )
}

export function handlePositionUpdated(event: PositionUpdated): void {
  const id = event.params.vaultId.toString() + '/' + event.params.assetId.toString()

  const openPosition = ensureOpenPosition(id, event.params.assetId, event.params.vaultId, event.block.timestamp)

  openPosition.tradeAmount = openPosition.tradeAmount.plus(event.params.tradeAmount)
  openPosition.sqrtTradeAmount = openPosition.sqrtTradeAmount.plus(event.params.tradeSqrtAmount)
  openPosition.entryValue = openPosition.entryValue.plus(event.params.payoff.perpEntryUpdate)
  openPosition.sqrtEntryValue = openPosition.sqrtEntryValue.plus(event.params.payoff.sqrtEntryUpdate)
  openPosition.sqrtRebalanceEntryValueStable = openPosition.sqrtRebalanceEntryValueStable.plus(event.params.payoff.sqrtRebalanceEntryUpdateStable)
  openPosition.sqrtRebalanceEntryValueUnderlying = openPosition.sqrtRebalanceEntryValueUnderlying.plus(event.params.payoff.sqrtRebalanceEntryUpdateUnderlying)
  openPosition.feeAmount = openPosition.feeAmount.plus(event.params.fee)

  openPosition.save()

  const vault = VaultEntity.load(event.params.vaultId.toString())
  if (vault) {
    vault.margin = vault.margin.plus(event.params.payoff.perpPayoff).plus(event.params.payoff.sqrtPayoff).plus(event.params.fee)
  }

  if (!event.params.fee.equals(BigInt.zero())) {
    createFeeHistory(
      event.transaction.hash.toHex(),
      event.params.vaultId,
      event.params.fee,
      event.block.timestamp
    )
  }

  if (!event.params.tradeAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/' + event.params.vaultId.toString() + '/perp')

    historyItem.vault = event.params.vaultId.toString()
    historyItem.assetId = event.params.assetId
    historyItem.action = 'POSITION'
    historyItem.product = 'PERP'
    historyItem.size = event.params.tradeAmount
    historyItem.entryValue = event.params.payoff.perpEntryUpdate
    historyItem.payoff = event.params.payoff.perpPayoff
    historyItem.txHash = event.transaction.hash.toHex()
    historyItem.createdAt = event.block.timestamp

    historyItem.save()
  }

  if (!event.params.tradeSqrtAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/' + event.params.vaultId.toString() + '/sqrt')

    historyItem.vault = event.params.vaultId.toString()
    historyItem.assetId = event.params.assetId
    historyItem.action = 'POSITION'
    historyItem.product = 'SQRT'
    historyItem.size = event.params.tradeSqrtAmount
    historyItem.entryValue = event.params.payoff.sqrtEntryUpdate
    historyItem.payoff = event.params.payoff.sqrtPayoff
    historyItem.txHash = event.transaction.hash.toHex()
    historyItem.createdAt = event.block.timestamp

    historyItem.save()
  }
}

export function handleFeeCollected(event: FeeCollected): void {
  const id = event.params.vaultId.toString() + '/' + event.params.assetId.toString()

  const openPosition = ensureOpenPosition(id, event.params.assetId, event.params.vaultId, event.block.timestamp)

  openPosition.feeAmount = openPosition.feeAmount.plus(event.params.feeCollected)

  openPosition.save()

  if (!event.params.feeCollected.equals(BigInt.zero())) {
    createFeeHistory(
      event.transaction.hash.toHex(),
      event.params.vaultId,
      event.params.feeCollected,
      event.block.timestamp
    )
  }
}
