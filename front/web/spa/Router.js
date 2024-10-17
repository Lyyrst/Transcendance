import { initErrorPage, initRouter } from "../app/init.js";
import { TranslateService } from "./service/Translate.service.js";
import { injector } from "./Bootstrap.js";
import { BackgroundComponent } from "../app/component/Background/Background.component.js";
import { AInjectable } from "./service/AInjectable.js";
import { Observable } from "./utils/Observable.js";
import { GameService } from "../app/service/Game.service.js";

export class Router extends AInjectable {
	routes = initRouter();
	errorPage = initErrorPage();
	bgVideo = null;
	windowPath = new Observable();
	loadedPage = null;
	routerSelector = "#router"

	start() {
		this.windowPath.subscribe((path) => {
			if (injector[GameService].currentGame) {
				injector[GameService].currentGame.OnDestroy(true);
			}
			let splitPath = path.split('/');
			const route = this.routes.find((value) => {
					let splitValuePath = value.path.split('/');
					return splitValuePath.length === splitPath.length && ((splitValuePath[splitValuePath.length - 1].includes(':') && splitValuePath.slice(0, -1).every(item => splitPath.slice(0, -1).includes(item))) || path === value.path);
				});
				let pathArgument = splitPath[splitPath.length - 1];
				if (route == undefined) {
					this.loadPage(this.errorPage, pathArgument);
				} else
					this.loadPage(route, pathArgument);
			});
		this.windowPath.next(window.location.pathname);
		window.addEventListener("popstate", (event) => {
			this.windowPath.next(window.location.pathname);
		});
		this.bgVideo = new BackgroundComponent("body", "bgVideo");
		this.bgVideo.onInit();
		this.bgVideo.render();
	}

	loadPage(route, pathArgument) {
		injector[TranslateService].resetObservable();
		if (this.loadedPage) {
			this.loadedPage.destroy();
		}
		this.loadedPage = new route.component(this.routerSelector, route.selector, {}, pathArgument);
		document.querySelector(this.routerSelector).innerHTML = 
		`<div id='${this.loadedPage.getComponentSelector()}'></div>`;
		if(this.loadedPage.onInit()) {
			this.loadedPage.render();
		}
	}

	async navigate(path, byPass = false) {
		if (!byPass && (path === window.location.pathname)) {
			return ;
		}

		window.history.pushState({}, "", path);
		this.windowPath.next(path);
	}

}
