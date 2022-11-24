import { atendenteCaixa1, atendenteCaixa2, scheduler, garcom } from ".";
import { Process } from "./process";

export class Banheiro extends Process {
  constructor(name, duration) {
    super(name, duration);
  }

  canExecute() {
    const qtdAtendentesBanheiro =
      garcom.petriNet?.getLugarByLabel("substituirCaixa")?.getTokens() +
      garcom.petriNet?.getLugarByLabel("garcomNoCaixa")?.getTokens();

    if (
      qtdAtendentesBanheiro >=
      atendenteCaixa1.getQuantity() + atendenteCaixa2.getQuantity()
    ) {
      return false;
    }
    return true;
  }

  executeOnStart() {
    garcom.petriNet?.getLugarByLabel("substituirCaixa")?.insereToken(1);
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Garcom(
          "Garcom-Banheiro",
          () => scheduler.normal(4, 1),
          "garcomNoCaixa"
        )
      )
    );
  }

  executeOnEnd() {
    scheduler.startProcessNow(
      scheduler.createProcess(
        new Banheiro("Banheiro", () => scheduler.normal(15, 5))
      )
    );
  }
}