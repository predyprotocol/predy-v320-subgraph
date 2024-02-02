import { Address, BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { createSpotTradedEvent } from './utils';
import { handleSpotTraded } from '../src/SpotMarket';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handleSpotTraded", () => {
  test('check spot history item', () => {
    const tradedEvent = createSpotTradedEvent(
      Address.zero(),
      Address.zero(),
      Address.zero(),
      Address.zero(),
      BigInt.fromI32(1),
      BigInt.fromI32(2),
      Address.zero(),
    )

    handleSpotTraded(tradedEvent)

    const id = `${tradedEvent.transaction.hash.toHex()}-${tradedEvent.logIndex.toString()}`

    assert.entityCount('SpotTradeHistoryItem', 1)
    assert.fieldEquals('SpotTradeHistoryItem', id, 'baseAmount', '1')
    assert.fieldEquals('SpotTradeHistoryItem', id, 'quoteAmount', '2')
  })
})
