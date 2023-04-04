import { BigInt } from '@graphprotocol/graph-ts'
import {
  Swap,
  UniswapV3Pool
} from '../generated/WethUniswapV3Pool/UniswapV3Pool'
import { updateAggregatedPrice } from './AggregatedPrice'
import { StrategyStartBlock, wethGammaShortStrategyContract } from './contracts'
import { ensureUniFeeGrowthHourly } from './helper'
import { day, dayAdjustment, hour, hourAdjustment } from './time'

export function handleSwap(event: Swap): void {
  const entity = ensureUniFeeGrowthHourly(event.address, event.block.timestamp)

  entity.address = event.address

  const pool = UniswapV3Pool.bind(event.address)

  entity.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128()
  entity.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128()
  entity.updatedAt = event.block.timestamp

  event.params.sqrtPriceX96

  entity.save()

  for (let i = 0; i < 2; i++) {
    const intervalName = ['HOURLY', 'DAILY'][i]
    const intervalLength = [hour, day][i]
    const intervalAdjustment = [hourAdjustment, dayAdjustment][i]

    const isNewlyCreated = updateAggregatedPrice(
      intervalName,
      intervalLength,
      intervalAdjustment,
      event.address,
      event.params.sqrtPriceX96,
      event.block.timestamp
    )

    if (
      isNewlyCreated &&
      event.block.number.gt(BigInt.fromU64(StrategyStartBlock))
    ) {
      const wethStrategyPrice = wethGammaShortStrategyContract.getPrice()

      updateAggregatedPrice(
        intervalName,
        intervalLength,
        intervalAdjustment,
        wethGammaShortStrategyContract._address,
        wethStrategyPrice,
        event.block.timestamp
      )
    }
  }
}
