import { Entity } from './Entity'

export class Pedido extends Entity {
  idCliente: string

  constructor(name: string, idCliente: string) {
    super({ name: name })
    this.idCliente = idCliente
  }

  public getIdCliente() {
    return this.idCliente
  }
}
