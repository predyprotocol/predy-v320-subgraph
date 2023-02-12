import { BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { handleAssetGroupAdded, handlePositionUpdated } from '../src/Controller';
import { createAssetGroupAdded, createPositionUpdated } from './utils';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handleAssetGroupAdded", () => {
  test('add asset group', () => {
    const assetGroupAddedEvent = createAssetGroupAdded(BigInt.fromI32(1), BigInt.fromI32(1))
    handleAssetGroupAdded(assetGroupAddedEvent)

    assert.entityCount('AssetGroupEntity', 1)
    assert.fieldEquals('AssetGroupEntity', '1', 'assetGroupId', '1')
    assert.fieldEquals('AssetGroupEntity', '1', 'stableTokenId', '1')
  })
})

describe("handlePositionUpdated", () => {
  test('incrase position amount', () => {
    const positionUpdatedEvent = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '1/2', 'tokenId', '2')
    assert.fieldEquals('OpenPositionEntity', '1/2', 'tradeAmount', '1')
  })

  test('decrease position amount', () => {
    const positionUpdatedEvent1 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))
    const positionUpdatedEvent2 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent1)
    handlePositionUpdated(positionUpdatedEvent2)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '1/2', 'tokenId', '2')
    assert.fieldEquals('OpenPositionEntity', '1/2', 'tradeAmount', '0')
  })
})
