import { Address, BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { createPerpTradedEvent } from './utils';
import { handlePerpTraded } from '../src/PerpMarket';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handlePerpTraded", () => {
  test('check perp history item', () => {
    const tradedEvent = createPerpTradedEvent(
      Address.zero(),
      BigInt.fromI32(1),
      BigInt.fromI32(2),
      BigInt.fromI32(10),
      BigInt.fromI32(0),
      BigInt.fromI32(0)
    )

    handlePerpTraded(tradedEvent)

    const id = `${tradedEvent.transaction.hash.toHex()}-${tradedEvent.logIndex.toString()}`

    assert.entityCount('PerpTradeHistoryItem', 1)
    assert.fieldEquals('PerpTradeHistoryItem', id, 'pair', '1')
    assert.fieldEquals('PerpTradeHistoryItem', id, 'size', '10')
  })
})
