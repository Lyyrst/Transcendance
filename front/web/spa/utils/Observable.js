let generateSubscribeId = 0;

export class Observable {
	value = null;
	func = [];
	mappingFunc = null;

	subscribe(newFunc) {
		let object = {
			func: newFunc,
			id: generateSubscribeId++
		}
		this.func.push(object);
		return object.id;
	}
	
	unsubscribe(id) {
		this.func = this.func.filter(element => element.id !== id);
	}

	next(newValue, normalized = true, repeat = false) {
		if (newValue == this.value && !repeat) {
			return ;
		}
		this.value = newValue;
		this.func.forEach((value) => {
			this.triggerFunc(value.func, normalized);
		});
	}

	setMappingFunc(func) {
		this.mappingFunc = func;
	}

	triggerFunc(func, normalized) {
		let ret = undefined;
		if (this.value != undefined) {
			ret = normalized ? JSON.parse(JSON.stringify(this.value)) : this.value;
		}
		if (this.mappingFunc)
			ret = this.mappingFunc(this.value);
		func(ret);
	}

	isEmpty() {
		return !this.value;
	}
}
