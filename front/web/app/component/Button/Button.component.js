import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class ButtonComponent extends AComponent {
	style = new ReplayObservable();
	disabled = new ReplayObservable();
	content = new ReplayObservable();

	initConfig() {
		this.setConfig({
			style: this.style,
			disabled: this.disabled,
			content: this.content
		});
	}

	static create(value) {
		let ret = new ButtonComponent(value.parentSelector, value.name);
		if (value.onclick) {
			ret.registerOnClick(value.onclick);

		}
		ret.style.next(value.style);
		ret.disabled.next(false);
		ret.content.next(value.content);
		return ret
	}
	
	generateHtml(config) {
		this.html = `
			<button type="button" class="${config.style}" ${config.disabled ? "disabled" : ""}>${config.content}</button>
		`;
	}
}