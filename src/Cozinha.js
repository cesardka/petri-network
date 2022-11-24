import {
  cozinheiros,
  filaDePedidosEntrandoCozinha,
  filaDePedidosEsperandoEntrega,
  scheduler,
} from "./index";
import { Process } from "./Process";

export class Cozinha extends Process {
  pedidoSendoPreparado;

  canExecute() {
    if (!filaDePedidosEntrandoCozinha.isEmpty() && cozinheiros.canAllocate(1)) {
      return true;
    }
    return false;
  }

  executeOnStart() {
    cozinheiros.allocate(1);
    scheduler.isDebbuger &&
      console.log(
        `Quantidade de cozinheiros existentes --> ${cozinheiros.quantity} cozinheiros`
      );
    this.pedidoSendoPreparado = filaDePedidosEntrandoCozinha.remove();
  }

  executeOnEnd() {
    filaDePedidosEsperandoEntrega.insert(this.pedidoSendoPreparado);
    cozinheiros.release(1);
    scheduler.isDebbuger &&
      console.log(
        `Fim do cozimento possui ${cozinheiros.quantity} e em uso estão ${cozinheiros.used}`
      );
  }
}
