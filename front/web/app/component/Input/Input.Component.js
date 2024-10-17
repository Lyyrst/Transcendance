import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class InputComponent extends AComponent {
	inputType = new ReplayObservable();
	placeholder = new ReplayObservable();
	autocomplete = new ReplayObservable();
	error = new ReplayObservable();
	errorText = new ReplayObservable();

	initConfig() {
		this.setConfig({
			inputType: this.inputType,
			placeholder: this.placeholder,
			autocomplete: this.autocomplete,
			error: this.error,
			errorText: {value: this.errorText, translate: true}
		});
	}

	static create(value) {
		let ret = new InputComponent(value.parentSelector, value.name);
		ret.inputType.next(value.inputType);
		if (value.placeholder) {
			ret.placeholder.next(value.placeholder);
		} else {
			ret.placeholder.next("");
		}
		if (value.autocomplete) {
			ret.autocomplete.next(value.autocomplete);
		} else {
			ret.autocomplete.next("");
		}
		ret.registerOnChange(value.onchange);
		ret.error.next(false);
		ret.errorText.next("");
		return ret;
	}

	getCSSPath() {
		return "app/component/Input/Input.component.css";
	}

	generateHtml(config) {
		this.html = `
			<input type="${config.inputType}" class="form-control input ${config.error ? "inputError" : ""}" ${config.autocomplete} placeholder="${config.placeholder}" value="${this.onChangeValue}">
			${config.error ? `<div class="errorText ms-2 fs-6">${config.errorText}</div>` : ""}
		`;
	}
}