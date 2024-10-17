import { ReplayObservable } from "../utils/ReplayObservable.js";
import { MergedObservable } from "../utils/MergedObservable.js";
import { fr } from "../../app/assets/i18n/fr.js";
import { en } from "../../app/assets/i18n/en.js";
import { it } from "../../app/assets/i18n/it.js";
import { AInjectable } from "./AInjectable.js";

export class TranslateService extends AInjectable {
	lang = new ReplayObservable();
	current = null;
	translateFile = {
		"fr": fr,
		"en": en,
		"it": it
	};

	constructor() {
		super();
		this.setLang("en");
	}

	translate(key, observable = false) {
		let keyObs = null;
		if (observable) {
			keyObs = key;
		} else {
			keyObs = new ReplayObservable();
			keyObs.next(key);
		}
		const mObs = new MergedObservable();
		mObs.setMappingFunc((mergeValue) => {
			let root = this.translateFile[mergeValue.lang];
			mergeValue.key.split(".").forEach((subKey) => {
				root = root[subKey];
			});
			return root ? root : mergeValue.lang + "." + mergeValue.key;
		});
		mObs.mergeObservable("lang", this.lang);
		mObs.mergeObservable("key", keyObs);
		return mObs;
	}

	resetObservable() {
		this.lang = new ReplayObservable();
		this.setLang(this.current);
	}

	setLang(lang) {
		this.current = lang;
		this.lang.next(lang);
	}
}