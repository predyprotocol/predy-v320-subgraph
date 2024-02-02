import {
  OwnershipTransferred,
  PerpTraded,
  PerpTradedPayoffStruct,
  PerpTPSLOrderUpdated,
  PerpClosedByTPSLOrder
} from '../generated/PerpMarket/PerpMarket'
import { PerpTradeHistoryItem } from '../generated/schema'
import { toPairId, toVaultId } from './helper'
import { createPerpTradeHistory } from './perpHistory'

export function handlePerpClosedByTPSLOrder(
  event: PerpClosedByTPSLOrder
): void {
  const id = event.transaction.hash.toHex() + '/' + event.logIndex.toString()

  let item = PerpTradeHistoryItem.load(id)

  if (item === null) {
    item = new PerpTradeHistoryItem(id)
  }

  const payoff = new PerpTradedPayoffStruct()

  for (let i = 0; i < 6; i++) {
    payoff.push(event.params.payoff[i])
  }

  item.txHash = event.transaction.hash
  item.trader = event.params.trader
  item.pair = toPairId(event.params.pairId)
  item.size = event.params.tradeAmount
  item.entryValue = payoff.perpEntryUpdate
  item.payoff = payoff.perpPayoff
  item.margin = event.params.closeValue
  item.fee = event.params.fee
  item.createdAt = event.block.timestamp

  item.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  // TODO:
}

export function handlePerpTPSLOrderUpdated(event: PerpTPSLOrderUpdated): void {
  // TODO:
}

export function handlePerpTraded(event: PerpTraded): void {
  const payoff = new PerpTradedPayoffStruct()

  for (let i = 0; i < 6; i++) {
    payoff.push(event.params.payoff[i])
  }

  createPerpTradeHistory(
    event.transaction.hash,
    event.logIndex,
    event.params.trader,
    event.params.pairId,
    event.params.vaultId,
    event.params.tradeAmount,
    payoff.perpEntryUpdate,
    payoff.perpPayoff,
    event.params.marginAmount,
    event.params.fee,
    event.block.timestamp
  )
}
