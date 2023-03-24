import { BigInt } from '@graphprotocol/graph-ts'

import {
  AccumulatedProtocolFeeDaily,
  AssetEntity,
  InterestGrowthTx,
  LPRevenueDaily,
  OpenPositionEntity,
  TotalTokensEntity,
  TradeHistoryItem,
  UniFeeGrowthHourly
} from '../generated/schema'

export function ensureOpenPosition(
  id: string,
  assetId: BigInt,
  vaultId: BigInt,
  eventTime: BigInt
): OpenPositionEntity {
  let openPosition = OpenPositionEntity.load(id)

  if (openPosition == null) {
    openPosition = new OpenPositionEntity(id)
    openPosition.assetId = assetId
    openPosition.createdAt = eventTime
    openPosition.vault = vaultId.toString()
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
  txHash: string,
  vaultId: BigInt,
  marginAmount: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '/' + vaultId.toString() + '/margin'
  )

  historyItem.vault = vaultId.toString()
  historyItem.action = 'MARGIN'
  historyItem.payoff = marginAmount
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createFeeHistory(
  txHash: string,
  logIndex: BigInt,
  vaultId: BigInt,
  fee: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '/' + logIndex.toString() + '/' + vaultId.toString() + '/fee'
  )

  historyItem.vault = vaultId.toString()
  historyItem.action = 'FEE'
  historyItem.payoff = fee
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createLiquidationHistory(
  txHash: string,
  vaultId: BigInt,
  penalty: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '/' + vaultId.toString() + '/liq'
  )

  historyItem.vault = vaultId.toString()
  historyItem.action = 'LIQUIDATION'
  historyItem.payoff = penalty
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function ensureUniFeeGrowthHourly(
  eventTime: BigInt
): UniFeeGrowthHourly {
  const id = toHourlyId(eventTime)
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

function toHourlyId(timestamp: BigInt): string {
  let excess = timestamp.mod(BigInt.fromU32(60 * 60))
  let open = timestamp.minus(excess)

  return open.toString()
}

function toISODateString(timestamp: BigInt): string {
  const date = new Date(timestamp.toI64() * 1000).toISOString()
  return date.substring(0, date.indexOf('T'))
}

export function ensureLPRevenueDaily(eventTime: BigInt): LPRevenueDaily {
  const id = toISODateString(eventTime)
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
  assetId: BigInt,
  eventTime: BigInt
): TotalTokensEntity {
  const id = `total-${assetId.toString()}`
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
  assetId: BigInt,
  count: BigInt,
  eventTime: BigInt
): InterestGrowthTx {
  const id = `${assetId.toString()}-${count.toString()}`
  let entity = InterestGrowthTx.load(id)

  if (entity == null) {
    entity = new InterestGrowthTx(id)
    entity.accumulatedInterests = BigInt.zero()
    entity.accumulatedDebts = BigInt.zero()
    entity.accumulatedPremiumSupply = BigInt.zero()
    entity.accumulatedPremiumBorrow = BigInt.zero()
    entity.accumulatedFee0 = BigInt.zero()
    entity.accumulatedFee1 = BigInt.zero()
    entity.createdAt = eventTime
  }

  return entity
}


export function ensureAccumulatedProtocolFeeDaily(
  eventTime: BigInt
): AccumulatedProtocolFeeDaily {
  const id = toISODateString(eventTime)
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

export function ensureAssetEntity(
  assetId: BigInt,
  eventTime: BigInt
): AssetEntity {
  const id = assetId.toString()
  let entity = AssetEntity.load(id)

  if (entity == null) {
    entity = new AssetEntity(id)
    entity.totalSupply = BigInt.zero()
    entity.totalBorrow = BigInt.zero()
    entity.sqrtTotalSupply = BigInt.zero()
    entity.sqrtTotalBorrow = BigInt.zero()
    entity.createdAt = eventTime
  }

  return entity
}