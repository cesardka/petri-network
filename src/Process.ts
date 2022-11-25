export class Process {
  name: string
  id: string | null
  duration: () => number
  active: boolean

  constructor(name: string, duration: () => number) {
    this.id = null
    this.name = name
    this.duration = duration
    this.active = true
  }

  public getId() {
    return this.id
  }

  public getDuration() {
    return this.duration
  }

  public setId(id: string): void {
    this.id = id
  }

  public isActive(): boolean {
    return this.active
  }

  public setActive(active: boolean) {
    this.active = active
  }

  public canExecute() {
    return true
  }

  public executeOnStart() {}

  public executeOnEnd(): void {}
}
