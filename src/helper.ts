import { BigInt, Bytes } from '@graphprotocol/graph-ts'

import {
  FeeDaily,
  FeeEntity,
  OpenInterestDaily,
  OpenInterestTotal,
  OpenPositionEntity,
  PairEntity,
  TokenEntity,
  TradeHistoryItem
} from '../generated/schema'
import { Rebalanced } from '../generated/PredyPool/PredyPool'

export function ensurePairEntity(
  pairId: BigInt,
  eventTime: BigInt
): PairEntity {
  const id = toPairId(pairId)
  let entity = PairEntity.load(id)

  if (entity == null) {
    entity = new PairEntity(id)
    entity.pairId = pairId
    entity.totalSupply = BigInt.zero()
    entity.totalBorrow = BigInt.zero()
    entity.sqrtTotalSupply = BigInt.zero()
    entity.sqrtTotalBorrow = BigInt.zero()
    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}

export function ensureTokenEntity(
  address: Bytes,
  pairId: BigInt,
  eventTime: BigInt
): TokenEntity {
  const id = address.toHex()
  let entity = TokenEntity.load(id)

  if (entity == null) {
    entity = new TokenEntity(id)
    entity.address = address
    entity.pair = toPairId(pairId)
    entity.decimals = BigInt.zero()
    entity.symbol = Bytes.empty()
    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}

export function ensureOpenPosition(
  pairId: BigInt,
  vaultId: BigInt,
  eventTime: BigInt
): OpenPositionEntity {
  const id = vaultId.toString() + '-' + pairId.toString()

  let openPosition = OpenPositionEntity.load(id)

  if (openPosition == null) {
    openPosition = new OpenPositionEntity(id)
    openPosition.pair = toPairId(pairId)
    openPosition.createdAt = eventTime
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
    txHash + '-' + vaultId.toString() + '-margin'
  )

  historyItem.vault = toVaultId(vaultId)
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
    txHash + '-' + logIndex.toString() + '-' + vaultId.toString() + '-fee'
  )

  historyItem.vault = toVaultId(vaultId)
  historyItem.action = 'FEE'
  historyItem.payoff = fee
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createLiquidationHistory(
  txHash: string,
  vaultId: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(
    txHash + '-' + vaultId.toString() + '-liq'
  )

  historyItem.vault = toVaultId(vaultId)
  historyItem.action = 'LIQUIDATION'
  historyItem.payoff = BigInt.zero()
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function ensureOpenInterestDaily(
  assetId: BigInt,
  eventTime: BigInt
): OpenInterestDaily {
  const id = assetId.toString() + '-' + toISODateString(eventTime)

  let openInterest = OpenInterestDaily.load(id)

  if (openInterest == null) {
    openInterest = new OpenInterestDaily(id)
    openInterest.pair = toPairId(assetId)
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
  assetId: BigInt,
  eventTime: BigInt
): OpenInterestTotal {
  const id = assetId.toString()

  let openInterest = OpenInterestTotal.load(id)

  if (openInterest == null) {
    openInterest = new OpenInterestTotal(id)
    openInterest.pair = toPairId(assetId)
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

export function ensureFeeEntity(
  controllerAddress: Bytes,
  pairId: BigInt,
  txHash: Bytes,
  eventTime: BigInt
): FeeEntity {
  const id =
    controllerAddress.toHex() + '-' + pairId.toString() + '-' + txHash.toHex()
  let entity = FeeEntity.load(id)

  if (entity == null) {
    entity = new FeeEntity(id)
    entity.pair = toPairId(pairId)
    entity.supplyStableFee = BigInt.fromI32(0)
    entity.supplyUnderlyingFee = BigInt.fromI32(0)
    entity.supplySqrtFee0 = BigInt.fromI32(0)
    entity.supplySqrtFee1 = BigInt.fromI32(0)
    entity.borrowStableFee = BigInt.fromI32(0)
    entity.borrowUnderlyingFee = BigInt.fromI32(0)
    entity.borrowSqrtFee0 = BigInt.fromI32(0)
    entity.borrowSqrtFee1 = BigInt.fromI32(0)

    entity.supplyStableInterest = BigInt.fromI32(0)
    entity.supplyUnderlyingInterest = BigInt.fromI32(0)
    entity.supplySqrtInterest0 = BigInt.fromI32(0)
    entity.supplySqrtInterest1 = BigInt.fromI32(0)
    entity.borrowStableInterest = BigInt.fromI32(0)
    entity.borrowUnderlyingInterest = BigInt.fromI32(0)
    entity.borrowSqrtInterest0 = BigInt.fromI32(0)
    entity.borrowSqrtInterest1 = BigInt.fromI32(0)

    entity.supplyStableInterestGrowth = BigInt.fromI32(0)
    entity.supplyUnderlyingInterestGrowth = BigInt.fromI32(0)
    entity.supplySqrtInterest0Growth = BigInt.fromI32(0)
    entity.supplySqrtInterest1Growth = BigInt.fromI32(0)
    entity.borrowStableInterestGrowth = BigInt.fromI32(0)
    entity.borrowUnderlyingInterestGrowth = BigInt.fromI32(0)
    entity.borrowSqrtInterest0Growth = BigInt.fromI32(0)
    entity.borrowSqrtInterest1Growth = BigInt.fromI32(0)

    entity.createdAt = eventTime
  }

  return entity
}

export function ensureFeeDaily(
  controllerAddress: Bytes,
  pairId: BigInt,
  eventTime: BigInt
): FeeDaily {
  const id =
    controllerAddress.toHex() +
    '-' +
    pairId.toString() +
    '-' +
    toISODateString(eventTime)
  let entity = FeeDaily.load(id)

  if (entity == null) {
    entity = new FeeDaily(id)
    entity.pair = toPairId(pairId)
    entity.supplyStableFee = BigInt.fromI32(0)
    entity.supplyUnderlyingFee = BigInt.fromI32(0)
    entity.supplySqrtFee0 = BigInt.fromI32(0)
    entity.supplySqrtFee1 = BigInt.fromI32(0)
    entity.borrowStableFee = BigInt.fromI32(0)
    entity.borrowUnderlyingFee = BigInt.fromI32(0)
    entity.borrowSqrtFee0 = BigInt.fromI32(0)
    entity.borrowSqrtFee1 = BigInt.fromI32(0)
    entity.supplyStableInterestGrowth = BigInt.fromI32(0)
    entity.supplyUnderlyingInterestGrowth = BigInt.fromI32(0)
    entity.borrowStableInterestGrowth = BigInt.fromI32(0)
    entity.borrowUnderlyingInterestGrowth = BigInt.fromI32(0)

    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}

export function toPairId(pairId: BigInt): string {
  return pairId.toString()
}

export function toVaultId(vaultId: BigInt): string {
  return vaultId.toString()
}

export function toRebalanceId(event: Rebalanced): string {
  return (
    event.transaction.hash.toHex() +
    '-' +
    event.transactionLogIndex.toString() +
    '-' +
    event.params.pairId.toString()
  )
}

export function toStrategyUserPositionId(
  strategyId: BigInt,
  account: Bytes
): string {
  return strategyId.toString() + '-' + account.toHex()
}
