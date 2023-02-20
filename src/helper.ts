import { BigInt } from '@graphprotocol/graph-ts'

import {
  OpenPositionEntity,
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
  }

  return openPosition
}

export function createMarginHistory(
  txHash: string,
  vaultId: BigInt,
  size: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(txHash + '/' + vaultId.toString() + '/margin')

  historyItem.vault = vaultId.toString()
  historyItem.action = 'MARGIN'
  historyItem.size = size
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}

export function createFeeHistory(
  txHash: string,
  vaultId: BigInt,
  size: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new TradeHistoryItem(txHash + '/' + vaultId.toString() + '/fee')

  historyItem.vault = vaultId.toString()
  historyItem.action = 'FEE'
  historyItem.size = size
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
