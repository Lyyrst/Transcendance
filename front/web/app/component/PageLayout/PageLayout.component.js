import { AComponent } from "../../../spa/component/AComponent.js"
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class PageLayoutComponent extends AComponent {
	onInit() {
		super.onInit();
		this.generateHtml({});
	
		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		return true;
	}
	
	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
		`
	}
}