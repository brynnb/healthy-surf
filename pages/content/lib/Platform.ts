export default class Platform {
  name: string;
  filterFunction: () => void;

  constructor(name: string, filterFunction: () => void) {
    this.name = name;
    this.filterFunction = filterFunction;
  }

  runFiltering() {
    this.filterFunction();
  }
}
