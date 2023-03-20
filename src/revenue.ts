import {
  InterestGrowthUpdated  
} from '../generated/Controller/Controller'
import * as schema from '../generated/schema'
import { ensureAccumulatedProtocolFeeDaily, ensureInterestGrowth1Tx, ensureInterestGrowth2Tx, ensureLPRevenueDaily, ensureTotalTokens1Entity, ensureTotalTokens2Entity } from './helper'
import { ONE } from './constants'
import { BigInt } from '@graphprotocol/graph-ts'
import { controllerContract } from './contracts'
import { LPRevenueDaily, TotalTokens1Entity, TotalTokens2Entity } from '../generated/schema'

export function getTotalSupply(event: InterestGrowthUpdated): BigInt  {
  const asset = controllerContract.getAsset(event.params.assetId)
  const tokenStatus = asset.tokenStatus
  const totalSupply = tokenStatus.totalCompoundDeposited
    .times(tokenStatus.assetScaler)
    .div(ONE)
    .plus(tokenStatus.totalNormalDeposited)  
  return totalSupply
}

export function getTotalBorrow(event: InterestGrowthUpdated): BigInt {
  const asset = controllerContract.getAsset(event.params.assetId)
  const tokenStatus = asset.tokenStatus
  const totalBorrow = tokenStatus.totalCompoundBorrowed
    .times(tokenStatus.debtScaler)
    .div(ONE)
    .plus(tokenStatus.totalNormalBorrowed)
  return totalBorrow
}

export function getSqrtTotalSupply(event: InterestGrowthUpdated): BigInt {
  const asset = controllerContract.getAsset(event.params.assetId)
  const sqrtAssetStatus = asset.sqrtAssetStatus
  const sqrtTotalSupply = sqrtAssetStatus.totalAmount
  return sqrtTotalSupply
}

export function getSqrtTotalBorrow(event: InterestGrowthUpdated): BigInt {
  const asset = controllerContract.getAsset(event.params.assetId)
  const sqrtAssetStatus = asset.sqrtAssetStatus
  const sqrtTotalBorrow = sqrtAssetStatus.borrowedAmount
  return sqrtTotalBorrow
}

export function updateTokenRevenue(
  event: InterestGrowthUpdated,
  totalToken1: TotalTokens1Entity,
  totalToken2: TotalTokens2Entity
): schema.LPRevenueDaily {
  const lpRevenuDaily = ensureLPRevenueDaily(event.block.timestamp)

  const totalSupply = getTotalSupply(event)
  const totalBorrow = getTotalBorrow(event)

  if (event.params.assetId.equals(BigInt.fromI32(1))) {
    const totalTokens = totalToken1
    const prevEntity = ensureInterestGrowth1Tx(
      totalTokens.growthCount,
      event.block.timestamp
    )
    // Token Fee
    // USDC
    const accumulatedInterests = event.params.assetGrowth.times(totalSupply)
    const prevAccumulatedInterests = prevEntity.accumulatedInterests

    lpRevenuDaily.supplyInterest0 = lpRevenuDaily.supplyInterest0.plus(
      accumulatedInterests.minus(prevAccumulatedInterests)
    )

    const accumulatedDebts = event.params.debtGrowth.times(totalBorrow)
    const prevAccumulatedDebts = prevEntity.accumulatedDebts

    lpRevenuDaily.borrowInterest0 = lpRevenuDaily.borrowInterest0.plus(
      accumulatedDebts.minus(prevAccumulatedDebts)
    )

    // Create ensureInterestGrowthTx
    const entity = ensureInterestGrowth1Tx(
      totalTokens.growthCount.plus(BigInt.fromU32(1)),
      event.block.timestamp
    )

    entity.accumulatedInterests = accumulatedInterests
    entity.accumulatedDebts = accumulatedDebts
    entity.save()
  } else if (event.params.assetId.equals(BigInt.fromI32(2))) {
    const totalTokens = totalToken2
    const prevEntity = ensureInterestGrowth2Tx(
      totalTokens.growthCount,
      event.block.timestamp
    )

    // Token Fee
    // ETH
    const accumulatedInterests = event.params.assetGrowth.times(totalSupply)
    const prevAccumulatedInterests = prevEntity.accumulatedInterests

    lpRevenuDaily.supplyInterest1 = lpRevenuDaily.supplyInterest1.plus(
      accumulatedInterests.minus(prevAccumulatedInterests)
    )

    const accumulatedDebts = event.params.debtGrowth.times(totalBorrow)
    const prevAccumulatedDebts = prevEntity.accumulatedDebts

    lpRevenuDaily.borrowInterest1 = lpRevenuDaily.borrowInterest1.plus(
      accumulatedDebts.minus(prevAccumulatedDebts)
    )
  }


  lpRevenuDaily.updatedAt = event.block.timestamp

  lpRevenuDaily.save()

  return lpRevenuDaily
}


export function updatePremiumRevenue(
  event: InterestGrowthUpdated,
  totalToken2: TotalTokens2Entity
): LPRevenueDaily {
  const lpRevenuDaily = ensureLPRevenueDaily(event.block.timestamp)

  const asset = controllerContract.getAsset(event.params.assetId)
  const assetId = asset.id

  if (assetId.equals(BigInt.fromI32(1))) {
    // Nothing to do
    return lpRevenuDaily
  }

  let prevEntity: schema.InterestGrowth2Tx
  let totalTokens: TotalTokens2Entity
  if (assetId.equals(BigInt.fromI32(2))) {
    totalTokens = totalToken2
    prevEntity = ensureInterestGrowth2Tx(
      totalTokens.growthCount,
      event.block.timestamp
    )
  } else {
    return lpRevenuDaily
  }

  const sqrtTotalSupply = getSqrtTotalSupply(event)
  const sqrtTotalBorrow = getSqrtTotalBorrow(event)

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

  lpRevenuDaily.updatedAt = event.block.timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updateFeeRevenue(
  event: InterestGrowthUpdated,
  totalToken2: TotalTokens2Entity
): LPRevenueDaily {
  const lpRevenuDaily = ensureLPRevenueDaily(event.block.timestamp)

  if (event.params.assetId.equals(BigInt.fromI32(1))) {
    // Nothing to do
    return lpRevenuDaily
  }

  let prevEntity: schema.InterestGrowth2Tx
  let totalTokens: TotalTokens2Entity
  if (event.params.assetId.equals(BigInt.fromI32(2))) {
    totalTokens = totalToken2
    prevEntity = ensureInterestGrowth2Tx(
      totalTokens.growthCount,
      event.block.timestamp
    )
  } else {
    return lpRevenuDaily
  }

  const sqrtTotalSupply = getSqrtTotalSupply(event)

  // Fee
  const fee0 = event.params.fee0Growth.times(sqrtTotalSupply)
  const fee1 = event.params.fee1Growth.times(sqrtTotalSupply)

  lpRevenuDaily.fee0 = lpRevenuDaily.fee0.plus(
    fee0.minus(prevEntity.accumulatedFee0)
  )
  lpRevenuDaily.fee1 = lpRevenuDaily.fee1.plus(
    fee1.minus(prevEntity.accumulatedFee1)
  )

  lpRevenuDaily.updatedAt = event.block.timestamp
  lpRevenuDaily.save()

  return lpRevenuDaily
}

export function updateProtocolRevenue(
  event: InterestGrowthUpdated
): schema.AccumulatedProtocolFeeDaily {
  const entity = ensureAccumulatedProtocolFeeDaily(event.block.timestamp)

  const asset = controllerContract.getAsset(event.params.assetId)
  const assetId = asset.id

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