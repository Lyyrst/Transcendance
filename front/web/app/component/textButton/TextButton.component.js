import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class TextButtonComponent extends AComponent {
	translateText = new ReplayObservable();
	observableText = new ReplayObservable();
	
	initConfig() {
		this.setConfig({
			text: {
				value: this.translateText,
				translate: true
			},
			observableText: this.observableText
		});
	}

	static create(value) {
		let ret = new TextButtonComponent(value.parentSelector, value.name);
		ret.registerOnClick(value.onclick);
		if (value.text) {
			ret.observableText = value.text;
		}
		ret.translateText.next(value.langKey);
		return ret;
	}

	getCSSPath() {
		return "app/component/textButton/TextButton.component.css";
	}

	generateHtml(config) {
		this.html = `
			<span class="buttonText">${config.observableText ? config.observableText : config.text}</span>
		`;
	}
}