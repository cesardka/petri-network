export class Process {
  name;
  id;
  duration;
  active;

  constructor(name, duration) {
    this.id = null;
    this.name = name;
    this.duration = duration;
    this.active = true;
  }

  getId() {
    return this.id;
  }

  getDuration() {
    return this.duration;
  }

  setId(id) {
    this.id = id;
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    this.active = active;
  }

  canExecute() {
    return true;
  }

  executeOnStart() {}

  executeOnEnd() {}
}
