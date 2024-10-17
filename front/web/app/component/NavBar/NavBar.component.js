import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { TranslateService } from "../../../spa/service/Translate.service.js";
import { UserService } from "../../service/User.service.js";
import { DropButtonIconComponent } from "../DropButtonIcon/DropButtonIcon.component.js";
import { IconComponent } from "../Icon/Icon.component.js";
import { TextButtonComponent } from "../textButton/TextButton.component.js";

export class NavBarComponent extends AComponent {
	username = injector[UserService].username;

	onInit() {
		super.onInit();
		this.generateHtml({});

		this.createSubComponent(IconComponent.create({
			name: "friendsIcon",
			parentSelector: this.getSelector(),
			icon: "friends",
			onclick: () => injector[Router].navigate("/friends")
		}));
		this.createSubComponent(IconComponent.create({
			name: "settingsIcon",
			parentSelector: this.getSelector(),
			icon: "settings"
		}));

		this.createSubComponent(TextButtonComponent.create({
			name: "homeButton",
			parentSelector: this.getSelector(),
			langKey: "navbar.home",
			onclick: () => injector[Router].navigate("/")
		}));
		this.createSubComponent(TextButtonComponent.create({
			name: "profileButton",
			parentSelector: this.getSelector(),
			langKey: "navbar.profile",
			text: this.username,
			onclick: () => injector[Router].navigate(injector[UserService].username.isEmpty() ? "/auth" : "/profile"),
		}));
	
		this.createSubComponent(IconComponent.create({
			name: "logoutButton",
			parentSelector: this.getSelector(),
			icon: "logout",
			onclick: () => injector[UserService].logout()
		}));

		this.createSubComponent(DropButtonIconComponent.create({
			name: "frenchIcon",
			parentSelector: this.getSelector(),
			icon: "french",
			onclick: () => injector[TranslateService].setLang("fr")
		}));

		this.createSubComponent(DropButtonIconComponent.create({
			name: "englishIcon",
			parentSelector: this.getSelector(),
			icon: "english",
			onclick: () => injector[TranslateService].setLang("en")
		}));
		this.createSubComponent(DropButtonIconComponent.create({
			name: "italianIcon",
			parentSelector: this.getSelector(),
			icon: "italian",
			onclick: () => injector[TranslateService].setLang("it")
		}));

		this.createSubComponent(DropButtonIconComponent.create({
			name: "pause",
			parentSelector: this.getSelector(),
			icon: "pause",
			onclick: () => injector[Router].bgVideo.videoSpeed.next(0)
		}));
		this.createSubComponent(DropButtonIconComponent.create({
			name: "play",
			parentSelector: this.getSelector(),
			icon: "play",
			onclick: () => injector[Router].bgVideo.videoSpeed.next(0.75)
		}));
		this.createSubComponent(DropButtonIconComponent.create({
			name: "playFill",
			parentSelector: this.getSelector(),
			icon: "playFill",
			onclick: () => injector[Router].bgVideo.videoSpeed.next(2)
		}));

		this.setConfig({
			auth: this.username
		});

		return true;
	}

	getCSSPath() {
		return "app/component/NavBar/NavBar.component.css";
	}

	generateHtml(config) {
		this.html = `
		<nav class="navbar navbar-expand-lg">
			<div class="container-fluid">
				<a id="homeButton" class="navbar-brand me-4 nav-item"></a>
        		<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown"
					aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            		<span class="navbar-toggler-icon"></span>
        		</button>
				<div class="navbarCollapse d-flex justify-content-between">
				</div>
        		<div class="collapse navbar-collapse" id="navbarNavDropdown">
					<div class="btn-group">
						<div class="dropdown pe-4">
							<button id="settingsIcon" class="btn nav-item dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"></button>
							<ul class="dropdown-menu dropdown-menu-dark"> 	
							<div class="text-center fs-6">Lang</div>
							<div class="d-flex justify-content-center">
								<li id="frenchIcon"></li>
								<li id="englishIcon"></li>
								<li id="italianIcon"></li>
							</div>
							<div class="line my-2"></div>
							<div class="text-center fs-6">Background Speed</div>
							<div class="d-flex justify-content-center">
								<li id="pause"></li>
								<li id="play"></li>
								<li id="playFill"></li>
							</div>
							</ul>
						</div>
						<a id="friendsIcon" class="navbar-brand nav-item me-5" style="${config.auth ? `` : `display: none;`};"></a>
						<a id="profileButton" class="navbar-brand navText nav-item me-5" ${config.auth ? `title="${config.auth}"` : `` }></a>
						<a id="logoutButton" class="navbar-brand nav-item me-5" style="${config.auth ? `` : `display: none;`};"></a>
					</div>
        		</div>
			</div>
		</nav>`
	}
}
