import {
  OwnershipTransferred,
  PerpTraded,
  PerpTradedPayoffStruct,
  PerpTraded2
} from '../generated/PerpMarket/PerpMarket'
import { PerpTradeHistoryItem, TradedOrderIDs } from '../generated/schema'
import { ensureTradedOrderIDs, toPairId, toVaultId } from './helper'
import { createPerpTradeHistory } from './perpHistory'

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
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

export function handlePerpTraded2(event: PerpTraded2): void {
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

  const tradedOrderId = ensureTradedOrderIDs(
    event.block.timestamp,
    event.params.orderId,
    event.address
  )

  tradedOrderId.save()
}
