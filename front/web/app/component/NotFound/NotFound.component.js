import { AComponent } from "../../../spa/component/AComponent.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class NotFoundComponent extends AComponent {
	
	onInit() {
		super.onInit();
		this.generateHtml({});

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.setConfig({
			notFoundText: this.translate("notFound.text")
		});

		return true;
	}

	getCSSPath() {
		return "app/component/NotFound/NotFound.component.css";
	}

	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
			<div class="container">
				<div class="containerBlur mt-5">
					<div class="text-center my-5">
						<span class="fs-1 fw-bold text-danger">404</span>
						<p class="fs-3 text-danger">${config.notFoundText}</p>
					</div>
				</div>
			</div>
		`;
	}
}