import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { UserService } from "../../service/User.service.js";

export class RadioIconComponent extends AComponent {
    radioSelect = new ReplayObservable();
    fr = new ReplayObservable();
    en = new ReplayObservable();
    it = new ReplayObservable();

    onInit() {
        super.onInit();
        this.generateHtml({});

        this.changeCheckLang(injector[UserService].user.defaultLang);
        this.setConfig({
            fr: this.fr,
            en: this.en,
            it: this.it
        });

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
        document.getElementsByName("langRadio").forEach(element => {
            element.addEventListener("change", () => {
                this.radioSelect.next(element.id);
                this.changeCheckLang(element.id)
            });
        });
    }

    getCSSPath() {
		return "app/component/RadioIcon/RadioIcon.component.css";
	}

    changeCheckLang(value) {
        switch (value) {
            case 'fr':
                this.fr.next(true)
                this.en.next(false)
                this.it.next(false)
                break;
            case 'en':
                this.fr.next(false)
                this.en.next(true)
                this.it.next(false)
                break;
            case 'it':
                this.fr.next(false)
                this.en.next(false)
                this.it.next(true)
                break;
            default :
            this.changeCheckLang("en");
        }
    }

    generateHtml(config) {
        this.html = `
            <div class="d-flex">
                <div class="radioIconDiv">
                    <input type="radio" class="btn-check radioIconInput" name="langRadio" id="fr" autocomplete="off" ${config.fr ? "checked" : ""}>
                    <label class="btn radioIconLabel" for="fr"><img class="radioIconImg" src="https://${document.location.host}/app/assets/icon/FrenchFlag.svg"></label>
                </div>

                <div class="radioIconDiv">
                    <input type="radio" class="btn-check radioIconInput" name="langRadio" id="en" autocomplete="off" ${config.en ? "checked" : ""}>
                    <label class="btn radioIconLabel" for="en"><img class="radioIconImg" src="https://${document.location.host}/app/assets/icon/UKingdomFlag.svg"></label>
                </div>

                <div class="radioIconDiv">
                    <input type="radio" class="btn-check radioIconInput" name="langRadio" id="it" autocomplete="off" ${config.it ? "checked" : ""}>
                    <label class="btn radioIconLabel" for="it"><img class="radioIconImg" src="https://${document.location.host}/app/assets/icon/ItalyFlag.svg"></label>
                </div>    
            </div>    
        `;
    }
}