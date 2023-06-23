import { BigInt, Bytes } from '@graphprotocol/graph-ts'

import {
  AccumulatedProtocolFeeDaily,
  AssetEntity,
  InterestDaily,
  InterestGrowthTx,
  LPRevenueDaily,
  OpenInterestDaily,
  OpenInterestTotal,
  OpenPositionEntity,
  StrategyUserPosition,
  TotalTokensEntity,
  TradeHistoryItem,
  UniFeeGrowthHourly,
  VaultMarginDaily
} from '../generated/schema'
import { InterestGrowthUpdated } from '../generated/Controller/Controller'

export function ensureOpenPosition(
  controllerAddress: Bytes,
  assetId: BigInt,
  vaultId: BigInt,
  eventTime: BigInt
): OpenPositionEntity {
  const id =
    controllerAddress.toHex() +
    '-' +
    vaultId.toString() +
    '-' +
    assetId.toString()

  let openPosition = OpenPositionEntity.load(id)

  if (openPosition == null) {
    openPosition = new OpenPositionEntity(id)
    openPosition.assetId = assetId
    openPosition.createdAt = eventTime
    openPosition.vault = toVaultId(controllerAddress, vaultId)
    openPosition.tradeAmount = BigInt.zero()
    openPosition.sqrtTradeAmount = BigInt.zero()
    openPosition.entryValue = BigInt.zero()
    openPosition.sqrtEntryValue = BigInt.zero()
    openPosition.sqrtRebalanceEntryValueStable = BigInt.zero()
    openPosition.sqrtRebalanceEntryValueUnderlying = BigInt.zero()
    openPosition.feeAmount = BigInt.zero()
    openPosition.perpUpdatedAt = eventTime
    openPosition.squartUpdatedAt = eventTime
  }

  openPosition.updatedAt = eventTime

  return openPosition
}

export function createMarginHistory(
  controllerAddress: Bytes,
  txHash: string,
  vaultId: BigInt,
  marginAmount: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '-' + vaultId.toString() + '-margin'
  )

  historyItem.vault = toVaultId(controllerAddress, vaultId)
  historyItem.action = 'MARGIN'
  historyItem.payoff = marginAmount
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createFeeHistory(
  controllerAddress: Bytes,
  txHash: string,
  logIndex: BigInt,
  vaultId: BigInt,
  fee: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '-' + logIndex.toString() + '-' + vaultId.toString() + '-fee'
  )

  historyItem.vault = toVaultId(controllerAddress, vaultId)
  historyItem.action = 'FEE'
  historyItem.payoff = fee
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createLiquidationHistory(
  controllerAddress: Bytes,
  txHash: string,
  vaultId: BigInt,
  penalty: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '-' + vaultId.toString() + '-liq'
  )

  historyItem.vault = toVaultId(controllerAddress, vaultId)
  historyItem.action = 'LIQUIDATION'
  historyItem.payoff = penalty
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function ensureUniFeeGrowthHourly(
  address: Bytes,
  eventTime: BigInt
): UniFeeGrowthHourly {
  const id = address.toHex() + '-' + toHourlyId(eventTime)
  let entity = UniFeeGrowthHourly.load(id)

  if (entity == null) {
    entity = new UniFeeGrowthHourly(id)
    entity.feeGrowthGlobal0X128 = BigInt.fromI32(0)
    entity.feeGrowthGlobal1X128 = BigInt.fromI32(0)
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

export function ensureOpenInterestDaily(
  controllerAddress: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): OpenInterestDaily {
  const id = controllerAddress.toHex() + '-' + assetId.toString() + '-' + toISODateString(eventTime)

  let openInterest = OpenInterestDaily.load(id)

  if (openInterest == null) {
    openInterest = new OpenInterestDaily(id)
    openInterest.assetId = assetId
    openInterest.longPerp = BigInt.zero()
    openInterest.shortPerp = BigInt.zero()
    openInterest.longSquart = BigInt.zero()
    openInterest.shortSquart = BigInt.zero()
    openInterest.createdAt = eventTime
  }

  openInterest.updatedAt = eventTime

  return openInterest
}

export function ensureOpenInterestTotal(
  controllerAddress: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): OpenInterestTotal {
  const id = controllerAddress.toHex() + '-' + assetId.toString()

  let openInterest = OpenInterestTotal.load(id)

  if (openInterest == null) {
    openInterest = new OpenInterestTotal(id)
    openInterest.assetId = assetId
    openInterest.longPerp = BigInt.zero()
    openInterest.shortPerp = BigInt.zero()
    openInterest.longSquart = BigInt.zero()
    openInterest.shortSquart = BigInt.zero()
    openInterest.createdAt = eventTime
  }

  openInterest.updatedAt = eventTime

  return openInterest
}

function toHourlyId(timestamp: BigInt): string {
  let excess = timestamp.mod(BigInt.fromU32(60 * 60))
  let open = timestamp.minus(excess)

  return open.toString()
}

function toISODateString(timestamp: BigInt): string {
  const date = new Date(timestamp.toI64() * 1000).toISOString()
  return date.substring(0, date.indexOf('T'))
}

export function ensureLPRevenueDaily(
  address: Bytes,
  eventTime: BigInt
): LPRevenueDaily {
  const id = address.toHex() + '-' + toISODateString(eventTime)
  let entity = LPRevenueDaily.load(id)

  if (entity == null) {
    entity = new LPRevenueDaily(id)
    entity.fee0 = BigInt.fromI32(0)
    entity.fee1 = BigInt.fromI32(0)
    entity.premiumBorrow = BigInt.fromI32(0)
    entity.premiumSupply = BigInt.fromI32(0)
    entity.supplyInterest0 = BigInt.fromI32(0)
    entity.supplyInterest1 = BigInt.fromI32(0)
    entity.borrowInterest0 = BigInt.fromI32(0)
    entity.borrowInterest1 = BigInt.fromI32(0)
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

export function ensureTotalTokensEntity(
  address: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): TotalTokensEntity {
  const id = `total-${address.toHex()}-${assetId.toString()}`
  let entity = TotalTokensEntity.load(id)

  if (entity == null) {
    entity = new TotalTokensEntity(id)
    entity.growthCount = BigInt.zero()
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

export function ensureInterestGrowthTx(
  event: InterestGrowthUpdated,
  count: BigInt,
): InterestGrowthTx {
  const address = event.address
  const assetId = event.params.assetId
  const eventTime = event.block.timestamp

  const id = `${address.toHex()}-${assetId.toString()}-${count.toString()}`
  let entity = InterestGrowthTx.load(id)

  if (entity == null) {
    entity = new InterestGrowthTx(id)
    entity.assetId = assetId
    entity.accumulatedInterests = BigInt.zero()
    entity.accumulatedDebts = BigInt.zero()
    entity.accumulatedPremiumSupply = BigInt.zero()
    entity.accumulatedPremiumBorrow = BigInt.zero()
    entity.accumulatedFee0 = BigInt.zero()
    entity.accumulatedFee1 = BigInt.zero()
    entity.assetGrowth = event.params.assetGrowth
    entity.debtGrowth = event.params.debtGrowth
    entity.supplyPremiumGrowth = event.params.supplyPremiumGrowth
    entity.borrowPremiumGrowth = event.params.borrowPremiumGrowth
    entity.fee0Growth = event.params.fee0Growth
    entity.fee1Growth = event.params.fee1Growth
    entity.createdAt = eventTime
  }

  return entity
}

export function ensureAccumulatedProtocolFeeDaily(
  address: Bytes,
  eventTime: BigInt
): AccumulatedProtocolFeeDaily {
  const id = address.toHex() + '-' + toISODateString(eventTime)
  let entity = AccumulatedProtocolFeeDaily.load(id)

  if (entity == null) {
    entity = new AccumulatedProtocolFeeDaily(id)
    entity.accumulatedProtocolFee0 = BigInt.fromI32(0)
    entity.accumulatedProtocolFee1 = BigInt.fromI32(0)
    entity.withdrawnProtocolFee0 = BigInt.fromI32(0)
    entity.withdrawnProtocolFee1 = BigInt.fromI32(0)
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

export function ensureInterestDaily(
  address: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): InterestDaily {
  const id = `${address.toHex()}-${assetId.toString()}-${toISODateString(
    eventTime
  )}`

  let entity = InterestDaily.load(id)

  if (entity == null) {
    entity = new InterestDaily(id)
    entity.assetId = assetId
    entity.assetGrowth = BigInt.fromI32(0)
    entity.debtGrowth = BigInt.fromI32(0)
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

export function ensureAssetEntity(
  controllerAddress: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): AssetEntity {
  const id = toAssetId(controllerAddress, assetId)
  let entity = AssetEntity.load(id)

  if (entity == null) {
    entity = new AssetEntity(id)
    entity.contractAddress = controllerAddress
    entity.assetId = assetId
    entity.totalSupply = BigInt.zero()
    entity.totalBorrow = BigInt.zero()
    entity.sqrtTotalSupply = BigInt.zero()
    entity.sqrtTotalBorrow = BigInt.zero()
    entity.createdAt = eventTime
  }

  return entity
}

export function ensureStrategyUserPosition(
  address: Bytes,
  account: Bytes,
  eventTime: BigInt
): StrategyUserPosition {
  const id = toStrategyUserPositionId(address, account)
  let entity = StrategyUserPosition.load(id)

  if (entity == null) {
    entity = new StrategyUserPosition(id)
    entity.address = address
    entity.account = account
    entity.entryValue = BigInt.zero()
    entity.strategyAmount = BigInt.zero()
    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}

export function toAssetId(address: Bytes, assetId: BigInt): string {
  return address.toHex() + '-' + assetId.toString()
}

export function toVaultId(address: Bytes, vaultId: BigInt): string {
  return address.toHex() + '-' + vaultId.toString()
}

export function toStrategyUserPositionId(
  address: Bytes,
  account: Bytes
): string {
  return address.toHex() + '-' + account.toHex()
}

export function ensureVaultMarginDaily(
  controllerAddress: Bytes,
  eventTime: BigInt
): VaultMarginDaily {
  const id =
    controllerAddress.toHex() +
    '-' +
    toISODateString(eventTime)

  let vaultMarginDaily = VaultMarginDaily.load(id)

  if (vaultMarginDaily == null) {
    vaultMarginDaily = new VaultMarginDaily(id)
    vaultMarginDaily.margin = BigInt.zero()
    vaultMarginDaily.createdAt = eventTime
  }

  vaultMarginDaily.updatedAt = eventTime

  return vaultMarginDaily
}
