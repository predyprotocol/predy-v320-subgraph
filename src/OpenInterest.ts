import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { ensureOpenInterestDaily, ensureOpenInterestTotal } from './helper'

class NextOpenInterest {
  nextTotalLong: BigInt
  nextTotalShort: BigInt
}

class OpenAndCloseAmount {
  openAmount: BigInt
  closeAmount: BigInt
}

export function updateOpenInterest(
  assetId: BigInt,
  eventTime: BigInt,
  vaultAmount: BigInt,
  tradeAmount: BigInt,
  vaultSqrtAmount: BigInt,
  tradeSqrtAmount: BigInt
): void {
  const openInterstDaily = ensureOpenInterestDaily(assetId, eventTime)
  const openInterstTotal = ensureOpenInterestTotal(assetId, eventTime)

  const nextPerpPosition = calculateOpenInterest(
    openInterstTotal.longPerp,
    openInterstTotal.shortPerp,
    vaultAmount,
    tradeAmount
  )
  const nextSqrtPosition = calculateOpenInterest(
    openInterstTotal.longSquart,
    openInterstTotal.shortSquart,
    vaultSqrtAmount,
    tradeSqrtAmount
  )

  openInterstTotal.longPerp = nextPerpPosition.nextTotalLong
  openInterstTotal.shortPerp = nextPerpPosition.nextTotalShort
  openInterstTotal.longSquart = nextSqrtPosition.nextTotalLong
  openInterstTotal.shortSquart = nextSqrtPosition.nextTotalShort

  openInterstDaily.longPerp = nextPerpPosition.nextTotalLong
  openInterstDaily.shortPerp = nextPerpPosition.nextTotalShort
  openInterstDaily.longSquart = nextSqrtPosition.nextTotalLong
  openInterstDaily.shortSquart = nextSqrtPosition.nextTotalShort

  openInterstTotal.save()
  openInterstDaily.save()
}

function calculateOpenInterest(
  totalLong: BigInt,
  totalShort: BigInt,
  vaultAmount: BigInt,
  tradeAmount: BigInt
): NextOpenInterest {
  let nextTotalLong = totalLong
  let nextTotalShort = totalShort

  const openAndCloseAmounts = calculateOpenAndCloseAmounts(
    vaultAmount,
    tradeAmount
  )
  const openAmount = openAndCloseAmounts.openAmount
  const closeAmount = openAndCloseAmounts.closeAmount

  if (openAmount.gt(BigInt.zero())) {
    nextTotalLong = totalLong.plus(openAmount)
  } else if (openAmount.lt(BigInt.zero())) {
    nextTotalShort = totalShort.minus(openAmount)
  }

  if (closeAmount.gt(BigInt.zero())) {
    nextTotalShort = totalShort.minus(closeAmount)
  } else if (closeAmount.lt(BigInt.zero())) {
    nextTotalLong = totalLong.plus(closeAmount)
  }

  return {
    nextTotalLong,
    nextTotalShort
  }
}

function calculateOpenAndCloseAmounts(
  vaultAmount: BigInt,
  tradeAmount: BigInt
): OpenAndCloseAmount {
  let openAmount = BigInt.zero()
  let closeAmount = BigInt.zero()

  if (vaultAmount.times(tradeAmount).ge(BigInt.zero())) {
    openAmount = tradeAmount
  } else {
    if (vaultAmount.abs() >= tradeAmount.abs()) {
      closeAmount = tradeAmount
    } else {
      openAmount = vaultAmount.plus(tradeAmount)
      closeAmount = vaultAmount.neg()
    }
  }

  return {
    openAmount,
    closeAmount
  }
}
