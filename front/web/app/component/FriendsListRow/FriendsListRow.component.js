import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { FriendsService } from "../../service/Friends.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";

export class FriendsListRowComponent extends AComponent {
	pseudo = new ReplayObservable();
	id = new ReplayObservable();
	active = new ReplayObservable();

	static create(value) {
		let ret = new FriendsListRowComponent(value.parentSelector, value.name);

		ret.pseudo.next(value.pseudo);
		ret.id.next(value.id);
		ret.active.next(value.active);
		const addName = `${"removeButton" + value.id}`;
		const profileName = `${"profileButton" + value.id}`;
		ret.createSubComponent(ButtonIconComponent.create({
			name: addName,
			parentSelector: ret.getSelector(),
			icon: "removeFriends",
			style: "btn",
			onclick: () => injector[FriendsService].removeFriend(value.pseudo),
			id: value.id
		}));

		ret.createSubComponent(ButtonIconComponent.create({
			name: profileName,
			parentSelector: ret.getSelector(),
			icon: "profile",
			style: "btn",
			onclick: () => injector[Router].navigate("/profile/" + value.pseudo),
			id: value.id
		}))

		return ret;
	}

	initConfig() {
		this.setConfig({
			pseudo: this.pseudo,
			id: this.id,
			active: this.active,
		});
	}

	generateHtml(config) {
		this.html = `
			<div class="line"></div>
			<div class="row">
				<div class="col-5 fs-3 fw-bold text-center m-3 ${config.active ? "text-success" : "text-danger"}">${config.pseudo}</div>
				<div id="${"removeButton" + config.id}" class="col-2 text-center m-3"></div>
				<div id="${"profileButton" + config.id}" class="col-2 text-center m-3"></div>
			</div>
		`;
	}
}