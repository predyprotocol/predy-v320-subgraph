import { Address } from '@graphprotocol/graph-ts'
import { Controller } from '../generated/Controller/Controller'
import { GammaShortStrategy } from '../generated/GammaShortStrategy/GammaShortStrategy'

export const controllerAddress: Address = Address.fromString('{{Controller}}')
export const GammaShortStrategyAddress: Address = Address.fromString(
  '{{GammaShortStrategy}}'
)

export const controllerContract = Controller.bind(controllerAddress)
export const GammaShortStrategyContract = GammaShortStrategy.bind(
  GammaShortStrategyAddress
)
