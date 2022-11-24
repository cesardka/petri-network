import {
  Place,
  Transition,
  Arc,
  PetriNet,
  Entity,
  EntitySet,
  Resource,
  Scheduler,
} from "./classes.js";

function clienteEntraNoRestaurante() {
  currClientId++;
  let cliente = new Entity(
    "Cliente",
    Math.floor(Math.random() * 4) + 1,
    currClientId
  );
  clientesGerados[cliente.size - 1].push(cliente.uniqueId);

  var smallestQueueIndex = null;
  var firstAvailableRegister = atendentesCaixa.find((item, index) =>
    item.available(1)
  );

  if (firstAvailableRegister) {
    smallestQueueIndex = atendentesCaixa.indexOf(firstAvailableRegister);
  } else {
    filaCaixa
      .filter((x) => !x.isFull())
      .forEach(function (element, index) {
        if (index == 0) {
          smallestQueueIndex = index;
        } else if (element.size < filaCaixa[smallestQueueIndex].size) {
          smallestQueueIndex = index;
        }
      });
  }

  if (filaCaixa[smallestQueueIndex]) {
    if (
      filaCaixa[smallestQueueIndex].size == 0 &&
      atendentesCaixa[smallestQueueIndex].available(1)
    ) {
      gerenciador.scheduleNow(iniciaPagamento, [smallestQueueIndex, cliente]);
    } else {
      filaCaixa[smallestQueueIndex].insert(cliente);
    }
  }
}

function iniciaPagamento(index, cliente) {
  if (atendentesCaixa[index].available(1)) {
    atendentesCaixa[index].allocate(1);
    gerenciador.scheduleIn(
      finalizaPagamento,
      [index, cliente],
      utils.normal(8, 2)
    );
  }
}

function finalizaPagamento(index, client) {
  atendentesCaixa[index].release(1);
  if (filaCaixa[index].size > 0) {
    gerenciador.scheduleNow(iniciaPagamento, [
      index,
      filaCaixa[index].remove(),
    ]);
  }

  //Manda pedido para a cozinha
  if (filaPedidos.size == 0 && cozinheiro.available(1)) {
    gerenciador.scheduleNow(iniciaPreparoComida, [client]);
  } else {
    filaPedidos.insert(client);
  }

  //Define o destino do grupo baseado no Nº de pessoas
  if (client.size == 1) {
    if (filaBalcao.size == 0 && assentosBalcao.available(1)) {
      gerenciador.scheduleNow(goToBench, [client]);
    } else {
      filaTempoAguardandoBalcao.push({
        client: client,
        timeEnter: gerenciador.currentTime,
      });
      filaBalcao.insert(client);
    }
  } else if (client.size == 2) {
    if (filaMesas.size == 0 && mesasParaDois.available(1)) {
      gerenciador.scheduleNow(goToTable, [client]);
    } else {
      filaTempoEmMesa.push({
        client: client,
        timeEnter: gerenciador.currentTime,
      });
      filaMesas.insert(client);
    }
  } else {
    if (filaMesas.size == 0 && mesasParaQuatro.available(1)) {
      gerenciador.scheduleNow(goToTable, [client]);
    } else {
      filaTempoEmMesa.push({
        client: client,
        timeEnter: gerenciador.currentTime,
      });
      filaMesas.insert(client);
    }
  }
}

function iniciaPreparoComida(client) {
  if (cozinheiro.available(1)) {
    cozinheiro.allocate(1);
    gerenciador.scheduleIn(
      finalizaPreparoComida,
      [client],
      utils.normal(14, 5)
    );
  }
}

function finalizaPreparoComida(client) {
  cozinheiro.release(1);
  filaPedidosAguardandoEntrega.insert(client);
  gerenciador.scheduleNow(verificaClientesAguardando, []);
  totalClientes.pedidos++;

  if (filaPedidos.size > 0) {
    gerenciador.scheduleNow(iniciaPreparoComida, [filaPedidos.remove()]);
  }
}

function verificaClientesAguardando() {
  //Checa estado do garçom e atualiza
  if (garcom.petriNet.getState() == "Livre") {
    let isMaosGarcaoOcupadas = false;
    filaPedidosAguardandoEntrega.entityArray.forEach((item, index) => {
      if (!isMaosGarcaoOcupadas) {
        if (item.size == 1) {
          if (
            aguardandoNoBanco.entityArray.filter(
              (x) => x.uniqueId == item.uniqueId
            ).length > 0
          ) {
            gerenciador.scheduleNow(startBenchMeal, [
              filaPedidosAguardandoEntrega.remove(item),
            ]);
            aguardandoNoBanco.remove(item);
            isMaosGarcaoOcupadas = true;
            garcom.petriNet.places[2].setMarks(1);
            garcom.petriNet.runCycle();
            return;
          }
        } else if (item.size == 2) {
          if (
            aguardandoMesaParaDois.entityArray.filter(
              (x) => x.uniqueId == item.uniqueId
            ).length > 0
          ) {
            gerenciador.scheduleNow(startTableMeal, [
              filaPedidosAguardandoEntrega.remove(item),
            ]);
            aguardandoMesaParaDois.remove(item);
            isMaosGarcaoOcupadas = true;
            garcom.petriNet.places[2].setMarks(1);
            garcom.petriNet.runCycle();
            return;
          }
        } else {
          if (
            aguardandoMesaParaQuatro.entityArray.filter(
              (x) => x.uniqueId == item.uniqueId
            ).length > 0
          ) {
            gerenciador.scheduleNow(startTableMeal, [
              filaPedidosAguardandoEntrega.remove(item),
            ]);
            aguardandoMesaParaQuatro.remove(item);
            isMaosGarcaoOcupadas = true;
            garcom.petriNet.places[2].setMarks(1);
            garcom.petriNet.runCycle();
            return;
          }
        }
      }
    });
  }
}

function goToBench(cliente) {
  if (assentosBalcao.available(1)) {
    cliente = cliente || filaBalcao.remove();
    aguardandoNoBanco.insert(cliente);
    let item = filaTempoAguardandoBalcao.find(
      (x) => x.client.uniqueId == cliente.uniqueId
    );
    if (item) {
      item.totalTime = Number(gerenciador.currentTime) - Number(item.timeEnter);
    }
    assentosBalcao.allocate(1);
    gerenciador.scheduleNow(verificaClientesAguardando, []);
  }
}

function startBenchMeal(client) {
  garcom.petriNet.places[7].setMarks(1);
  garcom.petriNet.runCycle();
  gerenciador.scheduleIn(finishBenchMeal, [client], utils.normal(20, 8));
}

function finishBenchMeal(client) {
  assentosBalcao.release(1);
  totalClientes.bancos.push(client);
  if (filaBalcao.size > 0) {
    gerenciador.scheduleNow(goToBench, []);
  }
}

function goToTable(client) {
  client = client || filaMesas.entityArray[0];

  if (client) {
    if (client.size == 2) {
      if (mesasParaDois.available(1)) {
        mesasParaDois.allocate(1);
        aguardandoMesaParaDois.insert(client);
        let item = filaTempoEmMesa.find(
          (x) => x.client.uniqueId == client.uniqueId
        );
        if (item) {
          item.totalTime = gerenciador.currentTime - item.timeEnter;
        }
        filaMesas.remove(client);
      }
    } else {
      if (mesasParaQuatro.available(1)) {
        mesasParaQuatro.allocate(1);
        aguardandoMesaParaQuatro.insert(client);
        let item = filaTempoEmMesa.find(
          (x) => x.client.uniqueId == client.uniqueId
        );
        if (item) {
          item.totalTime = gerenciador.currentTime - item.timeEnter;
        }
        filaMesas.remove(client);
      }
    }
  }

  gerenciador.scheduleNow(verificaClientesAguardando, []);
}

function startTableMeal(client) {
  garcom.petriNet.places[7].setMarks(1);
  garcom.petriNet.runCycle();
  gerenciador.scheduleIn(finishTableMeal, [client], utils.normal(20, 8));
}

function finishTableMeal(client) {
  if (client.size == 2) {
    totalClientes.mesasParaDois.push(client);
    mesasParaDois.release(1);
    if (filaMesas.size > 0) {
      gerenciador.scheduleNow(goToTable, []);
    }
  } else {
    totalClientes.mesasPraQuatro.push(client);
    mesasParaQuatro.release(1);
    if (filaMesas.size > 0) {
      gerenciador.scheduleNow(goToTable, []);
    }
  }
  gerenciador.scheduleNow(verificaClientesAguardando, []);
}

function printEstadoFilas() {
  console.log("Fila Pedidos Cozinha:", gerenciador.currentTime, filaPedidos);
  console.log("Fila Bancada:", gerenciador.currentTime, filaBalcao);
  console.log("Fila Mesas:", gerenciador.currentTime, filaMesas);
}

// Instancia restaurante
let redeGarcom = new PetriNet("Garçom");
redeGarcom.places.push(new Place(0, "Livre"));
redeGarcom.places.push(new Place(1, "Substituir Caixa"));
redeGarcom.places.push(new Place(2, "Pedido Pronto"));
redeGarcom.places.push(new Place(3, "Cliente vai Sentar"));

redeGarcom.places.push(new Place(4, "No Caixa"));
redeGarcom.places.push(new Place(5, "Caixa Retornou"));

redeGarcom.places.push(new Place(6, "Levando Pedido"));
redeGarcom.places.push(new Place(7, "Pedido na Mesa"));

redeGarcom.places.push(new Place(8, "Higienizando"));
redeGarcom.places.push(new Place(9, "Mesa Higienizada"));

redeGarcom.transitions.push(new Transition(0));
redeGarcom.transitions.push(new Transition(1));
redeGarcom.transitions.push(new Transition(2));

redeGarcom.transitions.push(new Transition(3));
redeGarcom.transitions.push(new Transition(4));
redeGarcom.transitions.push(new Transition(5));

redeGarcom.arcs.push(new Arc("P0", "T0"));
redeGarcom.arcs.push(new Arc("P0", "T1"));
redeGarcom.arcs.push(new Arc("P0", "T2"));

redeGarcom.arcs.push(new Arc("P1", "T0"));
redeGarcom.arcs.push(new Arc("P2", "T1"));
redeGarcom.arcs.push(new Arc("P3", "T2"));

redeGarcom.arcs.push(new Arc("T0", "P4"));
redeGarcom.arcs.push(new Arc("T1", "P6"));
redeGarcom.arcs.push(new Arc("T2", "P8"));

redeGarcom.arcs.push(new Arc("P4", "T3"));
redeGarcom.arcs.push(new Arc("P5", "T3"));
redeGarcom.arcs.push(new Arc("P6", "T4"));
redeGarcom.arcs.push(new Arc("P7", "T4"));
redeGarcom.arcs.push(new Arc("P8", "T5"));
redeGarcom.arcs.push(new Arc("P9", "T5"));

redeGarcom.arcs.push(new Arc("T3", "P0"));
redeGarcom.arcs.push(new Arc("T4", "P0"));
redeGarcom.arcs.push(new Arc("T5", "P0"));
redeGarcom.places[0].setMarks(1);

redeGarcom.checkEnabledTransitions();

let clientesGerados = [[], [], [], []];
let totalClientes = {
  mesasPraQuatro: [],
  mesasParaDois: [],
  bancos: [],
  pedidos: 0,
};

let filaTempoAguardandoBalcao = [];
let filaTempoEmMesa = [];

let atendentesCaixa = [
  new Resource("Atendente Caixa 1", 1),
  new Resource("Atendente Caixa 2", 1),
];
let filaCaixa = [
  new EntitySet("Fila Caixa 1", 0, 1000),
  new EntitySet("Fila Caixa 2", 1, 1000),
];

let garcom = new Entity("Garçom", 1, 1, redeGarcom);

let cozinheiro = new Resource("Cozinheiro", 3);
let filaPedidos = new EntitySet("Fila Pedidos", 0, 1000);
let filaPedidosAguardandoEntrega = new EntitySet(
  "Pedidos Aguardando Entrega",
  0,
  1000
);

let assentosBalcao = new Resource("Assentos Balcão", 6);
let filaBalcao = new EntitySet("Fila Balcão", 0, 1000);

let mesasParaDois = new Resource("Mesas para 2 pessoas", 4);
let mesasParaQuatro = new Resource("Mesas para 4 pessoas", 4);
let filaMesas = new EntitySet("Fila Mesas", 0, 1000);

let aguardandoNoBanco = new EntitySet(
  "Esperando o pedido no balcão",
  0,
  assentosBalcao.maxQty
);
let aguardandoMesaParaDois = new EntitySet(
  "Esperando o pedido na mesa para 2 pessoas",
  0,
  mesasParaDois.maxQty
);
let aguardandoMesaParaQuatro = new EntitySet(
  "Esperando o pedido na mesa para 4 pessoas",
  0,
  mesasParaQuatro.maxQty
);

let gerenciador = new Scheduler();
let utils = new AppUtils();

let currClientId = 0;
let clientTime = 0;

// GERAR CLIENTE POR 3 HORAS
let geraClientesPorTempoExponencial = setInterval((tempoExponencial = 3) => {
  clientTime += utils.exponential(tempoExponencial);
  if (clientTime > 180) {
    clearInterval(geraClientes);
    return false;
  }
  gerenciador.scheduleAt(clienteEntraNoRestaurante, [], clientTime);
}, 1);

for (let i = 0; i < 1050; i += 50) {
  gerenciador.scheduleAt(printEstadoFilas, [], i);
}

gerenciador.simulate();
