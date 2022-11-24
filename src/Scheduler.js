import { RandVarGen } from "random-variate-generators";
import { v4 as uuid } from "uuid";
import promptSync from "prompts";
import {
  cozinheiros,
  filaDeClientesComendoNaMesa2,
  filaDeClientesComendoNaMesa4,
  filaDeClientesComendoNoBalcao,
  filaDeClientesNaMesa2,
  filaDeClientesNaMesa4,
  filaDeClientesNoBalcao,
  filaDeClientesNoCaixa1,
  filaDeClientesNoCaixa2,
  filaDePedidosEntrandoCozinha,
  filaDePedidosEsperandoEntrega,
  filaDePedidosSendoPreparados,
} from ".";

const rvg = new RandVarGen();

const prompts = promptSync({ sigint: true });

export class Scheduler {
  time;
  processSchedule = {};
  entityListy = [];
  resourceList = [];
  processList = [];
  entitySetList = [];
  destroyedEntitiesy = [];
  maxActiveEntities = 0;
  isDebbuger = false;
  executeSimulateOneStep = false;

  constructor(initialTime = 0) {
    this.time = initialTime;
  }

  getTime() {
    return this.time;
  }

  // => Disparo de eventos e processos
  startProcessNow(process) {
    this.isDebbuger && console.log("startProcessNow, com id:", process.getId());
    this.startProcessAt(process, this.time);
  }

  startProcessIn(process, timeToStart) {
    this.isDebbuger &&
      console.log(
        `startProcessIn, com id ${process.getId()} e timeToStart: ${timeToStart}`
      );
    this.startProcessAt(process, this.time + timeToStart);
  }

  startProcessAt(engineProcess, absoluteTime) {
    this.isDebbuger &&
      console.log(
        `startProcessAt, com id ${engineProcess.getId()} e absoluteTime: ${absoluteTime}`
      );

    if (this.processSchedule[absoluteTime]) {
      this.processSchedule = {
        ...this.processSchedule,
        [absoluteTime]: [
          ...this.processSchedule[absoluteTime],
          { engineProcess, type: "start" },
        ],
      };
    } else {
      this.processSchedule = {
        ...this.processSchedule,
        [absoluteTime]: [{ engineProcess, type: "start" }],
      };
    }
  }

  async waitFor(time) {
    return new Promise((resolve) => setTimeout(resolve, time * 1000));
  }

  // =>Controlando tempo de execução
  isProcessScheduleEmpty() {
    for (const processList of Object.values(this.processSchedule)) {
      if (processList.length !== 0) return false;
    }
    return true;
  }

  sorter = (a, b) => {
    let numA = Number(a);
    let numB = Number(b);
    if (numA < numB) {
      return -1;
    } else if (numA > numB) {
      return 1;
    }
    return 0;
  };

  async executeSimulation() {
    // Atualiza o tempo do modelo pro tempo atual do processo
    const nextTime = this.getNextTime();

    if (nextTime !== this.time) {
      this.entitySetList.forEach((entitySet) =>
        entitySet.timeCallback(nextTime)
      );
    }

    this.time = nextTime;
    console.log("Tempo atual: " + this.time);

    // Varre os processos do tempo "time"
    while (this.processSchedule[this.time].length > 0) {
      if (this.isDebbuger) {
        const continueResult = prompts(
          '\nDigite enter para continuar e "N" para encerrar \n'
        );

        if (continueResult.toUpperCase() === "N") {
          console.log("Encerrando execução...");
          this.executeSimulateOneStep = false;
          return;
        }
      }

      // Remove o primeiro processo do array
      const { engineProcess, type } = this.processSchedule[this.time].shift();
      // const [{ engineProcess, type }] = processes.splice(0, 1)

      // Valida se é o ínicio ou fim da execução do processo
      if (type === "start") {
        if (!engineProcess.canExecute()) {
          this.isDebbuger &&
            console.log(
              `\tSem recursos para executar processo: --> Process ${
                engineProcess.name
              } com id ${engineProcess.getId()} e tempo: ${this.time}`
            );

          // Reagenda o início do processo baseado no tempo de duração dele
          if (this.processSchedule[this.time + 1]) {
            this.processSchedule[this.time + 1] = [
              ...this.processSchedule[this.time + 1],
              { engineProcess, type: "start" },
            ];
          } else {
            this.processSchedule[this.time + 1] = [
              { engineProcess, type: "start" },
            ];
          }
          continue;
        }

        engineProcess.executeOnStart();
        const duration = engineProcess?.duration() || this.time;

        this.isDebbuger &&
          console.log(
            `\t"ExecuteOnStart(): --> Process ${
              engineProcess.name
            } com id ${engineProcess.getId()}
            )} e tempo: ${this.time}`
          );

        const endTime = this.time + duration;
        // Reagenda o fim do processo baseado no tempo de duração dele
        if (this.processSchedule[endTime]) {
          this.processSchedule[endTime] = [
            ...this.processSchedule[endTime],
            { engineProcess, type: "end" },
          ];
        } else {
          this.processSchedule[endTime] = [{ engineProcess, type: "end" }];
        }
      } else {
        engineProcess.executeOnEnd();

        this.isDebbuger &&
          console.log(
            `\t"ExecuteOnEnd():")}  --> Process 
              {engineProcess.name}
            )} com id 
             ${engineProcess.getId()}
            )} e tempo:  ${this.time}`
          );
      }

      const sortedSchedule = Object.keys(this.processSchedule).sort(
        this.sorter
      );

      // Tabela com todas informações dos processos (nome, ID e type)
      const printSchedule = sortedSchedule.map((key) => {
        const elements = this.processSchedule[key];

        let line = `${key} -> [`;

        for (const element of elements) {
          line += `{ ${element.engineProcess.name} | ${element.engineProcess.id} | Type: ${element.type} } | `;
        }

        return line + " ]";
      });
      console.log("processSchedule --> ", printSchedule);
    }

    // após processar todos dentro do tempo "time" remove a chave da estrutura
    // para na próxima iteração pegar os processos do próximo tempo
    if (Object.values(this.processSchedule[this.time]).length === 0) {
      delete this.processSchedule[this.time];
    }
  }

  simulate() {
    while (!this.isProcessScheduleEmpty()) {
      this.executeSimulation();
    }
    this.showSummary();
    process.exit(0);
  }

  simulateOneStep() {
    this.isDebbuger = true;
    this.executeSimulateOneStep = true;
    while (this.executeSimulateOneStep) {
      this.executeSimulation();
    }
    this.isDebbuger = false;
    this.showSummary();
    process.exit(0);
  }

  simulateBy(duration) {
    const finalTime = duration + this.time;
    this.simulateUntil(finalTime);
    process.exit(0);
  }

  simulateUntil(absoluteTime) {
    while (true) {
      if (this.getNextTime() > absoluteTime) break;
      this.executeSimulation();
    }
    this.showSummary();
    process.exit(0);
  }

  // => criação, destruição e acesso para componentes
  createEntity(entity) {
    entity.setId(uuid());
    entity.setCreationTime(this.time);
    this.isDebbuger &&
      console.log(
        `createEntity, com id ${entity.getId()} e creationTime ${this.time}`
      );
    this.entityList.push(entity);

    if (this.maxActiveEntities < this.entityList.length) {
      this.maxActiveEntities = this.entityList.length;
    }

    return entity;
  }

  destroyEntity(id) {
    this.isDebbuger && console.log(`destroyEntity, com id ${id}`);
    const entityIndex = this.entityList.findIndex((entity) => entity.id === id);
    const [detroyedEntity] = this.entityList.splice(entityIndex, 1);
    detroyedEntity?.setDestroyedTime(this.time);
    this.destroyedEntities.push(detroyedEntity);
  }

  getEntity(id) {
    const entity = this.entityList.find((entity) => entity.getId() === id);

    if (!entity) {
      console.error(`getEntity: entity com ID ${id} não existe`);
    }

    this.isDebbuger && console.log(`getEntity, com id ${id}`);

    return entity;
  }

  createResource(resource) {
    resource.setId(uuid());
    this.resourceList.push(resource);
    this.isDebbuger &&
      console.log(`createResource, com id ${resource.getId()}`);
    return resource;
  }

  getResource(id) {
    const resource = this.resourceList.find(
      (resource) => resource.getId() === id
    );

    if (!resource) {
      console.error(`getResource: resource com ID ${id} não existe`);
    }

    this.isDebbuger && console.log(`getResource, com id ${id}`);
    return resource;
  }

  createProcess(process) {
    process.setId(uuid());
    this.processList.push(process);
    this.isDebbuger && console.log(`createProcess, com id ${process.getId()}`);
    return process;
  }

  getProcess(processId) {
    const process = this.processList.find(
      (process) => process.getId() === processId
    );

    if (!process) {
      console.error(`getProcess: Processo com ID ${processId} não existe`);
    }

    this.isDebbuger && console.log(`getProcess, com id ${processId}`);

    return process;
  }

  createEntitySet(entitySet) {
    entitySet.setId(uuid());
    this.entitySetList.push(entitySet);
    this.isDebbuger &&
      console.log(`createEntitySet, com id ${entitySet.getId()}`);
    return entitySet;
  }

  getEntitySet(id) {
    const entitySet = this.entitySetList.find(
      (entitySet) => entitySet.getId() === id
    );

    if (!entitySet) {
      console.error(`getEntitySet com ID ${id} não existe`);
    }

    this.isDebbuger && console.log(`getEntitySet, com id ${id}`);

    return entitySet;
  }

  uniform(minValue, maxValue) {
    const uniformResult = rvg.uniform(minValue, maxValue);
    this.isDebbuger &&
      console.log(
        `Calculou uniform com minValue = ${minValue}, maxValue = ${maxValue}, e resultado = ${uniformResult}`
      );
    return uniformResult;
  }

  exponential(meanValue) {
    const expoResult = rvg.exponential(meanValue);
    this.isDebbuger &&
      console.log(
        `Calculou exponencial com meanValue = ${meanValue} e resultado = ${expoResult}`
      );
    return expoResult;
  }

  normal(meanValue, stdDeviationValue) {
    let normalResult = rvg.normal(meanValue, stdDeviationValue);
    while (normalResult < 0) {
      normalResult = rvg.normal(meanValue, stdDeviationValue);
    }
    this.isDebbuger &&
      console.log(
        `Calculou normal com meanValue = ${meanValue}, stdDeviationValue = ${stdDeviationValue} e resultado = ${normalResult}`
      );
    return normalResult;
  }

  // =>coleta de estatísticas
  getEntityTotalQuantity() {
    return this.entityList.length + this.destroyedEntities.length;
  }

  getActiveEntityTotalQuantity() {
    return this.entityList.length;
  }

  getDestroyedEntityTotalQuantity() {
    return this.destroyedEntities.length;
  }

  getEntityTotalQuantityByName(name) {
    return this.entityList.filter((entity) => entity.name === name).length;
  }

  averageTimeInModel() {
    let total = 0;
    for (const entity of this.destroyedEntities) {
      total += entity.destroyedTime - entity.creationTime;
    }

    return total / (this.destroyedEntities.length || 1);
  }

  maxEntitiesPresent() {
    return this.maxActiveEntities;
  }

  getNextTime() {
    return Object.keys(this.processSchedule)
      .map(parseFloat)
      .sort((a, b) => a - b)[0];
  }

  getTotalDuration() {
    return this.time - this.initialTime;
  }

  showSummary() {
    console.log("\n------ RESUMO DA EXECUÇÃO ------\n");
    console.log("Tempo total :", this.getTotalDuration());
    console.log("Total de entidades criadas: ", this.getEntityTotalQuantity());
    console.log(
      "Total de entidades ativas: ",
      this.getActiveEntityTotalQuantity()
    );
    console.log(
      "Total de entidades destruídas: ",
      this.getDestroyedEntityTotalQuantity()
    );
    console.log(
      "Tempo médio das entidades no modelo: ",
      this.averageTimeInModel()
    );
    console.log(
      "Número máximo de entidades no modelo: ",
      this.maxEntitiesPresent()
    );

    console.log("Fila Caixa 1:", filaDeClientesNoCaixa1.getLog());
    console.log(
      "Tempo médio na Fila Caixa 1:",
      filaDeClientesNoCaixa1.averageTimeInSet()
    );
    console.log("Fila Caixa 2:", filaDeClientesNoCaixa2.getLog());
    console.log(
      "Pedidos entrando na cozinha:",
      filaDePedidosEntrandoCozinha.getLog()
    );
    console.log(
      "Tempo médio pedidos entrando na cozinha:",
      filaDePedidosEntrandoCozinha.averageTimeInSet()
    );
    console.log(
      "Pedidos sendo preparados:",
      filaDePedidosSendoPreparados.getLog()
    );
    console.log(
      "Pedidos esperando entrega:",
      filaDePedidosEsperandoEntrega.getLog()
    );
    console.log(
      `${cozinheiros.getUsed()} de ${cozinheiros.getQuantity()} cozinheiros trabalhando`
    );
    console.log(
      "de clientes na fila do balcão: ",
      filaDeClientesNoBalcao.getLog()
    );
    console.log(
      "de clientes na fila da mesa de 2 lugares: ",
      filaDeClientesNaMesa2.getLog()
    );
    console.log(
      "de clientes na fila da mesa de 4 lugares: ",
      filaDeClientesNaMesa4.getLog()
    );
    console.log(
      "de clientes comendo no balcão: ",
      filaDeClientesComendoNoBalcao.getLog()
    );
    console.log(
      "de clientes comendo na mesa de 2 lugares: ",
      filaDeClientesComendoNaMesa2.getLog()
    );
    console.log(
      "de clientes comendo na mesa de 4 lugares: ",
      filaDeClientesComendoNaMesa4.getLog()
    );
  }
}
