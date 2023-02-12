import { ethereum, BigInt } from "@graphprotocol/graph-ts"
import { newMockEvent } from "matchstick-as/assembly/index"
import { AssetGroupAdded } from "../generated/Controller/Controller"

export function createAssetGroupAdded(assetGroupId: BigInt, stableTokenId: BigInt): AssetGroupAdded {
  let assetGroupAddedEvent = changetype<AssetGroupAdded>(newMockEvent())
  assetGroupAddedEvent.parameters = new Array()

  let assetGroupIdParam = new ethereum.EventParam("from", ethereum.Value.fromUnsignedBigInt(assetGroupId))
  let stableTokenIdParam = new ethereum.EventParam("to", ethereum.Value.fromUnsignedBigInt(stableTokenId))

  assetGroupAddedEvent.parameters.push(assetGroupIdParam)
  assetGroupAddedEvent.parameters.push(stableTokenIdParam)

  return assetGroupAddedEvent
}
