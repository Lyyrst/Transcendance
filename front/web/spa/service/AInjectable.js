import { ReplayObservable } from "../utils/ReplayObservable.js";

export class AInjectable {
	isReady = new ReplayObservable()

	init() {
		this.isReady.next(true);
		return this;
	}
}