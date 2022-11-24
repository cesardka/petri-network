import { randomInt } from "crypto-js";
import {
  atendenteCaixa1,
  atendenteCaixa2,
  filaDeClientesNoCaixa1,
  filaDeClientesNoCaixa2,
  scheduler,
} from "./index";
import { Entity } from "./Entity";
import { Process } from "./Process";
import { Caixa } from "./Caixa";

export class Cliente extends Process {
  numCaixaDestino = 0;

  executeOnEnd() {
    const cliente = "cliente" + randomInt(1, 5);

    if (
      filaDeClientesNoCaixa1.getSize() <= filaDeClientesNoCaixa2.getSize() &&
      atendenteCaixa1.getQuantity() - atendenteCaixa1.used <=
        atendenteCaixa2.getQuantity() - atendenteCaixa2.used
    ) {
      filaDeClientesNoCaixa1.insert(
        scheduler.createEntity(new Entity({ name: cliente }))
      );
      this.numCaixaDestino = 1;
    } else {
      filaDeClientesNoCaixa2.insert(
        scheduler.createEntity(new Entity({ name: cliente }))
      );
      this.numCaixaDestino = 2;
    }

    // Se auto agenda
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Cliente("Cliente", () => scheduler.exponential(3))
      )
    );

    // Inicia processo do caixa
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Caixa(
          "Caixa" + this.numCaixaDestino,
          () => scheduler.normal(8, 2),
          this.numCaixaDestino
        )
      )
    );
  }
}
