import { ReplayObservable } from "./ReplayObservable.js";

export class MergedObservable extends ReplayObservable {
	func = [];

	constructor() {
		super();
		this.value = {};
	}

	mergeObservable(name, observable) {
		observable.subscribe((value) => {
			this.value[name] = value;
			this.func.forEach((value) => {
				this.triggerFunc(value.func);
			})
		});
		return this;
	}

	next() {
		throw new Error("next not implemented");
	}
}