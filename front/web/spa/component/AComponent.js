import { TranslateService } from "../service/Translate.service.js";
import { injector } from "../Bootstrap.js";
import { MergedObservable } from "../utils/MergedObservable.js"
import { Observable } from "../utils/Observable.js";

export class AComponent {
	parentSelector = "";
	componentSelector = "";
	pathArgument = "";
	html = "";
	onChangeValue = "";
	componentConfig = null;
	isInit = false;
	configObservable = new MergedObservable();
	onChange = new Observable();
	onClick = new Observable();
	subComponent = {};
	configSubscription = null;
	onClickSubscription = null;
	onChangeSubscription = null;
	onChangeFile = false;
	isRelativeHtml = false;
	
	constructor(parentSelector, componentSelector, componentConfig, pathArgument) {
		this.parentSelector = parentSelector;
		this.componentSelector = componentSelector;
		this.componentConfig = componentConfig;
		this.pathArgument = pathArgument;
	}

	onInit() {
		if (this.getCSSPath() && !document.querySelector(`link[href='${this.getCSSPath()}']`))
			document.querySelector("head").innerHTML += `<link href='${this.getCSSPath()}' rel='stylesheet'>`;
		this.initConfig();
		this.isInit = true;
	}

	initConfig() {}

	getComponentSelector() {
		return this.componentSelector;
	}

	getSelector() {
		return this.parentSelector + " #" + this.getComponentSelector();
	}

	registerOnClick(func) {
		this.onClickSubscription = this.onClick.subscribe(func);
	}

	registerOnChange(func) {
		this.onChangeSubscription = this.onChange.subscribe(func);
	}

	render() {
		if (this.isRelativeHtml) {
			document.querySelector(this.getSelector()).innerHTML += this.getHtml();
		} else {
			document.querySelector(this.getSelector()).innerHTML = this.getHtml();
		}
		this.getChildComponent().forEach((value) => {
			if (!value.isInit)
				value.onInit();
			value.render();
		});
		document.querySelector(this.getSelector()).children[0].onclick = () => this.onClick.next({});
		document.querySelector(this.getSelector()).children[0].addEventListener("change", (event) => {
			const specifiedValue = this.onChangeFile ? event.target.files[0] : event.target.value;
			this.onChangeValue = specifiedValue;
			this.onChange.next(specifiedValue, !this.onChangeFile);
		});
	}

	destroy() {
		this.getChildComponent().forEach((value) => {
			value.destroy();
		});
		if (this.onClickSubscription) {
			this.onClick.unsubscribe(this.onClickSubscription);
		}
		if (this.onChangeSubscription) {
			this.onChange.unsubscribe(this.onChangeSubscription);
		}
		this.configObservable.unsubscribe(this.configSubscription);
	}

	createSubComponent(aComponent) {
		this.subComponent[aComponent.getComponentSelector()] = aComponent;
	}

	getHtml() {
		return this.html;
	}

	getChildComponent() {
		return Object.values(this.subComponent);
	}

	getCSSPath() {}

	generateHtml(config) {
		throw new Error("generateHtmnl not implemented");
	}

	setConfig(config) {
		let keys = Object.keys(config);
		keys.forEach((value) => {
			let obs = config[value];
			if (obs.translate) {
				obs = injector[TranslateService].translate(obs.value, true);
			}
			this.configObservable.mergeObservable(value, obs);
		});
		this.configSubscription = this.configObservable.subscribe((conf) => {
			Object.keys(conf).forEach((key) => {
				conf[key] = this.escapeHtml(conf[key]);
			});
			this.generateHtml(conf);
			if (this.isInit)
				this.render();
		});
	}

	escapeHtml(unsafe) {
		if (typeof unsafe !== "string") {
			return unsafe
		}
		const map = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		};
		return unsafe != null ? unsafe.replace(/[&<>"']/g, (match) => map[match]) : undefined;
	}

	translate(key) {
		return injector[TranslateService].translate(key);
	}

}
