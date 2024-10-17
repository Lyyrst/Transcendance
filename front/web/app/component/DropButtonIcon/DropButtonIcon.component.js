import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { IconComponent } from "../Icon/Icon.component.js";

export class DropButtonIconComponent extends AComponent {
	clickable = new ReplayObservable();
	
	initConfig() {
		this.setConfig({
			clickable: this.clickable
		});
	}

	static create(value) {
		let ret = new DropButtonIconComponent(value.parentSelector, value.name);
		if (value.onclick) {
			ret.registerOnClick(value.onclick);
			ret.clickable.next("true");
		}
		ret.createSubComponent(IconComponent.create({
			name: "icon",
			parentSelector : ret.getSelector(),
			icon: value.icon,
		}));
		return ret;
	}

	generateHtml(config) {
		this.html = `
			<a id="icon" class="dropdown-item" style="cursor:${config.clickable ? "pointer" : "inherit"};"></a>
		`;
	}
}
