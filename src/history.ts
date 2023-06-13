import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { LendingUserHistoryItem } from '../generated/schema'
import { toPairId } from './helper'

export function createLendingDepositHistory(
  contractAddress: Bytes,
  assetId: BigInt,
  isStable: boolean,
  account: Bytes,
  txHash: string,
  logIndex: BigInt,
  assetAmount: BigInt,
  eventTime: BigInt
): void {
  createLendingHistory(
    contractAddress,
    assetId,
    isStable,
    account,
    'DEPOSIT',
    txHash,
    logIndex,
    assetAmount,
    eventTime
  )
}

export function createLendingWithdrawHistory(
  contractAddress: Bytes,
  assetId: BigInt,
  isStable: boolean,
  account: Bytes,
  txHash: string,
  logIndex: BigInt,
  assetAmount: BigInt,
  eventTime: BigInt
): void {
  createLendingHistory(
    contractAddress,
    assetId,
    isStable,
    account,
    'WITHDRAW',
    txHash,
    logIndex,
    assetAmount,
    eventTime
  )
}

export function createLendingHistory(
  contractAddress: Bytes,
  pairId: BigInt,
  isStable: boolean,
  account: Bytes,
  action: string,
  txHash: string,
  logIndex: BigInt,
  assetAmount: BigInt,
  eventTime: BigInt
): void {
  const historyItem = new LendingUserHistoryItem(
    `${txHash}-${logIndex.toString()}`
  )

  historyItem.address = contractAddress
  historyItem.pairId = pairId
  historyItem.isStable = isStable
  historyItem.account = account
  historyItem.action = action
  historyItem.assetAmount = assetAmount
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}
