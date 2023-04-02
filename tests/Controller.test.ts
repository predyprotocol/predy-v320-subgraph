import { BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { handleFeeCollected, handlePositionUpdated } from '../src/Controller';
import { createFeeCollectedEvent, createPositionUpdated } from './utils';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handlePositionUpdated", () => {
  test('incrase position amount', () => {
    const positionUpdatedEvent = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000/1/2', 'assetId', '2')
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000/1/2', 'tradeAmount', '1')
  })

  test('decrease position amount', () => {
    const positionUpdatedEvent1 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))
    const positionUpdatedEvent2 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent1)
    handlePositionUpdated(positionUpdatedEvent2)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000/1/2', 'assetId', '2')
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000/1/2', 'tradeAmount', '0')
  })
})

describe("handleFeeCollected", () => {
  test('fee collected', () => {
    const feeCollectedEvent = createFeeCollectedEvent(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(10))

    handleFeeCollected(feeCollectedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '0x0000000000000000000000000000000000000000/1/2', 'feeAmount', '10')
  })
})