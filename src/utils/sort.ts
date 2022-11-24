export const sorter = (a: string, b: string) => {
  let numA = Number(a)
  let numB = Number(b)
  if (numA < numB) {
    return -1
  } else if (numA > numB) {
    return 1
  }
  return 0
}
