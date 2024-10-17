import { injector } from "../../../spa/Bootstrap.js";
import { AComponent } from "../../../spa/component/AComponent.js";
import { TournamentService } from "../../service/Tournament.service.js";

export class MatchesListComponent extends AComponent {
	isRelativeHtml = true;

	onInit() {
		super.onInit();
		this.generateHtml({});

		Object.keys(injector[TournamentService].matchesList).forEach(id => {
			const match = injector[TournamentService].matchesList[id];
			if (!match.isEnd) {
				document.querySelector(this.getSelector()).innerHTML += `
					<div class='line my-4'></div>
						<div class='fs-1 fw-bold text-info text-center'>${Number(id) + 1}</div>
					<div class='d-flex'>
						<div class='fs-3 text-light d-flex justify-content-center matchItem'>${match.player1}</div>
						<div class='fs-2 fw-bold text-light d-flex justify-content-center vsItem'>VS</div>
						<div class='fs-3 text-light d-flex justify-content-center matchItem'>${match.player2}</div>
					</div>
				`;
			} else {
				document.querySelector(this.getSelector()).innerHTML += `
					<div class='line my-4'></div>
					<div class='d-flex justify-content-around'>
						<div class='fs-3 text-success d-flex justify-content-center matchItem'>${match.winner}</div>
						<div class='fs-3 text-success d-flex justify-content-center matchItem'>${match.winner_score}</div>
						<div class='fs-2 fw-bold text-light d-flex justify-content-center vsItem'>VS</div>
						<div class='fs-3 text-danger d-flex justify-content-center matchItem'>${match.looser_score}</div>
						<div class='fs-3 text-danger d-flex justify-content-center matchItem'>${match.looser}</div>
					</div>
				`;
			}
		});

		return true;
	}

	getCSSPath() {
		return 'app/component/MatchesList/MatchesList.component.css';
	}

	generateHtml(config) {
		this.html = `
			<div></div>
		`;
	}
}