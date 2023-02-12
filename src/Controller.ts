import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'
import { AssetGroupAdded, MarginUpdated, OperatorUpdated, PairAdded, PositionUpdated, TokenSupplied, TokenWithdrawn, VaultCreated } from '../generated/Controller/Controller';
import { AssetEntity, AssetGroupEntity, OpenPositionEntity, TradeHistoryItem, VaultEntity } from '../generated/schema';


export function handleOperatorUpdated(event: OperatorUpdated): void {
}

export function handleAssetGroupAdded(event: AssetGroupAdded): void {
  const assetGroup = new AssetGroupEntity(event.params.assetGroupId.toString())

  assetGroup.assetGroupId = event.params.assetGroupId
  assetGroup.stableTokenId = event.params.stableTokenId

  assetGroup.save()
}

export function handlePairAdded(event: PairAdded): void {
  const asset = new AssetEntity(event.params.tokenId.toString())

  asset.assetGroup = event.params.assetGroupId.toString()
  asset.tokenId = event.params.tokenId
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

  vault.assetGroupId = event.params.assetGroupId
  vault.vaultId = event.params.vaultId
  vault.owner = event.params.owner
  vault.margin = BigInt.zero()

  vault.save()
}

export function handleTokenSupplied(event: TokenSupplied): void {
  const asset = AssetEntity.load(event.params.assetParams.tokenId.toString())

  if (!asset) {
    return
  }

  asset.totalSupply = asset.totalSupply.plus(event.params.suppliedAmount)

  asset.save()
}

export function handleTokenWithdrawn(event: TokenWithdrawn): void {
  const asset = AssetEntity.load(event.params.assetParams.tokenId.toString())

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

  {
    // TODO: refactoring
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/margin')

    historyItem.vault = event.params.vaultId.toString()
    historyItem.action = 'MARGIN'
    historyItem.size = event.params.marginAmount
    historyItem.txHash = event.transaction.hash.toHex()
    historyItem.createdAt = event.block.timestamp

    historyItem.save()
  }
}

export function handlePositionUpdated(event: PositionUpdated): void {
  const id = event.params.vaultId.toString() + '/' + event.params.tokenId.toString()

  let openPosition = OpenPositionEntity.load(id)

  if (openPosition == null) {
    openPosition = new OpenPositionEntity(id)
    openPosition.tokenId = event.params.tokenId
    openPosition.createdAt = event.block.timestamp
    openPosition.vault = event.params.vaultId.toString()
    openPosition.tradeAmount = BigInt.zero()
    openPosition.sqrtTradeAmount = BigInt.zero()
    openPosition.entryValue = BigInt.zero()
    openPosition.sqrtEntryValue = BigInt.zero()
    openPosition.sqrtRebalanceEntryValueStable = BigInt.zero()
    openPosition.sqrtRebalanceEntryValueUnderlying = BigInt.zero()
    openPosition.feeAmount = BigInt.zero()
  }

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

  if (!event.params.tradeAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/fee')

    historyItem.vault = event.params.vaultId.toString()
    historyItem.action = 'FEE'
    historyItem.size = event.params.fee
    historyItem.txHash = event.transaction.hash.toHex()
    historyItem.createdAt = event.block.timestamp

    historyItem.save()
  }

  if (!event.params.tradeAmount.equals(BigInt.zero())) {
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/perp')

    historyItem.vault = event.params.vaultId.toString()
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
    const historyItem = new TradeHistoryItem(event.transaction.hash.toHex() + '/sqrt')

    historyItem.vault = event.params.vaultId.toString()
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
