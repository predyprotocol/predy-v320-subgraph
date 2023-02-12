import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { handleAssetGroupAdded } from '../src/Controller';
import { createAssetGroupAdded } from './utils';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handleAssetGroupAdded", () => {
  test('add asset group', () => {
    const assetGroupAddedEvent = createAssetGroupAdded(BigInt.fromI32(1), BigInt.fromI32(1))
    handleAssetGroupAdded(assetGroupAddedEvent)

    // assert lpt entity has not been removed
    assert.entityCount('AssetGroupEntity', 1)
    assert.fieldEquals('AssetGroupEntity', '1', 'assetGroupId', '1')
    assert.fieldEquals('AssetGroupEntity', '1', 'stableTokenId', '1')
  })
})
