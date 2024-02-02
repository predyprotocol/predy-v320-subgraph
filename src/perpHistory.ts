import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { PerpTradeHistoryItem } from '../generated/schema'
import { toPairId, toVaultId } from './helper'

export function createPerpTradeHistory(
  txHash: Bytes,
  logIndex: BigInt,
  trader: Bytes,
  pairId: BigInt,
  vaultId: BigInt,
  tradeAmount: BigInt,
  entryValue: BigInt,
  payoff: BigInt,
  margin: BigInt,
  fee: BigInt,
  eventTime: BigInt
): void {
  createPerpHistory(
    txHash,
    logIndex,
    trader,
    pairId,
    vaultId,
    'POSITION',
    tradeAmount,
    entryValue,
    payoff,
    margin,
    fee,
    eventTime
  )
}

export function createPerpLiquidationHistory(
  txHash: Bytes,
  logIndex: BigInt,
  trader: Bytes,
  pairId: BigInt,
  vaultId: BigInt,
  tradeAmount: BigInt,
  entryValue: BigInt,
  payoff: BigInt,
  margin: BigInt,
  fee: BigInt,
  eventTime: BigInt
): void {
  createPerpHistory(
    txHash,
    logIndex,
    trader,
    pairId,
    vaultId,
    'LIQUIDATION',
    tradeAmount,
    entryValue,
    payoff,
    margin,
    fee,
    eventTime
  )
}

function createPerpHistory(
  txHash: Bytes,
  logIndex: BigInt,
  trader: Bytes,
  pairId: BigInt,
  vaultId: BigInt,
  action: string,
  tradeAmount: BigInt,
  entryValue: BigInt,
  payoff: BigInt,
  margin: BigInt,
  fee: BigInt,
  eventTime: BigInt
): void {
  const item = new PerpTradeHistoryItem(
    `${txHash.toHex()}-${logIndex.toString()}`
  )

  item.txHash = txHash
  item.trader = trader
  item.pair = toPairId(pairId)
  item.vault = toVaultId(vaultId)
  item.action = action
  item.size = tradeAmount
  item.entryValue = entryValue
  item.payoff = payoff
  item.margin = margin
  item.fee = fee
  item.createdAt = eventTime

  item.save()
}
