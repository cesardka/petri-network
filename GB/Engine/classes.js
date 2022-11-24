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
      // Acha a função na fila com menor tempo, executa e remove da FEL
      var toExecuteNow = this.fel.reduce(function (prev, curr) {
        return prev.time < curr.time ? prev : curr;
      });
      this.currentTime = toExecuteNow.time;
      this.fel.splice(this.fel.indexOf(toExecuteNow), 1);
      toExecuteNow.function.apply(null, toExecuteNow.params);
      console.log("------------ " + this.currentTime + "---------------\n");
    }, 1);
  }
}

module.export = {
  AppUtils,
  Arc,
  Entity,
  EntitySet,
  Event,
  PetriNet,
  Place,
  Resource,
  Scheduler,
  Transition,
};
