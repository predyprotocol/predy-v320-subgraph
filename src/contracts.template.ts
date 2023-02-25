import { Address } from '@graphprotocol/graph-ts'
import { Controller } from '../generated/Controller/Controller'

export const controllerAddress: Address = Address.fromString(
  "{{Controller}}"
)

export const controllerContract = Controller.bind(controllerAddress)
