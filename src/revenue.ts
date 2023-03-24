import {
  InterestGrowthUpdated  
} from '../generated/Controller/Controller'
import * as schema from '../generated/schema'
import {
  ensureAccumulatedProtocolFeeDaily,
  ensureAssetEntity,
  ensureInterestGrowthTx,
  ensureLPRevenueDaily,
} from './helper'
import { BigInt } from '@graphprotocol/graph-ts'
import {
  LPRevenueDaily, TotalTokensEntity,
} from '../generated/schema'


export function updateTokenRevenue(
  event: InterestGrowthUpdated,
  totalTokens: TotalTokensEntity
): schema.LPRevenueDaily {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const lpRevenuDaily = ensureLPRevenueDaily(timestamp)

  const asset = ensureAssetEntity(assetId, timestamp)
  const totalSupply = asset.totalSupply
  const totalBorrow = asset.totalBorrow

  const prevEntity = ensureInterestGrowthTx(
    assetId,
    totalTokens.growthCount,
    timestamp
  )

  // Token Fee
  const accumulatedInterests = event.params.assetGrowth.times(totalSupply)
  const prevAccumulatedInterests = prevEntity.accumulatedInterests

  const accumulatedDebts = event.params.debtGrowth.times(totalBorrow)
  const prevAccumulatedDebts = prevEntity.accumulatedDebts

  if (assetId.equals(BigInt.fromI32(1))) {
    lpRevenuDaily.supplyInterest0 = lpRevenuDaily.supplyInterest0.plus(
      accumulatedInterests.minus(prevAccumulatedInterests)
    )
    lpRevenuDaily.borrowInterest0 = lpRevenuDaily.borrowInterest0.plus(
      accumulatedDebts.minus(prevAccumulatedDebts)
    )
  } else if (assetId.equals(BigInt.fromI32(2))) {
    lpRevenuDaily.supplyInterest1 = lpRevenuDaily.supplyInterest1.plus(
      accumulatedInterests.minus(prevAccumulatedInterests)
    )
    lpRevenuDaily.borrowInterest1 = lpRevenuDaily.borrowInterest1.plus(
      accumulatedDebts.minus(prevAccumulatedDebts)
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
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp
  
  const lpRevenuDaily = ensureLPRevenueDaily(timestamp)

  const prevEntity = ensureInterestGrowthTx(
    assetId,
    totalTokens.growthCount,
    timestamp
  )

  const asset = ensureAssetEntity(assetId, timestamp)
  const sqrtTotalSupply = asset.sqrtTotalSupply
  const sqrtTotalBorrow = asset.sqrtTotalBorrow

  const accumulatedPremiumSupply =
    event.params.supplyPremiumGrowth.times(sqrtTotalSupply)
  const prevAccumulatedPremiumSupply = prevEntity.accumulatedPremiumSupply

  lpRevenuDaily.premiumSupply = lpRevenuDaily.premiumSupply.plus(
    accumulatedPremiumSupply.minus(prevAccumulatedPremiumSupply)
  )

  const accumulatedPremiumBorrow =
    event.params.borrowPremiumGrowth.times(sqrtTotalBorrow)
  const prevAccumulatedPremiumBorrow = prevEntity.accumulatedPremiumBorrow

  lpRevenuDaily.premiumBorrow = lpRevenuDaily.premiumBorrow.plus(
    accumulatedPremiumBorrow.minus(prevAccumulatedPremiumBorrow)
  )

  lpRevenuDaily.updatedAt = timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updateFeeRevenue(
  event: InterestGrowthUpdated,
  totalTokens: TotalTokensEntity
): LPRevenueDaily {
  const assetId = event.params.assetId
  const timestamp = event.block.timestamp

  const lpRevenuDaily = ensureLPRevenueDaily(timestamp)

  const prevEntity = ensureInterestGrowthTx(
    assetId,
    totalTokens.growthCount,
    timestamp
  )

  const asset = ensureAssetEntity(assetId, timestamp)
  const sqrtTotalSupply = asset.sqrtTotalSupply

  const fee0 = event.params.fee0Growth.times(sqrtTotalSupply)
  const fee1 = event.params.fee1Growth.times(sqrtTotalSupply)

  lpRevenuDaily.fee0 = lpRevenuDaily.fee0.plus(
    fee0.minus(prevEntity.accumulatedFee0)
  )
  lpRevenuDaily.fee1 = lpRevenuDaily.fee1.plus(
    fee1.minus(prevEntity.accumulatedFee1)
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

  const entity = ensureAccumulatedProtocolFeeDaily(timestamp)

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