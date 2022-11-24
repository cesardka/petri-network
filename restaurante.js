class Place {
  constructor(index, desc) {
    this.name = "P" + index;
    this.marks = 0;
    this.description = desc;
  }

  setMarks(qty) {
    this.marks = Number(qty);
  }
}

class Transition {
  constructor(index) {
    this.name = "T" + index;
    this.isEnabled = false;
  }
}

class Arc {
  constructor(begin, end, weight) {
    this.begin = begin;
    this.end = end;
    this.weight = Number(weight || 1);
  }
}

class PetriNet {
  constructor(name) {
    this.name = name;
    this.places = [];
    this.transitions = [];
    this.arcs = [];
    this.haveEnabledTransitions = false;
    this.cycle = 0;
  }

  getState() {
    return this.places.find((x) => x.marks > 0).description;
  }

  // verifica se cada transição está habilitada.
  checkEnabledTransitions() {
    this.haveEnabledTransitions = false;
    this.transitions.forEach((tr) => {
      let inputArcs = this.arcs.filter((x) => x.end == tr.name);
      inputArcs.forEach((arc) => {
        let currentPlace = this.places.find((x) => x.name == arc.begin);
        if (currentPlace.marks >= arc.weight) {
          tr.isEnabled = true;
          this.haveEnabledTransitions = true;
        } else {
          tr.isEnabled = false;
        }
      });
    });
    return this.transitions;
  }

  runCycle() {
    this.checkEnabledTransitions();
    if (this.haveEnabledTransitions) {
      //se for o ciclo 0, apenas verifica as transições habilitadas
      this.transitions.forEach((tr) => {
        if (tr.isEnabled) {
          let inputArcs = this.arcs.filter((x) => x.end == tr.name);
          //se a transição está habiltada, subtrai o valor das marcas do lugar de entrada
          inputArcs.forEach((arc) => {
            let currentPlace = this.places.find((x) => x.name == arc.begin);
            currentPlace.marks -= arc.weight;
          });
          let outputArcs = this.arcs.filter((x) => x.begin == tr.name);
          //distribui as marcas para os lugares de acordo com o peso dos arcos de saída
          outputArcs.forEach((arc) => {
            let currentPlace = this.places.find((x) => x.name == arc.end);
            currentPlace.marks += arc.weight;
          });
        }
      });
      this.checkEnabledTransitions();
      this.cycle++;
      return this.getState();
    }
    return "Nope";
  }
}

class AppUtils {
  exponential(rate, randomUniform) {
    rate = rate || 1;

    var U = randomUniform;
    if (typeof randomUniform === "function") U = randomUniform();
    if (!U) U = Math.random();
    return Number(-Math.log(U) / rate);
  }

  normal(meanValue, stdDeviationValue) {
    var y2;
    var use_last = false;
    var y1;
    if (use_last) {
      y1 = y2;
      use_last = false;
    } else {
      var x1, x2, w;
      do {
        x1 = 2.0 * Math.random() - 1.0;
        x2 = 2.0 * Math.random() - 1.0;
        w = x1 * x1 + x2 * x2;
      } while (w >= 1.0);
      w = Math.sqrt((-2.0 * Math.log(w)) / w);
      y1 = x1 * w;
      y2 = x2 * w;
      use_last = true;
    }
    var retval = meanValue + stdDeviationValue * y1;
    if (retval > 0) return Number(retval);
    return Number(-retval);
  }
}

class Entity {
  constructor(name, size, id, petri) {
    this.name = name;
    this.petriNet = petri;
    this.size = size || 1;
    this.uniqueId = id;
  }
}

class Event {
  constructor(name, eventId) {
    this.name = name;
    this.id = eventId;
  }
}

class EntitySet {
  constructor(name, setId, maxSize) {
    this.name = name;
    this.id = setId;
    this.size = 0;
    this.mode = "FIFO";
    this.maxPossibleSize = maxSize;
    this.entityArray = [];
  }

  isEmpty() {
    return this.size == 0;
  }

  isFull() {
    return this.size == this.maxPossibleSize;
  }

  insert(entity) {
    if (this.maxPossibleSize > this.size) {
      this.entityArray.push(entity);
      this.size++;
      return true;
    }
    return false;
  }

  remove(item) {
    if (this.size > 0) {
      let toRemove;
      if (!item) {
        if ((this.mode = "FIFO")) {
          toRemove = this.entityArray[0];
          this.entityArray.shift();
        }
      } else {
        toRemove = item;
        this.entityArray = this.entityArray.filter(
          (x) => x.uniqueId !== toRemove.uniqueId
        );
      }
      this.size--;
      return toRemove;
    }
    return false;
  }
}

class Resource {
  constructor(name, max) {
    this.name = name;
    this.maxQty = max;
    this.availableQty = max;
  }

  available(qty) {
    return this.availableQty >= qty;
  }

  allocate(qty) {
    if (this.availableQty >= qty) {
      this.availableQty -= qty;
      return true;
    }
    return false;
  }

  release(qty) {
    if (this.availableQty + qty <= this.maxQty) {
      this.availableQty += qty;
      return true;
    }
    return false;
  }
}

class Scheduler {
  constructor() {
    this.currentTime = 0;
    this.fel = [];
  }

  scheduleNow(event, params) {
    this.fel.push({
      time: this.currentTime,
      function: event,
      params: params,
    });
  }

  scheduleIn(event, params, timeToEvent) {
    this.fel.push({
      time: this.currentTime + timeToEvent,
      function: event,
      params: params,
    });
  }

  scheduleAt(event, params, absoluteTime) {
    this.fel.push({
      time: absoluteTime,
      function: event,
      params: params,
    });
  }

  simulate() {
    var executionLoop = setInterval(() => {
      if (this.fel.length < 1) {
        console.log("Execução Finalizada");
        console.log("Tempo total de execução:", this.currentTime);
        console.log(
          "Média de tempo na fila de mesas",
          timeInTablesQueue.reduce((a, b) => a + (b.totalTime || 0), 0) /
            timeInTablesQueue.length
        );
        console.log(
          "Média de tempo na fila da bancada",
          timeInBenchQueue.reduce((a, b) => a + (b.totalTime || 0), 0) /
            timeInBenchQueue.length
        );
        console.log("Total de Clientes:", totalClients);

        debugger;
        clearInterval(executionLoop);
        return false;
      }

      // console.log("FEL:", this.fel);
      // Acha a função na fila com menor time, executa e remove da FEL
      var toExecuteNow = this.fel.reduce(function (prev, curr) {
        return prev.time < curr.time ? prev : curr;
      });
      this.currentTime = toExecuteNow.time;
      this.fel.splice(this.fel.indexOf(toExecuteNow), 1);
      toExecuteNow.function.apply(null, toExecuteNow.params);
      // console.log("------------ "+this.currentTime+"---------------\n");
    }, 1);
  }
}

function clientArrival() {
  currClientId++;
  let client = new Entity(
    "Cliente",
    Math.floor(Math.random() * 4) + 1,
    currClientId
  );
  generatedClients[client.size - 1].push(client.uniqueId);

  var smallestQueueIndex = null;
  var firstAvailableRegister = registerers.find((item, index) =>
    item.available(1)
  );

  if (firstAvailableRegister) {
    smallestQueueIndex = registerers.indexOf(firstAvailableRegister);
  } else {
    registerQueues
      .filter((x) => !x.isFull())
      .forEach(function (element, index) {
        if (index == 0) {
          smallestQueueIndex = index;
        } else if (element.size < registerQueues[smallestQueueIndex].size) {
          smallestQueueIndex = index;
        }
      });
  }

  if (registerQueues[smallestQueueIndex]) {
    if (
      registerQueues[smallestQueueIndex].size == 0 &&
      registerers[smallestQueueIndex].available(1)
    ) {
      scheduller.scheduleNow(startPayment, [smallestQueueIndex, client]);
    } else {
      registerQueues[smallestQueueIndex].insert(client);
    }
  }
}

function startPayment(index, client) {
  if (registerers[index].available(1)) {
    registerers[index].allocate(1);
    scheduller.scheduleIn(finishPayment, [index, client], utils.normal(8, 2));
  }
}

function finishPayment(index, client) {
  registerers[index].release(1);
  if (registerQueues[index].size > 0) {
    scheduller.scheduleNow(startPayment, [
      index,
      registerQueues[index].remove(),
    ]);
  }

  //Manda pedido para a cozinha
  if (orderQueue.size == 0 && cooker.available(1)) {
    scheduller.scheduleNow(startCooking, [client]);
  } else {
    orderQueue.insert(client);
  }

  //Define o destino do grupo baseado no Nº de pessoas
  if (client.size == 1) {
    if (benchQueue.size == 0 && benchs.available(1)) {
      scheduller.scheduleNow(goToBench, [client]);
    } else {
      timeInBenchQueue.push({
        client: client,
        timeEnter: scheduller.currentTime,
      });
      benchQueue.insert(client);
    }
  } else if (client.size == 2) {
    if (tablesQueue.size == 0 && tablesForTwo.available(1)) {
      scheduller.scheduleNow(goToTable, [client]);
    } else {
      timeInTablesQueue.push({
        client: client,
        timeEnter: scheduller.currentTime,
      });
      tablesQueue.insert(client);
    }
  } else {
    if (tablesQueue.size == 0 && tablesForFour.available(1)) {
      scheduller.scheduleNow(goToTable, [client]);
    } else {
      timeInTablesQueue.push({
        client: client,
        timeEnter: scheduller.currentTime,
      });
      tablesQueue.insert(client);
    }
  }
}

function startCooking(client) {
  if (cooker.available(1)) {
    cooker.allocate(1);
    scheduller.scheduleIn(finishCooking, [client], utils.normal(14, 5));
  }
}

function finishCooking(client) {
  cooker.release(1);
  readyOrdersQueue.insert(client);
  scheduller.scheduleNow(checkWaitingClients, []);
  totalClients.orders++;

  if (orderQueue.size > 0) {
    scheduller.scheduleNow(startCooking, [orderQueue.remove()]);
  }
}

function checkWaitingClients() {
  //Checa estado do garçom e atualiza
  if (waiter.petriNet.getState() == "Livre") {
    let waiterHandsFull = false;
    readyOrdersQueue.entityArray.forEach((item, index) => {
      if (!waiterHandsFull) {
        if (item.size == 1) {
          if (
            waitingOnBench.entityArray.filter(
              (x) => x.uniqueId == item.uniqueId
            ).length > 0
          ) {
            scheduller.scheduleNow(startBenchMeal, [
              readyOrdersQueue.remove(item),
            ]);
            waitingOnBench.remove(item);
            waiterHandsFull = true;
            waiter.petriNet.places[2].setMarks(1);
            waiter.petriNet.runCycle();
            return;
          }
        } else if (item.size == 2) {
          if (
            waitingOnT2.entityArray.filter((x) => x.uniqueId == item.uniqueId)
              .length > 0
          ) {
            scheduller.scheduleNow(startTableMeal, [
              readyOrdersQueue.remove(item),
            ]);
            waitingOnT2.remove(item);
            waiterHandsFull = true;
            waiter.petriNet.places[2].setMarks(1);
            waiter.petriNet.runCycle();
            return;
          }
        } else {
          if (
            waitingOnT4.entityArray.filter((x) => x.uniqueId == item.uniqueId)
              .length > 0
          ) {
            scheduller.scheduleNow(startTableMeal, [
              readyOrdersQueue.remove(item),
            ]);
            waitingOnT4.remove(item);
            waiterHandsFull = true;
            waiter.petriNet.places[2].setMarks(1);
            waiter.petriNet.runCycle();
            return;
          }
        }
      }
    });
  }
}

function goToBench(client) {
  if (benchs.available(1)) {
    client = client || benchQueue.remove();
    waitingOnBench.insert(client);
    let item = timeInBenchQueue.find(
      (x) => x.client.uniqueId == client.uniqueId
    );
    if (item) {
      item.totalTime = Number(scheduller.currentTime) - Number(item.timeEnter);
    }
    benchs.allocate(1);
    scheduller.scheduleNow(checkWaitingClients, []);
  }
}

function startBenchMeal(client) {
  waiter.petriNet.places[7].setMarks(1);
  waiter.petriNet.runCycle();
  scheduller.scheduleIn(finishBenchMeal, [client], utils.normal(20, 8));
}

function finishBenchMeal(client) {
  benchs.release(1);
  totalClients.benchs.push(client);
  if (benchQueue.size > 0) {
    scheduller.scheduleNow(goToBench, []);
  }
}

function goToTable(client) {
  client = client || tablesQueue.entityArray[0];

  if (client) {
    if (client.size == 2) {
      if (tablesForTwo.available(1)) {
        tablesForTwo.allocate(1);
        waitingOnT2.insert(client);
        let item = timeInTablesQueue.find(
          (x) => x.client.uniqueId == client.uniqueId
        );
        if (item) {
          item.totalTime = scheduller.currentTime - item.timeEnter;
        }
        tablesQueue.remove(client);
      }
    } else {
      if (tablesForFour.available(1)) {
        tablesForFour.allocate(1);
        waitingOnT4.insert(client);
        let item = timeInTablesQueue.find(
          (x) => x.client.uniqueId == client.uniqueId
        );
        if (item) {
          item.totalTime = scheduller.currentTime - item.timeEnter;
        }
        tablesQueue.remove(client);
      }
    }
  }

  scheduller.scheduleNow(checkWaitingClients, []);
}

function startTableMeal(client) {
  waiter.petriNet.places[7].setMarks(1);
  waiter.petriNet.runCycle();
  scheduller.scheduleIn(finishTableMeal, [client], utils.normal(20, 8));
}

function finishTableMeal(client) {
  if (client.size == 2) {
    totalClients.tablesForTwo.push(client);
    tablesForTwo.release(1);
    if (tablesQueue.size > 0) {
      scheduller.scheduleNow(goToTable, []);
    }
  } else {
    totalClients.tablesForFour.push(client);
    tablesForFour.release(1);
    if (tablesQueue.size > 0) {
      scheduller.scheduleNow(goToTable, []);
    }
  }
  scheduller.scheduleNow(checkWaitingClients, []);
}

function printQueues() {
  console.log("Fila Pedidos Cozinha:", scheduller.currentTime, orderQueue);
  console.log("Fila Bancada:", scheduller.currentTime, benchQueue);
  console.log("Fila Mesas:", scheduller.currentTime, tablesQueue);
}

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

let generatedClients = [[], [], [], []];
let totalClients = {
  tablesForFour: [],
  tablesForTwo: [],
  benchs: [],
  orders: 0,
};

let timeInBenchQueue = [];
let timeInTablesQueue = [];

let registerers = [
  new Resource("Atendente Caixa 1", 1),
  new Resource("Atendente Caixa 2", 1),
];
let registerQueues = [
  new EntitySet("Fila Caixa 1", 0, 1000),
  new EntitySet("Fila Caixa 2", 1, 1000),
];

let waiter = new Entity("Garçom", 1, 1, redeGarcom);

let cooker = new Resource("Cozinheiro", 3);
let orderQueue = new EntitySet("Fila Pedidos", 0, 1000);
let readyOrdersQueue = new EntitySet("Pedidos Aguardando Entrega", 0, 1000);

let benchs = new Resource("Banco Balcão", 6);
let benchQueue = new EntitySet("Fila Balcão", 0, 1000);

let tablesForTwo = new Resource("Mesas para 2 pessoas", 4);
let tablesForFour = new Resource("Mesas para 4 pessoas", 4);
let tablesQueue = new EntitySet("Fila Mesas", 0, 1000);

let waitingOnBench = new EntitySet(
  "Esperando o pedido no balcão",
  0,
  benchs.maxQty
);
let waitingOnT2 = new EntitySet(
  "Esperando o pedido na mesa para 2 pessoas",
  0,
  tablesForTwo.maxQty
);
let waitingOnT4 = new EntitySet(
  "Esperando o pedido na mesa para 4 pessoas",
  0,
  tablesForFour.maxQty
);

let scheduller = new Scheduler();
let utils = new AppUtils();

let currClientId = 0;
let clientTime = 0;

//GERAR CLIENTE POR 3 HORAS
let generateClients = setInterval(() => {
  clientTime += utils.exponential(3);
  if (clientTime > 180) {
    clearInterval(generateClients);
    return false;
  }
  scheduller.scheduleAt(clientArrival, [], clientTime);
}, 1);

for (let index = 0; index < 1050; index += 50) {
  scheduller.scheduleAt(printQueues, [], index);
}

scheduller.simulate();
