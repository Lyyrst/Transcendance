import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js"
import { Router } from "../../../spa/Router.js";
import { BattleshipComponent } from "../Battleship/Battleship.component.js";
import { ButtonComponent } from "../Button/Button.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js"
import { TextButtonComponent } from "../textButton/TextButton.component.js";

export class HomeComponent extends AComponent {
	inputId = "";
	
	onInit() {
		super.onInit();
		this.generateHtml({});

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.createSubComponent(ButtonComponent.create({
			name: "pongButton",
			parentSelector: this.getSelector(),
			style: "btn btn-outline-success",
			content: "PLAY",
			onclick: () => injector[Router].navigate("/pong/new")
		}));
		this.createSubComponent(ButtonComponent.create({
			name: "battleButton",
			parentSelector: this.getSelector(),
			style: "btn btn-outline-success",
			content: "PLAY",
			onclick: () => injector[Router].navigate("/battleship/new")
		}));

		this.createSubComponent(TextButtonComponent.create({
			name: 'tournamentButton',
			parentSelector: this.getSelector(),
			langKey: "home.tournamentButton",
			onclick: () => injector[Router].navigate('/tournament'),
		}));

		this.setConfig({
			pongTitle: this.translate("home.pongTitle"),
			battleTitle: this.translate("home.battleTitle"),
			pongContent: this.translate("home.pongContent"),
			pongContentBis: this.translate("home.pongContentBis"),
			battleContent: this.translate("home.battleContent"),
			battleContentBis: this.translate("home.battleContentBis")
		});

		return true;
	}

	getCSSPath() {
		return "app/component/Home/Home.component.css";
	}

	generateHtml(config) {
		this.html = `
		<div id="navbar"></div>
			<div class="container">
				<div class="containerBlur mt-5">
					<div class="row">
						<div class="col-md-6 text-center my-5">
							<p class="fs-1 fw-bold pongTitle">${config.pongTitle}</p>
							<span class="fs-5 text-light">${config.pongContent}</span>
							<p class="fs-5 text-light d-flex align-items-start justify-content-center">${config.pongContentBis}</p>
							<div id="pongButton"></div>
						</div>
						<div class="col-md-6 text-center my-5">
							<p class="fs-1 fw-bold battleTitle">${config.battleTitle}</p>
							<span class="fs-5 text-light">${config.battleContent}</span>
							<p class="fs-5 text-light">${config.battleContentBis}</p>
							<div id="battleButton"></div>
						</div>
					</div>
					<div class='line my-4'></div>
					<div class='text-center text-info fs-4 m-5'>
						<div id='tournamentButton'></div>
					</div>
				</div>
			</div>
		</div>`;
	}

}
