import { AComponent } from "../../../spa/component/AComponent.js";

export class InputFileComponent extends AComponent {
	onChangeFile = true;

	initConfig() {
		this.setConfig({
			inputText: this.translate("inputFile.text")
		});
	}

	static create(value) {
		let ret = new InputFileComponent(value.parentSelector, value.name);
		ret.registerOnChange(value.onchange);
		return ret;
	}

	getCSSPath() {
		return "app/component/InputFile/InputFile.component.css";
	}

	generateHtml(config) {
		this.html = `
			<input class="form-control inputFile" type="file" id="formFile" accept="image/png">
		`;
	}
}