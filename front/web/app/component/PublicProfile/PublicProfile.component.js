import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";
import { FriendsService } from "../../service/Friends.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";
import { profilePictureComponent } from "../ProfilePicture/ProfilePicture.component.js";
import { TablesComponent } from "../Tables/Tables.component.js";

export class PublicProfileComponent extends AComponent {
	renderProfile = injector[UserService].userInformationsRender
	renderProfileSubscription = null;
	username = new ReplayObservable();
	pfp = "defaultPP";

	onInit() {
		if (this.pathArgument === "" || !injector[UserService].user) {
            injector[Router].navigate("/auth");
			return false;
        }
		injector[UserService].getUserInformations(this.pathArgument);
		super.onInit();

		this.renderProfileSubscription = this.renderProfile.subscribe((value) => {
			if (value) {
				this.pfp = value.pfp;
				this.createSubComponent(profilePictureComponent.create({
					name: "profilePicture",
					parentSelector: this.getSelector(),
					pfp: this.pfp,
				}));
				this.username.next(value.username);
			}
			// this.createSubComponent(new TablesComponent(this.getSelector(), 'history'));
		});

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.createSubComponent(ButtonIconComponent.create({
			name: "addFriendButton",
			parentSelector: this.getSelector(),
			icon: "addFriends",
			style: "btn",
			onclick: () => injector[FriendsService].addFriend(this.pathArgument),
		}));

		this.createSubComponent(new TablesComponent(this.getSelector(), 'history'));

		this.setConfig({
			renderProfile: this.renderProfile,
			noProfile: this.translate("publicProfile.noProfile"),
			username: this.username,
		});

		return true;
	}

	destroy() {
		super.destroy();
		if (this.renderProfileSubscription) {
			this.renderProfile.unsubscribe(this.renderProfileSubscription);
		}
	}

	getCSSPath() {
		return "app/component/PublicProfile/PublicProfile.component.css";
	}

	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
			<div class="container">
				<div class="containerBlur mt-5">
					<div class="fs-3 text-danger text-center" style="${config.renderProfile ? `display: none;` : ``}">${config.noProfile}</div>
					<div class="row m-5" style="${config.renderProfile ? `` : `display: none;`}">
						<div class="col-md-2 d-flex align-items-center justify-content-center">
							<div id="profilePicture">PROFILE PICTURE</div>
						</div>
						<div class="col-md-2 d-flex align-items-center justify-content-center">
							<div class="fs-3 profileName fw-bold">${config.username}</div>
						</div>
						<div class="col-md-4 offset-md-4 d-flex align-items-center justify-content-center">
							<div id="addFriendButton"></div>
						</div>
						<div class="line m-3"></div>
						<div class="m-3 d-flex justify-content-center">
							<div id="history" class="tablesContainer d-flex justify-content-center"></div>
						</div>	
					</div>
				</div>
			</div>
		`;
	}
}