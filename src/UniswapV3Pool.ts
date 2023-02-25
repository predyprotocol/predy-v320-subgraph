import { Swap, UniswapV3Pool } from '../generated/UniswapV3Pool/UniswapV3Pool'
import { ensureUniFeeGrowthHourly } from './helper'

export function handleSwap(event: Swap): void {
  const entity = ensureUniFeeGrowthHourly(event.block.timestamp)

  entity.address = event.address

  const pool = UniswapV3Pool.bind(event.address)

  entity.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128()
  entity.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128()

  entity.updatedAt = event.block.timestamp
  entity.save()
}
