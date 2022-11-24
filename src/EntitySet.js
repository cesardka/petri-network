import { scheduler } from ".";

export const Mode = {
  FIFO: "FIFO",
  LIFO: "LIFO",
  P_BASED: "P_BASED",
  NONE: "NONE", // if none, método remove() sorteia qual entidade será removida. Utilizar removeById(id)
};
export class EntitySet {
  constructor(name, mode, maxPossibleSize) {
    this.id = null;
    this.name = name;
    this.mode = mode;
    this.maxPossibleSize = maxPossibleSize;
    this.set = [];
    this.setSize = [];
    this.setTime = {};
    this.log = [];
    this.isRunningLog = false;
    this.timeGap = 0;
    this.lastLogTime = 0;
  }

  getId() {
    return this.id;
  }

  getMode() {
    return this.mode;
  }

  getEntitySet() {
    return this.set;
  }

  setMode(mode) {
    this.mode = mode;
  }

  setId(id) {
    this.id = id;
  }

  insert(entity) {
    if (this.isFull()) {
      console.error("EntitySet is full");
      return;
    }
    if (!entity.id) {
      console.error("Id not setted in entity");
      return;
    }

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.NONE:
        this.set.push(entity);
        break;
      case Mode.LIFO:
        this.set.unshift(entity);
        break;
      case Mode.P_BASED:
        if (entity.priority >= 0 && entity.priority <= 255) {
          this.set.push(entity);
          this.set.sort((a, b) => a.priority - b.priority);
        } else {
          console.error(
            `insert() priority based: Prioridade inválida (${entity.getPriority()}) na entidade com id = ${entity.getId()} `
          );
        }
        break;
      default:
    }

    this.setTime[entity.id] = {
      duration: 0,
      creation: scheduler.getTime(),
    };

    this.updateSetSize();
  }

  randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  remove() {
    let entityRemoved;

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.LIFO:
      case Mode.P_BASED:
        entityRemoved = this.set.shift();
        break;
      case Mode.NONE:
        const rand = this.randomInteger(0, this.set.length - 1);
        entityRemoved = this.removeById(this.set[rand].getId());
        break;
      default:
        console.log("Modo inválido");
    }

    scheduler.isDebbuger &&
      console.log(
        "remove-entitySet: Entity name --> ",
        entityRemoved?.getName(),
        "Entity id --> ",
        entityRemoved?.getId()
      );

    if (!entityRemoved || !entityRemoved.id) {
      console.error("Unable to remove Entity");
      return;
    }

    this.updateSetSize();

    const entityTime = this.setTime[entityRemoved.id];

    entityTime.duration = scheduler.getTime() - entityTime.creation;
    console.log(`entityRemoved.getName()`, entityRemoved.getName());
    console.log(`scheduler.getTime()`, scheduler.getTime());
    console.log(`entityTime.creation`, entityTime.creation);

    return entityRemoved;
  }

  removeById(id) {
    const index = this.set.findIndex((entity) => entity.id === id);
    const [removed] = this.set.splice(index, 1);

    if (!removed || !removed.id) {
      console.error("Unable to remove Entity");
      return null;
    }
    this.updateSetSize();

    const entityTime = this.setTime[removed.id];
    entityTime.duration = scheduler.getTime() - entityTime.creation;

    return removed;
  }

  updateSetSize() {
    this.setSize.push(this.set.length);
  }

  isEmpty() {
    return this.set.length === 0;
  }

  isFull() {
    if (this.maxPossibleSize === 0) {
      return false;
    }

    return this.set.length === this.maxPossibleSize;
  }

  findEntity(id) {
    return this.set.find((entity) => entity.id !== id);
  }

  // Coleta de estatísticas
  averageSize() {
    return this.setSize.reduce((a, b) => a + b, 0) / this.setSize.length;
  }

  getSize() {
    return this.set.length;
  }

  getMaxPossibleSize() {
    return this.maxPossibleSize;
  }

  setMaxPossibleSize(size) {
    this.maxPossibleSize = size;
  }

  calculateDurations() {
    let total = 0;
    let max = 0;

    const timeValues = Object.values(this.setTime).filter(
      (time) => time.duration !== 0
    );

    for (const time of timeValues) {
      total += time.duration;

      if (time.duration > max) {
        max = time.duration;
      }
    }
    const mean = timeValues.length > 0 ? total / timeValues.length : 0;
    return { mean, max };
  }

  averageTimeInSet() {
    return this.calculateDurations().mean;
  }

  maxTimeInSet() {
    return this.calculateDurations().max;
  }

  timeCallback(time) {
    if (this.isRunningLog && time - this.lastLogTime >= this.timeGap) {
      this.log.push({ time, size: this.set.length });
      this.lastLogTime = time;
    }
  }

  startLog(timeGap) {
    this.isRunningLog = true;
    this.timeGap = timeGap;
  }

  stopLog() {
    this.isRunningLog = false;
  }

  getLog() {
    return this.log;
  }
}
