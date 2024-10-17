import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { UserService } from "../../service/User.service.js";

export class profilePictureComponent extends AComponent {
	pfp = injector[UserService].pfp;
	pfpUrl = new ReplayObservable();

	initConfig() {
		this.setConfig({
			pfpUrl: this.pfpUrl
		});
	}

	static create(value) {
		let ret = new profilePictureComponent(value.parentSelector, value.name);
		if (value.pfp) {
			ret.pfpUrl.next(value.pfp === "defaultPP" ? `https://${document.location.host}/app/assets/icon/defaultPP.svg` : value.pfp);
		} else {
			ret.pfpUrl.next(ret.pfp.isEmpty() ? `https://${document.location.host}/app/assets/icon/defaultPP.svg` : injector[UserService].user.pfp);
		}
		return ret;
	}

	getCSSPath() {
		return "app/component/ProfilePicture/ProfilePicture.component.css";
	}

	generateHtml(config) {
		this.html = `
			<img class="pfpImg" src="${config.pfpUrl}">
		`;
	}
}