import { AComponent } from "../../../spa/component/AComponent.js";
import { Observable } from "../../../spa/utils/Observable.js";

export class RadioComponent extends AComponent {
	radioSelect = new Observable();
	radioSelectSubscription = null;

	onInit() {
		super.onInit();
		this.generateHtml({});

		return true;
	}

	destroy() {
		super.destroy();
		if (this.radioSelectSubscription) {
			this.radioSelect.unsubscribe(this.radioSelectSubscription);
		}
	}

	radioSelectSubscribe(func) {
		this.radioSelectSubscription = this.radioSelect.subscribe(func);
	}

	render() {
		super.render();
		document.getElementsByName("ballSpeedRadio").forEach(element => {
			element.addEventListener("change", () => {
				this.radioSelect.next(element.id); 
			});
		});
	}

	generateHtml(config) {
		this.html = `
			<input type="radio" class="btn-check" name="ballSpeedRadio" id="slow" autocomplete="off">
			<label for="slow" class="btn btn-outline-primary">Slow</label>
			
			<input type="radio" class="btn-check" name="ballSpeedRadio" id="normal" autocomplete="off">
			<label for="normal" class="btn btn-outline-primary">Normal</label>

			<input type="radio" class="btn-check" name="ballSpeedRadio" id="fast" autocomplete="off">
			<label for="fast" class="btn btn-outline-primary">Fast</label>
		`;
	}
}