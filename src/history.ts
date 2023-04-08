import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { LendingUserHistoryItem } from '../generated/schema'

export function createLendingDepositHistory(
  contractAddress: Bytes,
  assetId: BigInt,
  account: Bytes,
  txHash: string,
  logIndex: BigInt,
  assetAmount: BigInt,
  eventTime: BigInt
): void {
  createLendingHistory(
    contractAddress,
    assetId,
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
  account: Bytes,
  txHash: string,
  logIndex: BigInt,
  assetAmount: BigInt,
  eventTime: BigInt
): void {
  createLendingHistory(
    contractAddress,
    assetId,
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
  assetId: BigInt,
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
  historyItem.assetId = assetId
  historyItem.account = account
  historyItem.action = action
  historyItem.assetAmount = assetAmount
  historyItem.txHash = txHash
  historyItem.createdAt = eventTime

  historyItem.save()
}
