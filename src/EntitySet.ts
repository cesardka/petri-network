import colors from 'colors'
import { Entity } from './Entity'
import { scheduler } from '.'

export const enum Mode {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  P_BASED = 'P_BASED',
  NONE = 'NONE',
}

interface TimeInSet {
  [key: string]: {
    duration: number
    creation: number
  }
}

interface Log {
  time: number
  size: number
}

export class EntitySet {
  id: string | null
  name: string
  mode: Mode
  set: Entity[]
  maxPossibleSize: number

  setSize: number[]
  setTime: TimeInSet
  log: Log[]
  isRunningLog: boolean
  timeGap: number
  lastLogTime: number

  constructor(name: string, mode: Mode, maxPossibleSize: number) {
    this.id = null
    this.name = name
    this.mode = mode
    this.maxPossibleSize = maxPossibleSize
    this.set = []
    this.setSize = []
    this.setTime = {}
    this.log = []
    this.isRunningLog = false
    this.timeGap = 0
    this.lastLogTime = 0
  }

  public getId() {
    return this.id
  }

  public getMode() {
    return this.mode
  }

  public getEntitySet() {
    return this.set
  }

  public setMode(mode: Mode) {
    this.mode = mode
  }

  public setId(id: string) {
    this.id = id
  }

  public insert(entity: Entity) {
    if (this.isFull()) {
      console.error(colors.blue('EntitySet is full'))
      return
    }
    if (!entity.id) {
      console.error(colors.blue('Id not setted in entity'))
      return
    }

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.NONE:
        this.set.push(entity)
        break
      case Mode.LIFO:
        this.set.unshift(entity)
        break
      case Mode.P_BASED:
        if (entity.priority >= 0 && entity.priority <= 255) {
          this.set.push(entity)
          this.set.sort((a, b) => a.priority - b.priority)
        } else {
          console.error(
            colors.blue(
              `insert() priority based: Prioridade inválida (${entity.getPriority()}) na entidade com id = ${entity.getId()} `
            )
          )
        }
        break
    }

    this.setTime[entity.id] = {
      duration: 0,
      creation: scheduler.getTime(),
    }

    this.updateSetSize()
  }

  public remove() {
    let entityRemoved

    switch (this.mode) {
      case Mode.FIFO:
      case Mode.LIFO:
      case Mode.P_BASED:
        entityRemoved = this.set.shift()
        break
      case Mode.NONE:
        const rand = randomInteger(0, this.set.length - 1)
        entityRemoved = this.removeById(this.set[rand].getId() as string)

        break
    }

    scheduler.isDebbuger &&
      console.log(
        'remove-entitySet: Entity name --> ',
        entityRemoved?.getName(),
        'Entity id --> ',
        entityRemoved?.getId()
      )

    if (!entityRemoved || !entityRemoved.id) {
      console.error(colors.blue('Unable to remove Entity'))
      return
    }

    this.updateSetSize()

    const entityTime = this.setTime[entityRemoved.id]

    entityTime.duration = scheduler.getTime() - entityTime.creation
    console.log(`entityRemoved.getName()`, entityRemoved.getName())
    console.log(`scheduler.getTime()`, scheduler.getTime())
    console.log(`entityTime.creation`, entityTime.creation)

    return entityRemoved
  }

  public removeById(id: string): Entity | null {
    const index = this.set.findIndex(entity => entity.id === id)
    const [removed] = this.set.splice(index, 1)

    if (!removed || !removed.id) {
      console.error(colors.blue('Unable to remove Entity'))
      return null
    }
    this.updateSetSize()

    const entityTime = this.setTime[removed.id]
    entityTime.duration = scheduler.getTime() - entityTime.creation

    return removed
  }

  private updateSetSize() {
    this.setSize.push(this.set.length)
  }

  public isEmpty() {
    return this.set.length === 0
  }

  public isFull() {
    if (this.maxPossibleSize === 0) {
      return false
    }

    return this.set.length === this.maxPossibleSize
  }

  public findEntity(id: string): Entity | undefined {
    return this.set.find(entity => entity.id !== id)
  }

  // Coleta de estatísticas
  public averageSize(): number {
    return this.setSize.reduce((a, b) => a + b, 0) / this.setSize.length
  }

  public getSize(): number {
    return this.set.length
  }

  public getMaxPossibleSize(): number {
    return this.maxPossibleSize
  }

  public setMaxPossibleSize(size: number) {
    this.maxPossibleSize = size
  }

  private calculateDurations() {
    let total = 0
    let max = 0

    const timeValues = Object.values(this.setTime).filter(
      time => time.duration !== 0
    )

    for (const time of timeValues) {
      total += time.duration

      if (time.duration > max) {
        max = time.duration
      }
    }
    const mean = timeValues.length > 0 ? total / timeValues.length : 0
    return { mean, max }
  }

  public averageTimeInSet() {
    return this.calculateDurations().mean
  }

  public maxTimeInSet() {
    return this.calculateDurations().max
  }

  public timeCallback(time: number) {
    if (this.isRunningLog && time - this.lastLogTime >= this.timeGap) {
      this.log.push({ time, size: this.set.length })
      this.lastLogTime = time
    }
  }

  public startLog(timeGap: number): void {
    this.isRunningLog = true
    this.timeGap = timeGap
  }

  public stopLog(): void {
    this.isRunningLog = false
  }

  public getLog(): Log[] {
    return this.log
  }
}

export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
