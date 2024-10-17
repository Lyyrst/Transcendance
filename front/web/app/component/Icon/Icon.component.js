import { AComponent } from "../../../spa/component/AComponent.js";
import { ReplayObservable } from "../../../spa/utils/ReplayObservable.js";

export class IconComponent extends AComponent {
	icon = new ReplayObservable();
	clickable = new ReplayObservable();
	id = new ReplayObservable();
	
	iconList = {
		"friends": "friends.svg",
		"settings": "gear.svg",
		"french": "FrenchFlag.svg",
		"english": "UKingdomFlag.svg",
		"italian": "ItalyFlag.svg",
		"pause": "bi-pause.svg",
		"play": "bi-play.svg",
		"playFill": "bi-play-fill.svg",
		"arrow": "arrow.svg",
		"defaultProfilePicture": "defaultPP.svg",
		"modifier": "modifier.svg",
		"logout": "logout.svg",
		"search": "search.svg",
		"addFriends": "addFriends.svg",
		"removeFriends": "removeFriends.svg",
		"profile": "profile.svg",
		"42": "42.svg",
		"check": "check.svg",
		"notCheck": "notCheck.svg",
		"download": "download.svg",
		"delete": "delete.svg",
		'return': 'return.svg',
	}

	initConfig() {
		this.setConfig({
			icon: this.icon,
			clickable: this.clickable
		});
	}

	static create(value) {
		let ret = new IconComponent(value.parentSelector, value.name);
		if (value.onclick) {
			ret.registerOnClick(value.onclick);
			ret.clickable.next(true);
		}
		ret.icon.next(value.icon);
		return ret;
	}

	generateHtml(config) {
		this.html = `
			<img style="cursor:${config.clickable ? "pointer" : "inherit"};" src="https://${document.location.host}/app/assets/icon/${this.iconList[config.icon]}">
		`
	}
}