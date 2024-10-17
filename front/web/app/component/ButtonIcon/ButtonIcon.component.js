import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { IconComponent } from "../Icon/Icon.component.js";

export class ButtonIconComponent extends AComponent {
	style = new ReplayObservable();
	disabled = new ReplayObservable();
	id = new ReplayObservable();

	initConfig() {
		this.setConfig({
			style: this.style,
			disabled: this.disabled,
			id: this.id,
		});
	}

	static create(value) {
		let ret = new ButtonIconComponent(value.parentSelector, value.name);
		if (value.onclick) {
			ret.registerOnClick(value.onclick);
		}
		let name = "iconId";
		if (value.id) {
			ret.id.next(value.id);
			name = "icon" + value.id
		} else {
			ret.id.next("Id");
		}
		ret.createSubComponent(IconComponent.create({
			name: name,
			parentSelector: ret.getSelector(),
			icon: value.icon,
		}));
		ret.style.next(value.style);
		ret.disabled.next(false);
		return ret;
	}
	
	generateHtml(config) {
		this.html = `
			<button id="${"icon" + config.id}" type="button" class="${config.style}" ${config.disabled ? "disabled" : ""}></button>
		`;
	}
}