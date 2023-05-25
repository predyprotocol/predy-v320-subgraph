import { InterestGrowthUpdated } from '../generated/Controller/Controller'
import * as schema from '../generated/schema'
import {
  ensureAccumulatedProtocolFeeDaily,
  ensureInterestDaily,
  ensureInterestGrowthTx,
  ensureLPRevenueDaily
} from './helper'
import { BigInt } from '@graphprotocol/graph-ts'
import { LPRevenueDaily, TotalTokensEntity } from '../generated/schema'

export function updateTokenRevenue(
  event: InterestGrowthUpdated,
  totalTokens: TotalTokensEntity
): schema.LPRevenueDaily {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const lpRevenuDaily = ensureLPRevenueDaily(event.address, timestamp)

  const prevEntity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount.minus(BigInt.fromU32(1)),
  )

  const entity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount
  )

  if (assetId.equals(BigInt.fromI32(1))) {
    lpRevenuDaily.supplyInterest0 = lpRevenuDaily.supplyInterest0.plus(
      entity.accumulatedInterests.minus(prevEntity.accumulatedInterests)
    )
    lpRevenuDaily.borrowInterest0 = lpRevenuDaily.borrowInterest0.plus(
      entity.accumulatedDebts.minus(prevEntity.accumulatedDebts)
    )
  } else if (assetId.equals(BigInt.fromI32(2))) {
    lpRevenuDaily.supplyInterest1 = lpRevenuDaily.supplyInterest1.plus(
      entity.accumulatedInterests.minus(prevEntity.accumulatedInterests)
    )
    lpRevenuDaily.borrowInterest1 = lpRevenuDaily.borrowInterest1.plus(
      entity.accumulatedDebts.minus(prevEntity.accumulatedDebts)
    )
  }

  lpRevenuDaily.updatedAt = timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updatePremiumRevenue(
  event: InterestGrowthUpdated,
  totalTokens: TotalTokensEntity
): LPRevenueDaily {
  const timestamp = event.block.timestamp

  const lpRevenuDaily = ensureLPRevenueDaily(event.address, timestamp)

  const prevEntity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount.minus(BigInt.fromU32(1)),
  )

  const entity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount,
  )

  lpRevenuDaily.premiumSupply = lpRevenuDaily.premiumSupply.plus(
    entity.accumulatedPremiumSupply.minus(prevEntity.accumulatedPremiumSupply)
  )
  lpRevenuDaily.premiumBorrow = lpRevenuDaily.premiumBorrow.plus(
    entity.accumulatedPremiumBorrow.minus(prevEntity.accumulatedPremiumBorrow)
  )
    
  lpRevenuDaily.updatedAt = timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updateFeeRevenue(
  event: InterestGrowthUpdated,
  totalTokens: TotalTokensEntity
): LPRevenueDaily {
  const timestamp = event.block.timestamp

  const lpRevenuDaily = ensureLPRevenueDaily(event.address, timestamp)

  const prevEntity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount.minus(BigInt.fromU32(1)),
  )

  const entity = ensureInterestGrowthTx(
    event,
    totalTokens.growthCount,
  )

  lpRevenuDaily.fee0 = lpRevenuDaily.fee0.plus(
    entity.accumulatedFee0.minus(prevEntity.accumulatedFee0)
  )
  lpRevenuDaily.fee1 = lpRevenuDaily.fee1.plus(
    entity.accumulatedFee1.minus(prevEntity.accumulatedFee1)
  )

  lpRevenuDaily.updatedAt = timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updateProtocolRevenue(
  event: InterestGrowthUpdated
): schema.AccumulatedProtocolFeeDaily {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const entity = ensureAccumulatedProtocolFeeDaily(event.address, timestamp)

  if (assetId.equals(BigInt.fromI32(1))) {
    // USDC
    entity.accumulatedProtocolFee0 = event.params.accumulatedProtocolRevenue
  } else if (assetId.equals(BigInt.fromI32(2))) {
    // ETH
    entity.accumulatedProtocolFee1 = event.params.accumulatedProtocolRevenue
  }
  entity.save()

  return entity
}

export function updateInterestDaily(
  event: InterestGrowthUpdated
): schema.InterestDaily {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const entity = ensureInterestDaily(event.address, assetId, timestamp)

  entity.assetGrowth = event.params.assetGrowth
  entity.debtGrowth = event.params.debtGrowth
  entity.updatedAt = timestamp

  entity.save()

  return entity
}
