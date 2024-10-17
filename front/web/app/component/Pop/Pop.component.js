import { AComponent } from "../../../spa/component/AComponent.js"
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class PopComponent extends AComponent {
	style = new ReplayObservable()
	translateText = new ReplayObservable();

	onInit() {
		super.onInit();
		this.generateHtml({});

		this.setConfig({
			style: this.style,
			text : {
				value: this.translateText,
				translate: true
			}
		});

		setTimeout(function() {
			document.getElementById("pop").style.display = "none";
		}, 2500);
		
		return true;
	}

	static create(value) {
		let ret = new PopComponent(value.parentSelector, value.name);
		ret.style.next(value.style);
		ret.translateText.next(value.langKey)
		return ret;
	}

	getCSSPath() {
		return "app/component/Pop/Pop.component.css";
	}

	generateHtml(config) {
		this.html = `
			<div class="fs-5 fw-bold text-light text-center d-flex justify-content-center">
				<div class="${config.style ? "popSuccess" : "popDanger"}">
					<span class="p-4">${config.text}</span>
				</div
			</div>
		`;
	}
}