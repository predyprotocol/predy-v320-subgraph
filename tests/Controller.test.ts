import { BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { handleFeeCollected, handlePositionUpdated, handleTokenSupplied, handleTokenWithdrawn } from '../src/Controller';
import { createFeeCollectedEvent, createPositionUpdated, createTokenSuppliedEvent, createTokenWithdrawnEvent } from './utils';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handlePositionUpdated", () => {
  test('incrase position amount', () => {
    const positionUpdatedEvent = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000-1-2', 'assetId', '2')
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000-1-2', 'tradeAmount', '1')
  })

  test('decrease position amount', () => {
    const positionUpdatedEvent1 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))
    const positionUpdatedEvent2 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent1)
    handlePositionUpdated(positionUpdatedEvent2)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000-1-2', 'assetId', '2')
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000-1-2', 'tradeAmount', '0')

    assert.entityCount('TradeHistoryItem', 1)

  })
})

describe("handleFeeCollected", () => {
  test('fee collected', () => {
    const feeCollectedEvent = createFeeCollectedEvent(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(10))

    handleFeeCollected(feeCollectedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000-1-2', 'feeAmount', '10')
  })
})

describe("handleTokenSupplied", () => {
  test('check history', () => {
    const tokenSuppliedEvent = createTokenSuppliedEvent(BigInt.fromI32(1), BigInt.fromI32(10))

    handleTokenSupplied(tokenSuppliedEvent)

    const id = `${tokenSuppliedEvent.transaction.hash.toHex()}-${tokenSuppliedEvent.logIndex.toString()}`

    assert.entityCount('LendingUserHistoryItem', 1)
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetId', '1')
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetAmount', '10')
  })
})

describe("handleTokenWithdrawn", () => {
  test('check history', () => {
    const tokenWithdrawnEvent = createTokenWithdrawnEvent(BigInt.fromI32(1), BigInt.fromI32(10))

    handleTokenWithdrawn(tokenWithdrawnEvent)

    const id = `${tokenWithdrawnEvent.transaction.hash.toHex()}-${tokenWithdrawnEvent.logIndex.toString()}`

    assert.entityCount('LendingUserHistoryItem', 1)
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetId', '1')
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetAmount', '10')
  })
})
