import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { OpenInterest } from '../generated/schema'

class NextOpenInterest {
  nextTotalLong: BigInt
  nextTotalShort: BigInt
}

class OpenAndCloseAmount {
  openAmount: BigInt
  closeAmount: BigInt
}

export function ensureOpenInterest(
  controllerAddress: Bytes,
  assetId: BigInt,
  eventTime: BigInt
): OpenInterest {
  const id =
    controllerAddress.toHex() +
    '-' +
    assetId.toString()

  let openInterest = OpenInterest.load(id)

  if (openInterest == null) {
    openInterest = new OpenInterest(id)
    openInterest.assetId = assetId
    openInterest.longPerp = BigInt.zero()
    openInterest.shortPerp = BigInt.zero()
    openInterest.longSquart = BigInt.zero()
    openInterest.shortSquart = BigInt.zero()
    openInterest.createdAt = eventTime
  }

  openInterest.updatedAt = eventTime

  return openInterest
}

export function updateOpenInterest(
  controllerAddress: Bytes,
  assetId: BigInt,
  eventTime: BigInt,
  vaultAmount: BigInt,
  tradeAmount: BigInt,
  vaultSqrtAmount: BigInt,
  tradeSqrtAmount: BigInt
): void {
  const openInterst = ensureOpenInterest(controllerAddress, assetId, eventTime)

  const nextPerpPosition = calculateOpenInterest(openInterst.longPerp, openInterst.shortPerp, vaultAmount, tradeAmount)
  const nextSqrtPosition = calculateOpenInterest(openInterst.longSquart, openInterst.shortSquart, vaultSqrtAmount, tradeSqrtAmount)

  openInterst.longPerp = nextPerpPosition.nextTotalLong
  openInterst.shortPerp = nextPerpPosition.nextTotalShort
  openInterst.longSquart = nextSqrtPosition.nextTotalLong
  openInterst.shortSquart = nextSqrtPosition.nextTotalShort

  openInterst.save()
}

function calculateOpenInterest(
  totalLong: BigInt,
  totalShort: BigInt,
  vaultAmount: BigInt,
  tradeAmount: BigInt
): NextOpenInterest {
  let nextTotalLong = BigInt.zero()
  let nextTotalShort = BigInt.zero()

  const openAndCloseAmounts = calculateOpenAndCloseAmounts(vaultAmount, tradeAmount)
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
    openAmount = tradeAmount;
  } else {
    if (vaultAmount.abs() >= tradeAmount.abs()) {
      closeAmount = tradeAmount;
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