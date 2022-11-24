import {
  atendenteCaixa1,
  atendenteCaixa2,
  filaDeClientesNaMesa2,
  filaDeClientesNaMesa4,
  filaDeClientesNoBalcao,
  filaDeClientesNoCaixa1,
  filaDeClientesNoCaixa2,
  filaDePedidosEntrandoCozinha,
  scheduler,
} from ".";
import { Process } from "./Process";
import { Cozinha } from "./Cozinha";
import { Pedido } from "./Pedido";
import { FilaMesa } from "./FilaMesa";

export class Caixa extends Process {
  numCaixa;
  clienteSendoAtendidoNoCaixa;

  constructor(name, duration, numCaixa) {
    super(name, duration);
    this.numCaixa = numCaixa;
  }

  canExecute() {
    if (this.numCaixa === 1) {
      if (!filaDeClientesNoCaixa1.isEmpty() && atendenteCaixa1.canAllocate(1)) {
        return true;
      }
    } else {
      if (!filaDeClientesNoCaixa2.isEmpty() && atendenteCaixa2.canAllocate(1)) {
        return true;
      }
    }
    return false;
  }

  executeOnStart() {
    // se conseguir alocar um atendente, inicia o atendimento.
    if (this.numCaixa === 1) {
      scheduler.isDebbuger &&
        console.log(
          this.name + ": Iniciando atendimento no caixa " + this.numCaixa
        );
      atendenteCaixa1.allocate(1);
      scheduler.isDebbuger &&
        console.log(
          `Quantidade de atendentes existentes no CachierHandler1  --> atendenteCaixa1.quantity
          )} e em uso  atendenteCaixa1.used)} atendentes`
        );
      this.clienteSendoAtendidoNoCaixa = filaDeClientesNoCaixa1.remove();
    } else {
      atendenteCaixa2.allocate(1);
      scheduler.isDebbuger &&
        console.log(
          `Quantidade de atendentes existentes no CachierHandler2  --> atendenteCaixa2.quantity
          )} e em uso  atendenteCaixa2.used)} atendentes`
        );
      this.clienteSendoAtendidoNoCaixa = filaDeClientesNoCaixa2.remove();
    }
  }

  executeOnEnd() {
    // Cria pedido e inicia serviço da cozinha
    const cliente = this.clienteSendoAtendidoNoCaixa;
    filaDePedidosEntrandoCozinha.insert(
      scheduler.createEntity(new Pedido("Pedido", cliente.getId()))
    );

    scheduler.startProcessNow(
      scheduler.createProcess(
        new Cozinha("Cozinha", () => scheduler.normal(14, 5))
      )
    );

    // Roteamento dos clientes para a mesa corresponte
    const nomeCliente = cliente.getName();
    if (nomeCliente === "cliente1") {
      filaDeClientesNoBalcao.insert(this.clienteSendoAtendidoNoCaixa);
      scheduler.startProcessNow(
        scheduler.createProcess(new FilaMesa("FilaMesa-balcao", () => 1))
      );
    } else if (nomeCliente === "cliente2") {
      filaDeClientesNaMesa2.insert(this.clienteSendoAtendidoNoCaixa);
      scheduler.startProcessNow(
        scheduler.createProcess(new FilaMesa("FilaMesa-M2", () => 1))
      );
    } else {
      filaDeClientesNaMesa4.insert(this.clienteSendoAtendidoNoCaixa);
      scheduler.startProcessNow(
        scheduler.createProcess(new FilaMesa("FilaMesa-M4", () => 1))
      );
    }
    scheduler.isDebbuger && console.log(nomeCliente + " indo para mesa");

    // Libera atendente
    if (this.numCaixa === 1) {
      atendenteCaixa1.release(1);
    } else {
      atendenteCaixa2.release(1);
    }
  }
}
