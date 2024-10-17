import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { GameService } from "../../service/Game.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";

export class ResultComponent extends AComponent {
	winner = injector[GameService].winner;
	winnerScore = injector[GameService].winnerScore;
	looser = injector[GameService].looser;
	looserScore = injector[GameService].looserScore;
	isPong = injector[GameService].isPong;
	isTournement = injector[GameService].isTournement;
	lastMatch = injector[GameService].lastMatch;

	onInit() {
		if (!injector[UserService].user) {
            injector[Router].navigate("/auth");
			return false;
        }
		super.onInit();

		this.createSubComponent(new NavBarComponent(this.getSelector(), 'navbar'));

		this.createSubComponent(ButtonIconComponent.create({
			name: 'returnHomeButton',
			parentSelector: this.getSelector(),
			icon: 'return',
			style: 'btn',
			onclick: () => injector[Router].navigate('/'),
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: 'returnTournementButton',
			parentSelector: this.getSelector(),
			icon: 'return',
			style: 'btn',
			onclick: () => injector[Router].navigate('/tournament/match'),
		}));

		this.setConfig({
			isPong: this.isPong,
			isTournement: this.isTournement,
			isMatch: this.lastMatch,
			pongTitle: this.translate("result.pongTitle"),
			battleshipTitle: this.translate("result.battleshipTitle"),
			winner: this.translate('result.winner'),
			looser: this.translate('result.looser'),
			noMatch: this.translate('result.noMatch'),
			winnerUsername: this.winner,
			winnerScore: this.winnerScore,
			looserUsername: this.looser,
			looserScore: this.looserScore
		});

		injector[GameService].lastMatchInformations();
		return true;
	}

	generateHtml(config) {
		this.html = `
			<div id='navbar'></div>
				<div class="container">
					<div class="containerBlur">
						<div style="${config.isMatch ? `` : `display: none;`}">
							<div class="fs-1 text-light fw-bold text-center mt-3">${config.isPong ? config.pongTitle : config.battleshipTitle}</div>
							<div class="line mt-4"></div>
							<div class="d-flex justify-content-center">
								<div class="m-5 text-center text-light">
									<div class="fs-2 fw-semibold text-success">${config.winner}</div>
									<div class="fs-4">${config.winnerUsername}</div>
									<div class="fs-4">${config.winnerScore}</div>
								</div>
								<div class="m-5 text-center text-light">
									<div class="fs-2 fw-semibold text-danger">${config.looser}</div>
									<div class="fs-4">${config.looserUsername}</div>
									<div class="fs-4">${config.looserScore}</div>
								</div>
							</div>
							<div class="text-center m-3">
								<div style="${config.isTournement ? `` : `display: none;`}">
									<div id='returnTournementButton'></div>
								</div>
								<div style="${config.isTournement ? `display: none;` : ``}">
									<div id='returnHomeButton'></div>
								</div>
							</div>
						</div>
						<div style="${config.isMatch ? `display: none;` : ``}">
							<div class="fs-1 text-center text-danger m-3">${config.noMatch}</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}