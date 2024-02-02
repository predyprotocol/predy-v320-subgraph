import { ethereum, BigInt, Address, Bytes, ByteArray } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as/assembly/index"
import { PositionUpdated, TokenSupplied, TokenWithdrawn } from "../generated/PredyPool/PredyPool"
import { PerpTraded } from "../generated/PerpMarket/PerpMarket"

export function createPositionUpdated(vaultId: BigInt, assetId: BigInt, tradeAmount: BigInt, tradeSqrtAmount: BigInt, fee: BigInt): PositionUpdated {
  let positionUpdatedEvent = changetype<PositionUpdated>(newMockEvent())
  positionUpdatedEvent.address = Address.zero()
  positionUpdatedEvent.parameters = new Array()

  let vaultIdParam = new ethereum.EventParam("vaultId", ethereum.Value.fromUnsignedBigInt(vaultId))
  let assetIdParam = new ethereum.EventParam("assetId", ethereum.Value.fromUnsignedBigInt(assetId))
  let tradeAmountParam = new ethereum.EventParam("tradeAmount", ethereum.Value.fromSignedBigInt(tradeAmount))
  let tradeSqrtAmountParam = new ethereum.EventParam("tradeSqrtAmount", ethereum.Value.fromSignedBigInt(tradeSqrtAmount))

  const payoffParamValues = new ethereum.Tuple()
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))

  let payoffParam = new ethereum.EventParam("payoff", ethereum.Value.fromTuple(payoffParamValues))
  let feeParam = new ethereum.EventParam("fee", ethereum.Value.fromSignedBigInt(fee))

  positionUpdatedEvent.parameters.push(vaultIdParam)
  positionUpdatedEvent.parameters.push(assetIdParam)
  positionUpdatedEvent.parameters.push(tradeAmountParam)
  positionUpdatedEvent.parameters.push(tradeSqrtAmountParam)
  positionUpdatedEvent.parameters.push(payoffParam)
  positionUpdatedEvent.parameters.push(feeParam)

  return positionUpdatedEvent
}

export function createTokenSuppliedEvent(assetId: BigInt, suppliedAmount: BigInt): TokenSupplied {
  let tokenSuppliedEvent = changetype<TokenSupplied>(newMockEvent())

  tokenSuppliedEvent.address = Address.zero()

  tokenSuppliedEvent.parameters = new Array()

  let accountParam = new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.zero()))
  let assetIdParam = new ethereum.EventParam("pairId", ethereum.Value.fromUnsignedBigInt(assetId))
  let isQuoteParam = new ethereum.EventParam("isStable", ethereum.Value.fromBoolean(true))
  let suppliedAmountParam = new ethereum.EventParam("suppliedAmount", ethereum.Value.fromUnsignedBigInt(suppliedAmount))

  tokenSuppliedEvent.parameters.push(accountParam)
  tokenSuppliedEvent.parameters.push(assetIdParam)
  tokenSuppliedEvent.parameters.push(isQuoteParam)
  tokenSuppliedEvent.parameters.push(suppliedAmountParam)

  return tokenSuppliedEvent
}

export function createTokenWithdrawnEvent(assetId: BigInt, finalWithdrawnAmount: BigInt): TokenWithdrawn {
  let tokenWithdrawnEvent = changetype<TokenWithdrawn>(newMockEvent())

  tokenWithdrawnEvent.address = Address.zero()

  tokenWithdrawnEvent.parameters = new Array()

  let accountParam = new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.zero()))
  let assetIdParam = new ethereum.EventParam("pairId", ethereum.Value.fromUnsignedBigInt(assetId))
  let isQuoteParam = new ethereum.EventParam("isStable", ethereum.Value.fromBoolean(true))
  let finalWithdrawnAmountParam = new ethereum.EventParam("finalWithdrawnAmount", ethereum.Value.fromUnsignedBigInt(finalWithdrawnAmount))

  tokenWithdrawnEvent.parameters.push(accountParam)
  tokenWithdrawnEvent.parameters.push(assetIdParam)
  tokenWithdrawnEvent.parameters.push(isQuoteParam)
  tokenWithdrawnEvent.parameters.push(finalWithdrawnAmountParam)

  return tokenWithdrawnEvent
}

export function createPerpTradedEvent(
  trader: Address,
  pairId: BigInt,
  vaultId: BigInt,
  tradeAmount: BigInt,
  fee: BigInt,
  marginAmount: BigInt
): PerpTraded {
  let event = changetype<PerpTraded>(newMockEvent())

  let traderParam = new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  let pairIdParam = new ethereum.EventParam("pairId", ethereum.Value.fromUnsignedBigInt(pairId))
  let vaultIdParam = new ethereum.EventParam("vaultId", ethereum.Value.fromUnsignedBigInt(vaultId))
  let tradeAmountParam = new ethereum.EventParam("tradeAmount", ethereum.Value.fromSignedBigInt(tradeAmount))

  // Makes Payoff struct
  const payoffParamValues = new ethereum.Tuple()
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))
  payoffParamValues.push(ethereum.Value.fromSignedBigInt(BigInt.zero()))

  let payoffParam = new ethereum.EventParam("payoff", ethereum.Value.fromTuple(payoffParamValues))
  let feeParam = new ethereum.EventParam("fee", ethereum.Value.fromSignedBigInt(fee))
  let marginAmountParam = new ethereum.EventParam("marginAmount", ethereum.Value.fromSignedBigInt(marginAmount))

  event.parameters.push(traderParam)
  event.parameters.push(pairIdParam)
  event.parameters.push(vaultIdParam)
  event.parameters.push(tradeAmountParam)
  event.parameters.push(payoffParam)
  event.parameters.push(feeParam)
  event.parameters.push(marginAmountParam)

  return event
}
