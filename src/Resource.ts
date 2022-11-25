export class Resource {
  id: string | null
  name: string
  quantity: number
  used: number
  timeScheduler: () => number

  timeAllocated: number
  timeAllocationStart: number

  qtdsAllocated: number[]

  constructor(name: string, quantity: number, timeScheduler: () => number) {
    this.id = null
    this.name = name
    this.quantity = quantity
    this.used = 0
    this.timeScheduler = timeScheduler
    this.timeAllocationStart = 0
    this.timeAllocated = 0
    this.qtdsAllocated = []
  }

  public getId() {
    return this.id
  }

  public setId(id: string): void {
    this.id = id
  }

  public getQuantity() {
    return this.quantity
  }

  public getUsed() {
    return this.used
  }

  public canAllocate(quantity: number) {
    if (quantity <= this.quantity - this.used) {
      return true
    }
    return false
  }

  public allocate(quantity: number): void {
    if (this.canAllocate(quantity)) {
      this.used += quantity
      this.timeAllocationStart = this.timeScheduler()
      this.qtdsAllocated.push(quantity)
    }
  }

  public release(quantity: number) {
    if (quantity >= this.used) {
      this.used -= quantity
      this.timeAllocated += this.timeScheduler() - this.timeAllocationStart
      return true
    }
    return false
  }

  public allocationRate(schedulerTime: number) {
    return this.timeAllocated / schedulerTime
  }

  public averageAllocation() {
    return (
      this.qtdsAllocated.reduce((a, b) => a + b, 0) / this.qtdsAllocated.length
    )
  }
}
