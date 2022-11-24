import {
  filaDeClientesEsperandoPedidoNaMesa2,
  filaDeClientesEsperandoPedidoNaMesa4,
  filaDeClientesEsperandoPedidoNoBalcao,
  filaDePedidosEsperandoEntrega,
  scheduler,
  garcom,
} from "./index.js";
import { Process } from "./Process";
import { Garcom } from "./Garcom";

export class PedidoGarcom extends Process {
  mesa = "";

  searchOrder(clientesEsperandoMesa) {
    for (let cliente of clientesEsperandoMesa.getEntitySet()) {
      for (let pedido of filaDePedidosEsperandoEntrega.getEntitySet()) {
        let order = pedido;
        if (cliente.getId() == order.getIdCliente()) {
          filaDePedidosEsperandoEntrega.removeById(order.getId());
          scheduler.destroyEntity(order.getId());
          return true; // Pedido do cliente está pronto
        }
      }
    }
    return false; // Pedido do cliente não está pronto
  }

  canExecute() {
    if (!filaDePedidosEsperandoEntrega.isEmpty()) {
      if (this.name == "PedidoGarcom-balcao") {
        if (!this.searchOrder(filaDeClientesEsperandoPedidoNoBalcao)) {
          return false;
        }
        this.mesa = "balcao";
      } else if (this.name == "PedidoGarcom-M2") {
        if (!this.searchOrder(filaDeClientesEsperandoPedidoNaMesa2)) {
          return false;
        }
        this.mesa = "M2";
      } else {
        if (!this.searchOrder(filaDeClientesEsperandoPedidoNaMesa4)) {
          return false;
        }
        this.mesa = "M4";
      }
      return true;
    }
    return false;
  }

  executeOnStart() {
    garcom.petriNet?.getLugarByLabel("pedidoPronto")?.insereToken(1);
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Garcom(
          "Garcom-DeliverOrder-" + this.mesa,
          () => scheduler.uniform(1, 4),
          "levandoPedido"
        )
      )
    );
  }
}
