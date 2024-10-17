import { AComponent } from "../../../spa/component/AComponent.js";
import { Observable } from "../../../spa/utils/Observable.js";

export class RadioThemeComponent extends AComponent {
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
		document.getElementsByName("themeBattleRadio").forEach(element => {
			element.addEventListener("change", () => {
				this.radioSelect.next(element.id); 
			});
		});
	}

	generateHtml(config) {
		this.html = `
			<input type="radio" class="btn-check" name="themeBattleRadio" id="one" autocomplete="off">
			<label for="one" class="btn btn-outline-primary">1</label>
			
			<input type="radio" class="btn-check" name="themeBattleRadio" id="two" autocomplete="off">
			<label for="two" class="btn btn-outline-primary">2</label>

			<input type="radio" class="btn-check" name="themeBattleRadio" id="tree" autocomplete="off">
			<label for="tree" class="btn btn-outline-primary">3</label>
		`;
	}
}