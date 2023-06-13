import { BigInt, Bytes } from '@graphprotocol/graph-ts'

import {
  ControllerEntity,
  FeeDaily,
  FeeEntity,
  OpenInterestDaily,
  OpenInterestTotal,
  OpenPositionEntity,
  PairEntity,
  StrategyUserPosition,
  TokenEntity,
  TradeHistoryItem,
  UniFeeGrowthHourly
} from '../generated/schema'
import { Rebalanced } from '../generated/Controller/Controller'


export function ensureControllerEntity(
  controllerAddress: Bytes,
  eventTime: BigInt
): ControllerEntity {
  const id = controllerAddress.toHex()
  let entity = ControllerEntity.load(id)

  if (entity == null) {
    entity = new ControllerEntity(id)
    entity.contractAddress = controllerAddress
    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}

export function ensurePairEntity(
  controllerAddress: Bytes,
  pairId: BigInt,
  eventTime: BigInt
): PairEntity {
  const id = toPairId(controllerAddress, pairId)
  let entity = PairEntity.load(id)

  if (entity == null) {
    entity = new PairEntity(id)
    entity.controller = controllerAddress.toHex()
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
    entity.pair = toPairId(address, pairId)
    entity.decimals = BigInt.zero()
    entity.symbol = Bytes.empty()
    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

  return entity
}


export function ensureOpenPosition(
  controllerAddress: Bytes,
  pairId: BigInt,
  vaultId: BigInt,
  eventTime: BigInt
): OpenPositionEntity {
  const id =
    controllerAddress.toHex() +
    '-' +
    vaultId.toString() +
    '-' +
    pairId.toString()

  let openPosition = OpenPositionEntity.load(id)

  if (openPosition == null) {
    openPosition = new OpenPositionEntity(id)
    openPosition.pair = toPairId(controllerAddress, pairId)
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

export function ensureFeeEntity(
  controllerAddress: Bytes,
  pairId: BigInt,
  txHash: Bytes,
  eventTime: BigInt
): FeeEntity {
  const id = controllerAddress.toHex() + '-' + pairId.toString() + '-' + txHash.toHex()
  let entity = FeeEntity.load(id)

  if (entity == null) {
    entity = new FeeEntity(id)
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
  const id = controllerAddress.toHex() + '-' + pairId.toString() + '-' + toISODateString(eventTime)
  let entity = FeeDaily.load(id)

  if (entity == null) {
    entity = new FeeDaily(id)
    entity.supplyStableFee = BigInt.fromI32(0)
    entity.supplyUnderlyingFee = BigInt.fromI32(0)
    entity.supplySqrtFee0 = BigInt.fromI32(0)
    entity.supplySqrtFee1 = BigInt.fromI32(0)
    entity.borrowStableFee = BigInt.fromI32(0)
    entity.borrowUnderlyingFee = BigInt.fromI32(0)
    entity.borrowSqrtFee0 = BigInt.fromI32(0)
    entity.borrowSqrtFee1 = BigInt.fromI32(0)

    entity.createdAt = eventTime
  }

  entity.updatedAt = eventTime

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

export function toPairId(address: Bytes, pairId: BigInt): string {
  return address.toHex() + '-' + pairId.toString()
}

export function toVaultId(address: Bytes, vaultId: BigInt): string {
  return address.toHex() + '-' + vaultId.toString()
}

export function toRebalanceId(event: Rebalanced): string {
  return event.transaction.hash.toHex() +
    '-' +
    event.transactionLogIndex.toString() +
    '-' +
    event.params.pairId.toString()
}


export function toStrategyUserPositionId(
  address: Bytes,
  account: Bytes
): string {
  return address.toHex() + '-' + account.toHex()
}
