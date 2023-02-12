import { BigInt } from '@graphprotocol/graph-ts'

import {
  UniFeeGrowthHourly
} from '../generated/schema'

export function ensureUniFeeGrowthHourly(
  eventTime: BigInt
): UniFeeGrowthHourly {
  const id = toHourlyId(eventTime)
  let entity = UniFeeGrowthHourly.load(id)

  if (entity == null) {
    entity = new UniFeeGrowthHourly(id)
    entity.feeGrowthGlobal0X128 = BigInt.fromI32(0)
    entity.feeGrowthGlobal1X128 = BigInt.fromI32(0)
    entity.createdAt = eventTime
    entity.updatedAt = eventTime
  }

  return entity
}

function toHourlyId(timestamp: BigInt): string {
  let excess = timestamp.mod(BigInt.fromU32(60 * 60))
  let open = timestamp.minus(excess)

  return open.toString()
}
