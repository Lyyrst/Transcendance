import { Observable } from "./Observable.js"

export class ReplayObservable extends Observable {
	subscribe(newFunc) {
		this.triggerFunc(newFunc);
		return super.subscribe(newFunc);
	}
}