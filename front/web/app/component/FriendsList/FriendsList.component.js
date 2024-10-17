import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { FriendsService } from "../../service/Friends.service.js";
import { FriendsListRowComponent } from "../FriendsListRow/FriendsListRow.component.js";

export class FriendsListComponent extends AComponent {
	isRelativeHtml = true;
	
	onInit() {
		super.onInit();
		this.generateHtml({});

		if (injector[FriendsService].friendsList) {
			Object.keys(injector[FriendsService].friendsList).forEach(id => {
				const friend = injector[FriendsService].friendsList[id];
				document.querySelector(this.getSelector()).innerHTML += `<div id="${"friend" + id}">${id}</div>`;
				this.createSubComponent(FriendsListRowComponent.create({
					name: `${"friend" + id}`,
					parentSelector: this.getSelector(),
					pseudo: friend.username,
					active: friend.is_online,
					id: id
				}));
			});
		}

		return true;
	}

	generateHtml(config) {
		this.html = `
			<div></div>
		`;
	}
}