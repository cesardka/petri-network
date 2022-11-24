import { Entity } from "./Entity";

export class Pedido extends Entity {
  idCliente;

  constructor(name, idCliente) {
    super({ name: name });
    this.idCliente = idCliente;
  }

  getIdCliente() {
    return this.idCliente;
  }
}
