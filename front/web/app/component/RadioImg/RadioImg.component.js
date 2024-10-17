import { AComponent } from "../../../spa/component/AComponent.js";
import { Observable } from "../../../spa/utils/Observable.js";

export class RadioImgComponent extends AComponent {
	radioSelect = new Observable();
	
	onInit() {
		super.onInit();
		this.generateHtml({});

		return true;
	}

	render() {
		super.render();
		document.getElementsByName("themeRadio").forEach(element => {
			element.addEventListener("change", () => {
				this.radioSelect.next(element.id); 
			});
		});
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
	
	getCSSPath() {
		return "app/component/RadioImg/RadioImg.component.css";
	}

	generateHtml(config) {
		this.html = `
			<div class="radioDiv col-md-6 my-2">
				<input type="radio" class="btn-check radioInput" name="themeRadio" id="theme1" autocomplete="off">
				<label class="btn radioLabel" for="theme1"><img class="radioImg" src="https://${document.location.host}/app/assets/img/theme1.png"></label>
			</div>

			<div class="radioDiv col-md-6 my-2">
				<input type="radio" class="btn-check radioInput" name="themeRadio" id="theme2" autocomplete="off">
				<label class="btn radioLabel" for="theme2"><img class="radioImg" src="https://${document.location.host}/app/assets/img/theme2.png"></label>
			</div>

			<div class="radioDiv col-md-6 my-2">
				<input type="radio" class="btn-check radioInput" name="themeRadio" id="theme3" autocomplete="off">
				<label class="btn radioLabel" for="theme3"><img class="radioImg" src="https://${document.location.host}/app/assets/img/theme3.png"></label>
			</div>
			
			<div class="radioDiv col-md-6 my-2">
				<input type="radio" class="btn-check radioInput" name="themeRadio" id="theme4" autocomplete="off">
				<label class="btn radioLabel" for="theme4"><img class="radioImg" src="https://${document.location.host}/app/assets/img/theme4.png"></label>
			</div>	
			`;
	}
}