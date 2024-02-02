import { SpotTraded } from '../generated/SpotMarket/SpotMarket'
import { SpotTradeHistoryItem } from '../generated/schema'

export function handleSpotTraded(event: SpotTraded): void {
  const id = event.transaction.hash.toHex() + '/' + event.logIndex.toString()

  let historyItem = SpotTradeHistoryItem.load(id)

  if (historyItem === null) {
    historyItem = new SpotTradeHistoryItem(id)

    historyItem.txHash = event.transaction.hash
    historyItem.trader = event.params.trader
    historyItem.baseToken = event.params.baseToken
    historyItem.quoteToken = event.params.quoteToken
    historyItem.baseAmount = event.params.baseAmount
    historyItem.quoteAmount = event.params.quoteAmount
    historyItem.createdAt = event.block.timestamp
    historyItem.validatorAddress = event.params.validatorAddress

    historyItem.save()
  }
}
