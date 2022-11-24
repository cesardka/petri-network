export class Entity {
  id;
  name;
  creationTime;
  destroyedTime;
  priority;
  petriNet;
  sets;

  constructor({ name, priority, petriNet }) {
    this.id = null;
    this.name = name;
    this.priority = priority || -1;
    this.petriNet = petriNet;
    this.creationTime = 0;
    this.destroyedTime = 0;
    this.sets = [];
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getPriority() {
    return this.priority;
  }

  getTimeSinceCreation(now) {
    return now - this.creationTime;
  }

  getSets() {
    return this.sets;
  }

  setSet(entitySet) {
    this.sets.push(entitySet);
  }

  setId(id) {
    this.id = id;
  }

  setPriority(priority) {
    this.priority = priority;
  }

  setCreationTime(time) {
    this.creationTime = time;
  }

  setDestroyedTime(time) {
    this.destroyedTime = time;
  }

  setPetriNet(petriNet) {
    this.petriNet = petriNet;
  }

  getPetriNet() {
    return this.petriNet;
  }
}
