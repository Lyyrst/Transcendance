import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js"
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { FriendsService } from "../../service/Friends.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";

export class FriendsSearchComponent extends AComponent {
	pseudo = new ReplayObservable();
	id = new ReplayObservable();

	static create(value) {
		let ret = new FriendsSearchComponent(value.parentSelector, value.name);
		ret.pseudo.next(value.pseudo);
		ret.id.next(value.id)
		let name = `${"addButton" + value.id}`
		ret.createSubComponent(ButtonIconComponent.create({
			name: name,
			parentSelector: ret.getSelector(),
			icon: "addFriends",
			style: "btn",
			onclick: () => injector[FriendsService].addFriend(value.pseudo),
			id: value.id,
		}));
		return ret;
	}

	initConfig() {
		this.setConfig({
			pseudo: this.pseudo,
			id: this.id,
		});
	}

	generateHtml(config) {
		this.html = `
			<div class="line"></div>
			<div class="row">
				<div class="col-5 fs-5 text-light text-center m-3">${config.pseudo}</div>
				<div id="${"addButton" + config.id}" class="col-4 text-center m-3"></div>
			</div>
		`;
	}
}