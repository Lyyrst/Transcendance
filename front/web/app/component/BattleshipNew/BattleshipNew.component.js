import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { GameService } from "../../service/Game.service.js";
import { UserService } from "../../service/User.service.js";
import { ButtonIconComponent } from "../ButtonIcon/ButtonIcon.component.js";
import { InputComponent } from "../Input/Input.Component.js";
import { NavBarComponent } from "../NavBar/NavBar.component.js";
import { RadioThemeComponent } from "../Radio/RadioTheme.component.js";

export class BattleshipNewComponent extends AComponent {
    playerOne = "";
	playerTwo = "";
    inputPoints = null;
    inputShot = null;
    theme = "one";
    params = {
        "points": false,
        'theme': false,
        'players': false,
        'shot': false
    }

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
			name: "shotInput",
			parentSelector: this.getSelector(),
			inputType: "number",
			placeholder: "1",
			onchange: (value) => {this.inputShot = value;; this.checkShotInput(); this.checkParams()}
		}));
        this.createSubComponent(InputComponent.create({
			name: "pointInput",
			parentSelector: this.getSelector(),
			inputType: "number",
			placeholder: "6",
			onchange: (value) => {this.inputPoints = value; this.checkInputPoint(); this.checkParams()}
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

        this.createSubComponent(new RadioThemeComponent(this.getSelector(), "themeBattleRadio"));
		this.subComponent["themeBattleRadio"].radioSelectSubscribe((value) => {this.theme = value; this.params.theme = true; this.checkParams()});

        this.setConfig({
			battleshipTitle: this.translate("battleship.battleshipTitle"),
			shot: this.translate("battleship.shot"),
			points: this.translate("battleship.points"),
			players: this.translate('battleship.players'),
            theme: this.translate('battleship.theme'),
            default: this.translate('battleship.default'),
		});

		if (injector[UserService].user) {
			this.playerOne = injector[UserService].user.username
		}

        this.checkParams();
        
        return true;
    }

    getCSSPath() {
        return 'app/component/BattleshipNew/BattleshipNew.component.css';
    }

    startGame(defaultparams = false) {
		injector[GameService].inGame = true;
        if (defaultparams) {
            injector[GameService].startNewBattleship(6, 1, 'one', injector[UserService].user.username, '');
        } else {
		    injector[GameService].startNewBattleship(this.inputPoints, this.inputShot, this.theme, this.playerOne, this.playerTwo);
        }
	}

    checkParams() {
		if (Object.values(this.params).some(value => value === false)) {
			this.subComponent["startButton"].disabled.next(true);
		} else {
			this.subComponent["startButton"].disabled.next(false);
		}
	}

	checkPlayersInput() {
		if (this.playerOne === "" && this.playerTwo === "") {
			this.params.players = false;
		} else {
			this.params.players = true;
		}
	}

    checkShotInput() {
		if (this.inputShot === "") {
			this.params.shot = false;
		} else if (this.inputShot < 1 || this.inputShot > 3 ) {
            this.subComponent["shotInput"].error.next(true);
			this.subComponent["shotInput"].errorText.next("battleship.shotError");
			this.params.points = false;
        } else {
            this.subComponent["shotInput"].error.next(false);
			this.params.shot = true;
		}
	}

    checkInputPoint() {
		if (this.inputPoints === "") {
			this.subComponent["pointInput"].error.next(false);
			this.params.points = false;
		} else if (this.inputPoints < 1 || this.inputPoints > 6) {
			this.subComponent["pointInput"].error.next(true);
			this.subComponent["pointInput"].errorText.next("battleship.pointsError");
			this.params.points = false;
		} else {
			this.subComponent["pointInput"].error.next(false);
			this.params.points = true;
		}
	}

    generateHtml(config) {
		this.html = `
            <div id='navbar'></div>
            <div class='container'>
                <div class='containerBlur mt-5'>
                    <div class="fs-1 fw-bold battleshipTitle text-center m-3">
						<span>${config.battleshipTitle}</span>
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
								<div class="fs-4 fw-semibold text-light my-2">${config.shot}</div>
                                <div class="d-flex justify-content-center m-2">
								    <div id="shotInput" class='inputContainer'></div>
                                </div>
							</div>
						</div>
                        <div class="col-md-4 text-center my-5">
                            <div class='m-3'>
                                <div class='fs-4 fw-semibold text-light'>${config.theme}</div>
                                <div id="themeBattleRadio"></div>
                            </div>
						</div>
                        <div class="col-md-4 text-center my-5">
							<div class="fs-4 fw-semibold text-light">
								<div>${config.points}</div>
								<div class="d-flex justify-content-center m-2">
									<div id="pointInput" class="inputContainer"></div>
								</div>
							</div>
							<div class="mt-5 pt-4">
								<div id="startButton"></div
							</div>
                            <div class="mt-5 pt-4">
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