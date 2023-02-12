import { Swap } from '../generated/UniswapV3Pool/UniswapV3Pool'
import { uniswapV3PoolContract } from './contracts'
import { ensureUniFeeGrowthHourly } from './helper'

export function handleSwap(event: Swap): void {
  const entity = ensureUniFeeGrowthHourly(event.block.timestamp)

  entity.feeGrowthGlobal0X128 = uniswapV3PoolContract.feeGrowthGlobal0X128()
  entity.feeGrowthGlobal1X128 = uniswapV3PoolContract.feeGrowthGlobal1X128()

  entity.updatedAt = event.block.timestamp
  entity.save()
}
