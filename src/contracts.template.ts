import { Address } from '@graphprotocol/graph-ts'
import { PredyPool } from '../generated/PredyPool/PredyPool'

export const predyPoolAddress: Address = Address.fromString('{{PredyPool}}')

export const controllerContract = PredyPool.bind(predyPoolAddress)
