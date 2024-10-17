import { AInjectable } from "../../spa/service/AInjectable.js";
import { PopComponent } from "../component/Pop/Pop.component.js";

export class PopService extends AInjectable {
	constructor() {
		super();
	}

	renderPop(containerStyle, langKey) {
		document.querySelector("#pop").innerHTML = ``;
		document.getElementById("pop").style.display = "";
		
		let popUp = PopComponent.create({
			name: "pop",
			parentSelector: "body",
			style: containerStyle,
			langKey: langKey
		});

		popUp.onInit();
		popUp.render();
	}
}