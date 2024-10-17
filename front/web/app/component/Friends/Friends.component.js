import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { FriendsService } from "../../service/Friends.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { FriendsListComponent } from "../FriendsList/FriendsList.component.js";
import { FriendsSearchListComponent } from "../FriendsSearchList/FriendsSearchList.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class FriendsComponent extends AComponent {
	searchInputContent = "";
	renderSearchBool = injector[FriendsService].renderSearchBool;
	renderFriendsListBool = injector[FriendsService].renderFriendsListBool;
	renderSearchBoolSubscription = null;
	renderFriendsListBoolSubscription = null;

	onInit() {
		if (!injector[UserService].user) {
            injector[Router].navigate("/auth");
			return false;
        }
		super.onInit();

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.createSubComponent(InputComponent.create({
			name: "searchInput",
			parentSelector: this.getSelector(),
			placeholder: "Search by name",
			onchange: (value) => this.searchInputContent = value,
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "searchButton",
			parentSelector: this.getSelector(),
			icon: "search",
			style: "btn",
			onclick: () => {injector[FriendsService].searchUser(this.searchInputContent); this.searchInputContent = ""},
		}));

		this.renderSearchBoolSubscription = this.renderSearchBool.subscribe(() => {
			this.createSubComponent(new FriendsSearchListComponent(this.getSelector(), "searchUserList"));
			this.createSubComponent(new FriendsListComponent(this.getSelector(), "friendsList"));
		});

		this.renderFriendsListBoolSubscription = this.renderFriendsListBool.subscribe(() => {
			this.createSubComponent(new FriendsSearchListComponent(this.getSelector(), "searchUserList"));
			this.createSubComponent(new FriendsListComponent(this.getSelector(), "friendsList"));
		});

		this.setConfig({
			noFriends: this.translate("friends.noFriends"),
			addFriends: this.translate("friends.addFriends"),
			friendsListTitle: this.translate("friends.friendsListTitle"),
			renderSearchList: this.renderSearchBool,
			renderFriendsListBool : this.renderFriendsListBool
		});

		injector[FriendsService].getFriendsList();

		return true;
	}

	destroy() {
		super.destroy();
		if (this.renderFriendsListBoolSubscription) {
			this.renderFriendsListBool.unsubscribe(this.renderFriendsListBoolSubscription);
		}
		if (this.renderSearchBoolSubscription) {
			this.renderSearchBool.unsubscribe(this.renderSearchBoolSubscription)
		}		
	}

	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
			<div class="container">
				<div class="row">
					<div class="containerBlur mt-5 col-md-6">
						<div class="fs-3 fw-semibold text-light text-center m-2">${config.friendsListTitle}</div>
						<div class="fs-4 fw-semibold text-danger text-center p-5" style="${config.renderFriendsListBool ? `display: none;` : ``}">${config.noFriends}</div>
						<div id="friendsList" style="${config.renderFriendsListBool ? `` : `display: none;`}"></div>
					</div>
					<div class="containerBlur mt-5 col-md-4 offset-md-1">
						<div class="fs-3 fw-semibold text-light text-center m-2">${config.addFriends}</div>
						<div class="row m-4">
							<div id="searchInput" class="col-10"></div>
							<div id="searchButton" class="col-2"></div>
						</div>
						<div id="searchUserList" style="${config.renderSearchList ? `` : `display: none;`};"></div>
					</div>
				</div>
			</div>
		`;
	}
}