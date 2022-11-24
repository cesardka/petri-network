export class Resource {
  id;
  name;
  quantity;
  used;
  timeScheduler;
  timeAllocated;
  timeAllocationStart;
  qtdsAllocated;

  constructor(name, quantity, timeScheduler) {
    this.id = null;
    this.name = name;
    this.quantity = quantity;
    this.used = 0;
    this.timeScheduler = timeScheduler;
    this.timeAllocationStart = 0;
    this.timeAllocated = 0;
    this.qtdsAllocated = [];
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getQuantity() {
    return this.quantity;
  }

  getUsed() {
    return this.used;
  }

  canAllocate(quantity) {
    if (quantity <= this.quantity - this.used) {
      return true;
    }
    return false;
  }

  allocate(quantity) {
    if (this.canAllocate(quantity)) {
      this.used += quantity;
      this.timeAllocationStart = this.timeScheduler();
      this.qtdsAllocated.push(quantity);
    }
  }

  release(quantity) {
    if (quantity >= this.used) {
      this.used -= quantity;
      this.timeAllocated += this.timeScheduler() - this.timeAllocationStart;
      return true;
    }
    return false;
  }

  allocationRate(schedulerTime) {
    return this.timeAllocated / schedulerTime;
  }

  //quantidade média de recursos alocados em relação ao total de tempo
  averageAllocation() {
    return (
      this.qtdsAllocated.reduce((a, b) => a + b, 0) / this.qtdsAllocated.length
    );
  }
}
