import { Address, BigInt } from '@graphprotocol/graph-ts'; //
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as/assembly/index';
import { handlePositionUpdated, handleTokenSupplied, handleTokenWithdrawn, handleVaultCreated } from '../src/PredyPool';
import { createPositionUpdated, createTokenSuppliedEvent, createTokenWithdrawnEvent, createVaultCreatedEvent } from './utils';

beforeEach(() => {
  clearStore() // <-- clear the store before each test in the file
})

describe("handlePositionUpdated", () => {
  test('incrase position amount', () => {
    const positionUpdatedEvent = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '1-2', 'pair', '2')
    assert.fieldEquals('OpenPositionEntity', '1-2', 'tradeAmount', '1')
  })

  test('decrease position amount', () => {
    const positionUpdatedEvent1 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(1), BigInt.fromI32(0), BigInt.fromI32(0))
    const positionUpdatedEvent2 = createPositionUpdated(BigInt.fromI32(1), BigInt.fromI32(2), BigInt.fromI32(-1), BigInt.fromI32(0), BigInt.fromI32(0))

    handlePositionUpdated(positionUpdatedEvent1)
    handlePositionUpdated(positionUpdatedEvent2)

    assert.entityCount('OpenPositionEntity', 1)
    assert.fieldEquals('OpenPositionEntity', '1-2', 'pair', '2')
    assert.fieldEquals('OpenPositionEntity', '1-2', 'tradeAmount', '0')

    assert.entityCount('TradeHistoryItem', 1)
  })
})

describe("handleTokenSupplied", () => {
  test('check history', () => {
    const tokenSuppliedEvent = createTokenSuppliedEvent(BigInt.fromI32(1), BigInt.fromI32(10))

    handleTokenSupplied(tokenSuppliedEvent)

    const id = `${tokenSuppliedEvent.transaction.hash.toHex()}-${tokenSuppliedEvent.logIndex.toString()}`

    assert.entityCount('LendingUserHistoryItem', 1)
    assert.fieldEquals('LendingUserHistoryItem', id, 'pairId', '1')
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetAmount', '10')
  })
})

describe("handleVaultCreated", () => {
  test('vault created', () => {
    const vaultCreatedEvent = createVaultCreatedEvent(BigInt.fromI32(1), Address.zero(), Address.zero(), BigInt.fromI32(1))

    handleVaultCreated(vaultCreatedEvent)

    assert.entityCount('VaultEntity', 1)
    assert.fieldEquals('VaultEntity', '1', 'owner', '0x0000000000000000000000000000000000000000')
    assert.fieldEquals('VaultEntity', '1', 'vaultId', '1')
    assert.fieldEquals('OpenPositionEntity', '1-1', 'pair', '1')
  })
})

describe("handleTokenWithdrawn", () => {
  test('check history', () => {
    const tokenWithdrawnEvent = createTokenWithdrawnEvent(BigInt.fromI32(1), BigInt.fromI32(10))

    handleTokenWithdrawn(tokenWithdrawnEvent)

    const id = `${tokenWithdrawnEvent.transaction.hash.toHex()}-${tokenWithdrawnEvent.logIndex.toString()}`

    assert.entityCount('LendingUserHistoryItem', 1)
    assert.fieldEquals('LendingUserHistoryItem', id, 'pairId', '1')
    assert.fieldEquals('LendingUserHistoryItem', id, 'assetAmount', '10')
  })
})
