import { ethereum, BigInt } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as/assembly/index"
import { AssetGroupAdded, PositionUpdated } from "../generated/Controller/Controller"

export function createAssetGroupAdded(assetGroupId: BigInt, stableTokenId: BigInt): AssetGroupAdded {
  let assetGroupAddedEvent = changetype<AssetGroupAdded>(newMockEvent())
  assetGroupAddedEvent.parameters = new Array()

  let assetGroupIdParam = new ethereum.EventParam("from", ethereum.Value.fromUnsignedBigInt(assetGroupId))
  let stableTokenIdParam = new ethereum.EventParam("to", ethereum.Value.fromUnsignedBigInt(stableTokenId))

  assetGroupAddedEvent.parameters.push(assetGroupIdParam)
  assetGroupAddedEvent.parameters.push(stableTokenIdParam)

  return assetGroupAddedEvent
}

export function createPositionUpdated(vaultId: BigInt, tokenId: BigInt, tradeAmount: BigInt, tradeSqrtAmount: BigInt, fee: BigInt): PositionUpdated {
  let positionUpdatedEvent = changetype<PositionUpdated>(newMockEvent())
  positionUpdatedEvent.parameters = new Array()

  let vaultIdParam = new ethereum.EventParam("vaultId", ethereum.Value.fromUnsignedBigInt(vaultId))
  let tokenIdParam = new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
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
  positionUpdatedEvent.parameters.push(tokenIdParam)
  positionUpdatedEvent.parameters.push(tradeAmountParam)
  positionUpdatedEvent.parameters.push(tradeSqrtAmountParam)
  positionUpdatedEvent.parameters.push(payoffParam)
  positionUpdatedEvent.parameters.push(feeParam)

  return positionUpdatedEvent
}
