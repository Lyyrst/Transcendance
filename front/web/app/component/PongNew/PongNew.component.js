import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { GameService } from "../../service/Game.service.js";
import { TournamentService } from "../../service/Tournament.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";
import { RadioComponent } from "../Radio/Radio.component.js";
import { RadioImgComponent } from "../RadioImg/RadioImg.component.js";

export class PongNewComponent extends AComponent {
	playerOne = "";
	playerTwo = "";
	inputPoints = 5;
	ballSpeed = "normal";
	theme = "theme1";
	params = {
		"points": false,
		"theme": false,
		"ball": false,
		"players": false,
	};

	onInit() {
		if (!injector[UserService].user) {
            injector[Router].navigate("/auth");
			return false;
        }
		super.onInit();
		this.generateHtml({});

		this.createSubComponent(new NavBarComponent(this.getSelector(), "navbar"));

		this.createSubComponent(InputComponent.create({
			name: "playerOneInput",
			parentSelector: this.getSelector(),
			inputType: "text",
			placeholder: "player one",
			onchange: (value) => {this.playerOne = value; this.checkPlayersInput(); this.checkParams();}
		}));
		this.createSubComponent(InputComponent.create({
			name: "playerTwoInput",
			parentSelector: this.getSelector(),
			inputType: "text",
			placeholder: "player two",
			onchange: (value) => {this.playerTwo = value; this.checkPlayersInput(); this.checkParams();}
		}));

		this.createSubComponent(InputComponent.create({
			name: "pointInput",
			parentSelector: this.getSelector(),
			inputType: "number",
			placeholder: "5",
			onchange: (value) => {this.inputPoints = value;; this.checkInputPoint(); this.checkParams()}
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "startButton",
			parentSelector: this.getSelector(),
			icon: "arrow",
			style: "btn btn-outline-info",
			onclick: () => this.startGame()
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: "defaultButton",
			parentSelector: this.getSelector(),
			icon: "arrow",
			style: "btn btn-outline-success",
			onclick: () => this.startGame(true)
		}));
		this.createSubComponent(ButtonIconComponent.create({
			name: 'tournamentButton',
			parentSelector: this.getSelector(),
			icon: 'arrow',
			style: 'btn btn-outline-light-emphasis',
			onclick: () => injector[TournamentService].createTournament(this.playerOne, this.playerTwo, this.inputPoints, this.ballSpeed, this.theme),
		}));

		this.createSubComponent(new RadioComponent(this.getSelector(), "ballRadio"));
		this.subComponent["ballRadio"].radioSelectSubscribe((value) => {this.ballSpeed = value; this.params.ball = true; this.checkParams()});

		this.createSubComponent(new RadioImgComponent(this.getSelector(), "themeRadio"));
		this.subComponent["themeRadio"].radioSelectSubscribe((value) => {this.theme = value; this.params.theme = true; this.checkParams()});

		this.setConfig({
			pongTitle: this.translate("pongNew.pongTitle"),
			ball: this.translate("pongNew.ball"),
			points: this.translate("pongNew.points"),
			players: this.translate('pongNew.players'),
			default: this.translate('pongNew.default'),
			tournamentTitle: this.translate('pongNew.tournamentTitle'),
			start: this.translate('pongNew.start')
		});

		if (injector[UserService].user) {
			this.playerOne = injector[UserService].user.username
		}

		this.checkParams();

		return true;
	}

	startGame(defaultparams = false, is_tournament = false) {
		injector[GameService].inGame = true;
		if (defaultparams) {
			injector[GameService].startNewPong('5', 'normal', 'theme1', injector[UserService].user.username, '', is_tournament);
		} else {
			injector[GameService].startNewPong(this.inputPoints, this.ballSpeed, this.theme, this.playerOne, this.playerTwo, is_tournament);
		}
	}

	checkParams() {
		if (Object.values(this.params).some(value => value === false)) {
			this.subComponent["startButton"].disabled.next(true);
			this.subComponent["tournamentButton"].disabled.next(true);
		} else {
			this.subComponent["startButton"].disabled.next(false);
			this.subComponent["tournamentButton"].disabled.next(false);
		}
		this.subComponent["tournamentButton"].disabled.next(false);
		this.subComponent["startButton"].disabled.next(false);
	}

	checkPlayersInput() {
		if (this.playerOne === "" && this.playerTwo === "") {
			this.params.players = false;
		} else {
			this.params.players = true;
		}
	}

	checkInputPoint() {
		if (this.inputPoints === "") {
			this.subComponent["pointInput"].error.next(false);
			this.params.points = false;
		} else if (this.inputPoints <= 0 || this.inputPoints > 10) {
			this.subComponent["pointInput"].error.next(true);
			this.subComponent["pointInput"].errorText.next("pongNew.inputError");
			this.params.points = false;
		} else {
			this.subComponent["pointInput"].error.next(false);
			this.params.points = true;
		}
	}

	getCSSPath() {
		return "app/component/PongNew/PongNew.component.css";
	}

	generateHtml(config) {
		this.html = `
			<div id="navbar"></div>
			<div class="container">
				<div class="containerBlur mt-5">
					<div class="fs-1 fw-bold newPongTitle text-center m-3"
						<span>${config.pongTitle}</span>
					</div>
					<div class="line"></div>
					<div class="row">
						<div class="col-md-4 text-center my-5">
							<div class="fs-4 fw-semibold text-light my-2">${config.players}</div>
							<div class="d-flex justify-content-center m-2">
								<div id="playerOneInput" class="inputContainer"></div>
							</div>
							<div class="d-flex justify-content-center m-2">
								<div id="playerTwoInput" class="inputContainer"></div>
							</div>
							<div class="my-5">
								<div class="fs-4 fw-semibold text-light my-2">${config.ball}</div>
								<div id="ballRadio"></div>
							</div>
						</div>
						<div class="col-md-4 text-center my-5">
							<div id="themeRadio" class="row d-flex justify-content-center"></div>
						</div>
						<div class="col-md-4 text-center my-5">
							<div class="fs-4 fw-semibold text-light">
								<div>${config.points}</div>
								<div class="d-flex justify-content-center m-2">
									<div id="pointInput" class="inputContainer"></div>
								</div>
							</div>
							<div class="mt-5 pt-4">
								<div class='fs-5 text-light fw-semibold'>${config.start}</div>
								<div id="startButton"></div
							</div>
							<div class='m-3 pt-4'>
								<div class='fs-5 text-light fw-semibold'>${config.tournamentTitle}</div>
								<div id='tournamentButton'></div>
							</div>
							<div class="m-3 pt-4">
                                <div class='text-success fw-semibold fs-5'>${config.default}</div>
								<div id="defaultButton"></div
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}