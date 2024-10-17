import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js"
import { Router } from "../../../spa/Router.js";
import { GameService } from "../../service/Game.service.js";
import { GamePong } from "./GamePong.js"

export class PongComponent extends AComponent {
    inGame = false

    onInit() {
        if (!injector[GameService].inGame) {
            injector[Router].navigate('/');
            return false;
        }

        super.onInit();
        this.generateHtml({});

        return true;
    }

    static startPong(inputPoints, ballSpeed, theme, player1, player2, isTournament) {
        this.inGame = true;
        return new GamePong(ballSpeed, inputPoints, theme, player1, player2, isTournament);
    }

    getCSSPath() {
        return "app/component/Pong/Pong.component.css";
    }

    generateHtml(config) {
        this.html = `
            <div id="root-window">
                <div id="render-target"></div>
                <div id="render-score">
                    <li id="score-list">
                    </li>
                </div>
                <div id="render-text invisible"></div>
            </div>
        `;
    }
}