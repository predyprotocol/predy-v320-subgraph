import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as/assembly/index"
import { FeeCollected, PositionUpdated } from "../generated/Controller/Controller"

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


export function createFeeCollectedEvent(vaultId: BigInt, assetId: BigInt, feeCollected: BigInt): FeeCollected {
  let feeCollectedEvent = changetype<FeeCollected>(newMockEvent())

  feeCollectedEvent.address = Address.zero()

  feeCollectedEvent.parameters = new Array()

  let vaultIdParam = new ethereum.EventParam("vaultId", ethereum.Value.fromUnsignedBigInt(vaultId))
  let assetIdParam = new ethereum.EventParam("assetId", ethereum.Value.fromUnsignedBigInt(assetId))
  let feeCollectedParam = new ethereum.EventParam("feeCollected", ethereum.Value.fromUnsignedBigInt(feeCollected))

  feeCollectedEvent.parameters.push(vaultIdParam)
  feeCollectedEvent.parameters.push(assetIdParam)
  feeCollectedEvent.parameters.push(feeCollectedParam)

  return feeCollectedEvent
}
