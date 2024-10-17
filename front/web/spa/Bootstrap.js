import { initBootstrap } from "../app/init.js";
import { TranslateService } from "./service/Translate.service.js";
import { Router } from "./Router.js";
import { HttpClient } from "./service/HttpClient.js";
import { TokenService } from "./service/Token.service.js";
import { MergedObservable } from "./utils/MergedObservable.js";

window.addEventListener("load", () => {
	if (!window.appLaunched) {
		new Bootstrap();
	}
});

export let injector = {};

class Bootstrap {
	constructor() {
		window.appLaunched = true;
		let allReady = new MergedObservable();
		injector[TranslateService] = new TranslateService().init();
		injector[HttpClient] = new HttpClient().init();
		injector[TokenService] = new TokenService().init();
		injector[Router] = new Router().init();
		injector = {...injector, ...initBootstrap()};
	
		Object.values(injector).forEach((element, id) => {
			allReady.mergeObservable(id, element.isReady);
		});
		allReady.subscribe((value) => {
			if (!Object.values(value).some(value => value === false)) {
				injector[Router].start()
			}
		});
	}
}