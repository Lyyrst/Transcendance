import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { FriendsService } from "../../service/Friends.service.js";
import { FriendsSearchComponent } from "../FriendsSearch/FriendsSearch.component.js";

export class FriendsSearchListComponent extends AComponent {
	isRelativeHtml = true;

	onInit() {
		super.onInit();
		this.generateHtml({});

		if (injector[FriendsService].searchList) {
			Object.keys(injector[FriendsService].searchList).forEach(id => {
				const searchUser = injector[FriendsService].searchList[id];
				document.querySelector(this.getSelector()).innerHTML += `<div id="${"sub" + id}"></div>`;
				this.createSubComponent(FriendsSearchComponent.create({
					name: `${"sub" + id}`,
					parentSelector: this.getSelector(),
					pseudo: searchUser.username,
					id: id
				}));
			});
		}
	}

	generateHtml(config) {
		this.html =`
			<div></div>
		`;
	}
}