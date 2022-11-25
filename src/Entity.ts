import { EntitySet } from './EntitySet'

export class Entity {
  id: string | null
  name: string
  creationTime: number
  destroyedTime: number
  priority: number
  petriNet: any
  sets: EntitySet[]

  constructor({
    name,
    priority,
    petriNet,
  }: {
    name: string
    priority?: number
    petriNet?: any
  }) {
    this.id = null
    this.name = name
    this.priority = priority || -1
    this.petriNet = petriNet
    this.creationTime = 0
    this.destroyedTime = 0
    this.sets = []
  }

  public getId() {
    return this.id
  }

  public getName() {
    return this.name
  }

  public getPriority() {
    return this.priority
  }

  public getTimeSinceCreation(now: number): number {
    return now - this.creationTime
  }

  public getSets(): EntitySet[] {
    return this.sets
  }

  public setSet(entitySet: EntitySet) {
    this.sets.push(entitySet)
  }

  public setId(id: string) {
    this.id = id
  }

  public setPriority(priority: number) {
    this.priority = priority
  }

  public setCreationTime(time: number) {
    this.creationTime = time
  }

  public setDestroyedTime(time: number) {
    this.destroyedTime = time
  }

  public setPetriNet(petriNet: any) {
    this.petriNet = petriNet
  }

  public getPetriNet() {
    return this.petriNet
  }
}
