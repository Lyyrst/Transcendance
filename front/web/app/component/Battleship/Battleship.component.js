import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { Router } from "../../../spa/Router.js";
import { GameService } from "../../service/Game.service.js";
import { GameBattleship } from "./GameBattleship.js";

export class BattleshipComponent extends AComponent {
    game = {}
    inGame = false;

    onInit(){
        if (!injector[GameService].inGame) {
            injector[Router].navigate('/');
            return false;
        }

        super.onInit();
        this.generateHtml({});
        
        return true;
    }

    static startBattleship(points, shot, theme, playerOne, playerTwo) {
        this.inGame = true;
        let colorOne;
        let colorTwo;
        
        switch (theme) {
            case 'one':
                colorOne = 'Blue';
                colorTwo = 'Red';
                break;
            case 'two':
                colorOne = 'Black';
                colorTwo = 'Whiite';
                break;
            case 'tree':
                colorOne = 'Whiite';
                colorTwo = 'Blue';
                break;
            default:
                colorOne = 'Blue';
                colorTwo = 'Red';
        }
        this.game = new GameBattleship(playerOne, playerTwo, colorOne, colorTwo, points, shot);
        this.game.Start();
    }
    
    getCSSPath() {
        return "app/component/Battleship/Battleship.component.css";
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