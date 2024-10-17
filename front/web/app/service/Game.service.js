import { injector } from "../../spa/Bootstrap.js";
import { TokenError } from "../../spa/error/TokenError.js";
import { Router } from "../../spa/Router.js";
import { AInjectable } from "../../spa/service/AInjectable.js";
import { HttpClient } from "../../spa/service/HttpClient.js";
import { TokenService } from "../../spa/service/Token.service.js";
import { ReplayObservable } from "../../spa/utils/ReplayObservable.js";
import { BattleshipComponent } from "../component/Battleship/Battleship.component.js";
import { PongComponent } from "../component/Pong/Pong.component.js";
import { PopService } from "./Pop.service.js";

export class GameService extends AInjectable {
	winner = new ReplayObservable();
	winnerScore = new ReplayObservable();
	looser = new ReplayObservable();
	looserScore = new ReplayObservable();
	isPong = new ReplayObservable();
	isBattleship = new ReplayObservable();
	isTournement = new ReplayObservable();
	lastMatch = new ReplayObservable();
	currentGame = null;

	constructor() {
		super();
	}

	startNewPong(points, ballSpeed, theme, player1, player2, is_tournament) {
		injector[HttpClient].post("startNewPong/", {
			points: points,
			ballSpeed: ballSpeed,
			theme: theme,
			playerOne: player1,
			playerTwo: player2,
			is_tournament: is_tournament,
		}, true).then(response => {
			if (response.ok) {
				this.currentGame = PongComponent.startPong(response.points, response.theme, response.ballSpeed, response.playerOne, response.playerTwo, response.isTournament);
				injector[Router].navigate('/pong');
				this.currentGame.Start();
			} else {
				injector[PopService].renderPop(false, "pop.startPongDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	startNewBattleship(points, shot, theme, player1, player2) {
		injector[HttpClient].post("startNewBattle/", {
			points: points,
			shot: shot,
			theme: theme,
			playerOne: player1,
			playerTwo: player2,
		}, true).then(response => {
			if (response.ok) {
				injector[Router].navigate('/battleship');
				this.currentGame = BattleshipComponent.startBattleship(response.points, response.shot, response.theme, response.playerOne, response.playerTwo);
			} else {
				injector[PopService].renderPop(false, "pop.startPongDanger");
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	sendResult(score, isPong, isTournement) {
		injector[HttpClient].post('recordGame/', {
			winner: score.winner,
			winner_score: score.winnerScore,
			looser_score: score.looserScore,
			is_pong: isPong,
			is_tournement: isTournement
		}, true).then(response => {
			if (response.ok) {
				this.lastMatchInformations();
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}

	lastMatchInformations() {
		injector[HttpClient].get('lastMatchInformations/', {}, true).then(response => {
			if (response.ok) {
				this.winner.next(response.last_match.winner);
				this.winnerScore.next(response.last_match.winner_score);
				this.looser.next(response.last_match.looser);
				this.looserScore.next(response.last_match.looser_score);
				if (response.last_match.is_pong) {
					this.isPong.next(true);
					this.isBattleship.next(false);
				} else {
					this.isPong.next(false);
					this.isBattleship.next(true);
				}
				this.lastMatch.next(true);
				this.isTournement.next(response.last_match.is_tournement);
				injector[Router].navigate('/result');
			} else {
				this.lastMatch.next(false);
			}
		}).catch(error => {
			if (error instanceof TokenError) {
				injector[TokenService].deleteCookie();
			}
		});
	}
}